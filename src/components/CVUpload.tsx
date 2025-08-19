'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, FileText, X, CheckCircle, AlertCircle, Image, Camera } from 'lucide-react';
import { UploadResponse } from '@/types/cv';
import toast from 'react-hot-toast';
import { playErrorSound, playSuccessSound, playUploadCompleteSound, playModalOpenSound, playModalCloseSound, playClickSound, playWarningSound, playLoadingSound, initializeNotificationSounds } from '@/utils/notificationSound';
import { useNotifications } from '@/contexts/NotificationContext';
import { usePendingUpload } from '@/contexts/PendingUploadContext';

interface CVUploadProps {
  onSuccess?: () => void;
  onClose?: () => void;
  onUploadStart?: () => void;
}

interface UploadFile {
  file: File;
  id: string;
  status: 'pending' | 'uploading' | 'success' | 'error';
  progress: number;
  error?: string | undefined;
  preview?: string;
}

const CVUpload: React.FC<CVUploadProps> = ({ onSuccess, onClose, onUploadStart }) => {
  const { addNotification } = useNotifications();
  const { incrementPending, decrementPending } = usePendingUpload();
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Cleanup object URLs on unmount and initialize notification sounds
  useEffect(() => {
    // Initialize notification sounds on component mount
    initializeNotificationSounds();
    
    return () => {
      files.forEach(file => {
        if (file.preview) {
          URL.revokeObjectURL(file.preview);
        }
      });
    };
  }, [files]);

  // Camera functionality
  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment', // Use back camera by default
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        } 
      });
      setStream(mediaStream);
      setShowCamera(true);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      playClickSound();
    } catch (error) {
      console.error('Error accessing camera:', error);
      toast.error('Unable to access camera. Please check permissions and try again.');
      playErrorSound();
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setShowCamera(false);
    playClickSound();
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      if (context) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0);
        
        canvas.toBlob((blob) => {
          if (blob) {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const file = new File([blob], `camera-capture-${timestamp}.jpg`, { type: 'image/jpeg' });
            const fileList = new DataTransfer();
            fileList.items.add(file);
            addFiles(fileList.files);
            stopCamera();
            playSuccessSound();
            toast.success('Photo captured successfully!');
          }
        }, 'image/jpeg', 0.9);
      }
    }
  };

  const validateFile = (file: File): string | null => {
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp'
    ];
    
    if (!allowedTypes.includes(file.type)) {
      return 'Only PDF, Word documents, and images (JPEG, PNG, GIF, WebP) are allowed';
    }
    
    if (file.size > 10 * 1024 * 1024) { // 10MB
      return 'File size must be less than 10MB';
    }
    
    return null;
  };

  const addFiles = (newFiles: FileList | File[]) => {
    const fileArray = Array.from(newFiles);
    const validFiles: UploadFile[] = [];
    
    fileArray.forEach(file => {
      const error = validateFile(file);
      const isImage = file.type.startsWith('image/');
      let preview: string | undefined;
      
      if (isImage && !error) {
        preview = URL.createObjectURL(file);
      }
      
      validFiles.push({
        file,
        id: Math.random().toString(36).substr(2, 9),
        status: error ? 'error' : 'pending',
        progress: 0,
        error: error || undefined,
        preview
      });
    });
    
    setFiles(prev => [...prev, ...validFiles]);
  };

  const removeFile = (id: string) => {
    setFiles(prev => {
      const fileToRemove = prev.find(f => f.id === id);
      if (fileToRemove?.preview) {
        URL.revokeObjectURL(fileToRemove.preview);
      }
      return prev.filter(f => f.id !== id);
    });
    playClickSound();
  };

  const uploadFiles = async (filesToUpload: UploadFile[]): Promise<void> => {
    const formData = new FormData();
    
    // Append all files as attachments with proper naming
    filesToUpload.forEach((uploadFile, index) => {
      formData.append(`attachment_${index}`, uploadFile.file, uploadFile.file.name);
    });
    
    // Add metadata about the files
    formData.append('fileCount', filesToUpload.length.toString());
    formData.append('fileNames', JSON.stringify(filesToUpload.map(f => f.file.name)));

    try {
      // Set all files to uploading status
      setFiles(prev => prev.map(f => 
        filesToUpload.some(uf => uf.id === f.id)
          ? { ...f, status: 'uploading', progress: 0 }
          : f
      ));

      // Increment pending count for the batch upload
      incrementPending();
      playLoadingSound();

      const response = await fetch('https://n8n.srv943319.hstgr.cloud/webhook/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const result: UploadResponse = await response.json();
      
      // Set all files to success status
      setFiles(prev => prev.map(f => 
        filesToUpload.some(uf => uf.id === f.id)
          ? { ...f, status: 'success', progress: 100 }
          : f
      ));

      // Decrement pending count for successful batch upload
      decrementPending();
      
      // Parse webhook response for notification details
      let notificationTitle = 'CV Analysis Complete!';
      let notificationMessage = 'Please reload the CV records to see updates.';
      if (result && result.status === 'success') {
          const candidateName = result.candidate || 'Candidate';
          notificationTitle = `${candidateName} CV is done`;
          notificationMessage = `CV analysis completed successfully for ${candidateName}`;
      }
      addNotification({
        title: notificationTitle,
        message: notificationMessage,
        type: 'success',
        persistent: true,
        autoClose: false,
        duration: 12000
      });
      playUploadCompleteSound();
    } catch (error) {
      // Set all files to error status
      setFiles(prev => prev.map(f => 
        filesToUpload.some(uf => uf.id === f.id)
          ? { 
              ...f, 
              status: 'error', 
              progress: 0, 
              error: error instanceof Error ? error.message : 'Upload failed'
            }
          : f
      ));

      // Decrement pending count for failed batch upload
      decrementPending();
      
      // Show error notification
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      // Add error notification
      addNotification({
        title: 'Upload Failed',
        message: `${errorMessage}. Please try again or contact support if the issue persists.`,
        type: 'error',
        persistent: true,
        autoClose: false,
        duration: 10000
      });
      playErrorSound();
      
      // Also show toast for immediate feedback
      toast.error(
        (t) => (
          <div className="flex items-start justify-between w-full">
            <div className="flex items-start gap-3">
              <div className="text-2xl">❌</div>
              <div className="flex-1">
                <div className="font-bold text-lg mb-2 text-white">Upload Failed</div>
                <div className="space-y-1 text-sm text-white/90">
                  <div className="flex items-start gap-2">
                    <span className="text-red-200 mt-0.5">⚠️</span>
                    <span className="flex-1">{errorMessage}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-orange-200">🔄</span>
                    <span>Please try again or contact support if the issue persists</span>
                  </div>
                </div>
              </div>
            </div>
            <button
              onClick={() => toast.dismiss(t.id)}
              className="ml-4 text-white/70 hover:text-white transition-colors duration-200 text-xl font-bold leading-none"
              aria-label="Close notification"
            >
              ×
            </button>
          </div>
        ),
        {
          duration: 8000,
          style: {
            background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 50%, #b91c1c 100%)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '16px',
            boxShadow: '0 25px 50px -12px rgba(239, 68, 68, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(16px)',
            maxWidth: '500px',
            padding: '20px 24px'
          }
        }
      );
    }
  };

  const handleUploadAll = async () => {
    const pendingFiles = files.filter(f => f.status === 'pending');
    if (pendingFiles.length === 0) return;

    setIsUploading(true);
    
    try {
      // Trigger upload start callback
      if (onUploadStart) {
        onUploadStart();
      }
      
      // Close modal immediately after starting upload
      if (onClose) {
        onClose();
      }
      
      await uploadFiles(pendingFiles);
      
      // Check if all uploads were successful
      const hasErrors = files.some(f => f.status === 'error');
      if (!hasErrors && onSuccess) {
        onSuccess();
      }
    } finally {
      setIsUploading(false);
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles.length > 0) {
      addFiles(droppedFiles);
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (selectedFiles && selectedFiles.length > 0) {
      addFiles(selectedFiles);
      playClickSound();
    }
    // Reset input value to allow selecting the same file again
    e.target.value = '';
  };

  const getStatusIcon = (status: UploadFile['status'], isImage: boolean = false) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      case 'uploading':
        return <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />;
      default:
        return isImage ? <Image className="w-4 h-4 text-gray-400" /> : <FileText className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: UploadFile['status']) => {
    switch (status) {
      case 'success':
        return 'text-green-600';
      case 'error':
        return 'text-red-600';
      case 'uploading':
        return 'text-blue-600';
      default:
        return 'text-gray-600';
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const pendingFiles = files.filter(f => f.status === 'pending');
  const hasValidFiles = pendingFiles.length > 0;

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <Card 
        className={`border-2 border-dashed transition-all duration-200 ${
          isDragOver 
            ? 'border-red-400 bg-red-50' 
            : 'border-red-200 hover:border-red-300'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <CardContent className="p-8">
          <div className="text-center">
            <div className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-4 ${
              isDragOver ? 'bg-red-100' : 'bg-gray-100'
            }`}>
              <Upload className={`w-6 h-6 ${
                isDragOver ? 'text-red-600' : 'text-gray-400'
              }`} />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {isDragOver ? 'Drop files here' : 'Upload CV Files & Photos'}
            </h3>
            <p className="text-gray-500 mb-4">
              Drag and drop your CV files and photos here, or click to browse
            </p>
            <input
              type="file"
              multiple
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.webp"
              onChange={handleFileSelect}
              className="hidden"
              id="file-upload"
            />
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <label htmlFor="file-upload">
                <Button 
                  type="button"
                  variant="outline"
                  className="border-red-200 text-red-600 hover:bg-red-50 cursor-pointer"
                  asChild
                >
                  <span>
                    <FileText className="w-4 h-4 mr-2" />
                    Choose Files
                  </span>
                </Button>
              </label>
              <Button 
                type="button" 
                onClick={startCamera}
                variant="outline"
                className="border-red-200 text-red-600 hover:bg-red-50"
              >
                <Camera className="w-4 h-4 mr-2" />
                Take Photo
              </Button>
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Supported formats: PDF, DOC, DOCX, JPEG, PNG, GIF, WebP (max 10MB each)
            </p>
          </div>
        </CardContent>
      </Card>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium text-gray-900">Selected Files</h4>
          {files.map((uploadFile) => {
            const isImage = uploadFile.file.type.startsWith('image/');
            return (
              <Card key={uploadFile.id} className="border-red-100">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 flex-1">
                      {/* File preview or icon */}
                      <div className="flex-shrink-0">
                        {uploadFile.preview ? (
                          <div className="w-12 h-12 rounded-lg overflow-hidden border border-gray-200">
                            <img 
                              src={uploadFile.preview} 
                              alt={uploadFile.file.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-12 h-12 rounded-lg border border-gray-200 flex items-center justify-center bg-gray-50">
                            {getStatusIcon(uploadFile.status, isImage)}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {uploadFile.file.name}
                        </p>
                        <div className="flex items-center space-x-2 text-xs text-gray-500">
                          <span>{formatFileSize(uploadFile.file.size)}</span>
                          <span className="text-gray-300">•</span>
                          <span className="capitalize">{isImage ? 'Image' : 'Document'}</span>
                          <span className="text-gray-300">•</span>
                          <span className={getStatusColor(uploadFile.status)}>
                            {uploadFile.status === 'pending' && 'Ready to upload'}
                            {uploadFile.status === 'uploading' && 'Uploading...'}
                            {uploadFile.status === 'success' && 'Upload complete'}
                            {uploadFile.status === 'error' && (uploadFile.error || 'Upload failed')}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(uploadFile.id)}
                      className="text-gray-400 hover:text-red-600"
                      disabled={uploadFile.status === 'uploading'}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  {uploadFile.status === 'uploading' && (
                    <div className="mt-3">
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div 
                          className="bg-red-600 h-1.5 rounded-full transition-all duration-300"
                          style={{ width: `${uploadFile.progress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Upload Button */}
      {hasValidFiles && (
        <div className="flex justify-end space-x-2">
          <Button
            variant="outline"
            onClick={() => setFiles([])}
            disabled={isUploading}
            className="border-red-200 text-red-600 hover:bg-red-50"
          >
            Clear All
          </Button>
          <Button
            onClick={handleUploadAll}
            disabled={isUploading || !hasValidFiles}
            className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white"
          >
            {isUploading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Upload {pendingFiles.length} File{pendingFiles.length !== 1 ? 's' : ''}
              </>
            )}
          </Button>
        </div>
      )}

      {/* Success Message */}
      {files.length > 0 && files.every(f => f.status === 'success') && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            All files uploaded successfully! The CVs are being processed.
          </AlertDescription>
        </Alert>
      )}

      {/* Camera Modal */}
      {showCamera && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-4 max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Capture CV Photo</h3>
              <Button
                onClick={stopCamera}
                variant="outline"
                size="sm"
                className="text-gray-600 hover:text-gray-800"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="relative bg-black rounded-lg overflow-hidden mb-4">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full h-auto max-h-[60vh] object-contain"
              />
              <canvas
                ref={canvasRef}
                className="hidden"
              />
            </div>
            
            <div className="flex justify-center gap-4">
              <Button
                onClick={capturePhoto}
                className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white"
              >
                <Camera className="w-4 h-4 mr-2" />
                Capture Photo
              </Button>
              <Button
                onClick={stopCamera}
                variant="outline"
                className="border-gray-300 hover:bg-gray-50"
              >
                Cancel
              </Button>
            </div>
            
            <p className="text-xs text-gray-500 text-center mt-4">
              Position the CV document within the camera view and tap "Capture Photo"
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default CVUpload;