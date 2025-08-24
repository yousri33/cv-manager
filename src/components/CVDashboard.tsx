'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import toast from 'react-hot-toast';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CVRecord, CVApiResponse } from '@/types/cv';
import { Upload, Search, FileText, Users, TrendingUp, Eye, Copy, Download, CheckCircle, Loader2, RefreshCw, Volume2, VolumeX, Menu, Camera, ImageIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Modal from '@/components/ui/modal';
import NotificationBell from './NotificationBell';
import Sidebar from './Sidebar';
import { useNotifications } from '@/contexts/NotificationContext';
import {
  playSearchSound,
  playToggleSound,
  playLoadingSound,
  playNewNotificationSound,
  playClickSound,
  playSuccessSound,
  playErrorSound,
  playModalOpenSound,
  playModalCloseSound,
  playHoverSound,
  enableNotificationSounds,
  isNotificationSoundEnabled,
  initializeNotificationSounds
} from '@/utils/notificationSound';

const CVDashboard = () => {
  const router = useRouter();
  const { triggerUploadNotificationSync, addNotification } = useNotifications();
  const [records, setRecords] = useState<CVRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('uploadDate');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [selectedRecord, setSelectedRecord] = useState<CVRecord | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Upload state
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Camera and composition state
  const [showCamera, setShowCamera] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [selectedForComposition, setSelectedForComposition] = useState<number[]>([]);
  const [compositionQuality, setCompositionQuality] = useState<'low' | 'medium' | 'high'>('medium');
  const [isComposing, setIsComposing] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Cleanup object URLs when files change
  useEffect(() => {
    return () => {
      // Cleanup any remaining object URLs when component unmounts
      uploadFiles.forEach(file => {
        // Note: In a production app, you'd want to track created URLs more carefully
        // This is a simplified cleanup approach
      });
    };
  }, [uploadFiles]);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        search: searchTerm,
        sortBy,
        sortDirection,
        page: '1',
        pageSize: '1000',
      });

      const response = await fetch(`/api/cv?${params}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText
        });
        throw new Error(`Failed to fetch records: ${response.status} ${response.statusText}`);
      }
      
      const data: CVApiResponse = await response.json();
      console.log('Successfully fetched records:', data);
      setRecords(data.records);
      setTotalRecords(data.totalRecords);
      setTotalPages(data.totalPages);
    } catch (error) {
      console.error('Error fetching records:', error);
      // Show user-friendly error message
      toast.error('Failed to load CV records. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    initializeNotificationSounds();
    setSoundEnabled(isNotificationSoundEnabled());
    fetchRecords();
  }, []);

  useEffect(() => {
    fetchRecords();
  }, [searchTerm, sortBy, sortDirection, currentPage]);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDirection('desc');
    }
    setCurrentPage(1);
  };



  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleViewRecord = (record: CVRecord) => {
    setSelectedRecord(record);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedRecord(null);
  };





  const handleRefresh = () => {
    fetchRecords();
  };

  const handleToggleSound = () => {
    const newState = !soundEnabled;
    setSoundEnabled(newState);
    enableNotificationSounds(newState);
    playToggleSound();
  };

  const handleToggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
    playClickSound();
  };

  const handleCopyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // You can add a toast notification here if needed
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  // Upload functions
  const handleOpenUploadModal = () => {
    setIsUploadModalOpen(true);
    setUploadFiles([]);
    setUploadProgress({});
    setSelectedForComposition([]);
    setShowCamera(false);
    playClickSound();
    
    // Ensure smooth entrance animation
    setTimeout(() => {
      const uploadInterface = document.querySelector('[data-upload-interface]');
      if (uploadInterface) {
        uploadInterface.classList.remove('animate-slide-down-pop');
        uploadInterface.classList.add('animate-slide-up-pop');
      }
    }, 10);
  };

  const handleCloseUploadModal = () => {
    // Add exit animation
    const uploadInterface = document.querySelector('[data-upload-interface]');
    if (uploadInterface) {
      uploadInterface.classList.add('animate-slide-down-pop');
    }
    
    // Close after animation completes
    setTimeout(() => {
      setIsUploadModalOpen(false);
      setUploadFiles([]);
      setUploadProgress({});
      setSelectedForComposition([]);
      setShowCamera(false);
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        setStream(null);
      }
    }, 500);
  };

  const handleAddFiles = (newFiles: FileList | File[]) => {
    const fileArray = Array.from(newFiles);
    const validFiles = fileArray.filter(file => {
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
        toast.error(`${file.name} is not a supported file type`);
        return false;
      }
      
      if (file.size > 25 * 1024 * 1024) {
        toast.error(`${file.name} is too large (max 25MB)`);
        return false;
      }
      
      return true;
    });
    
    setUploadFiles(prev => [...prev, ...validFiles]);
    
    if (validFiles.length > 0) {
      toast.success(`${validFiles.length} file(s) added successfully`);
    }
  };

  const handleRemoveFile = (index: number) => {
    setUploadFiles(prev => prev.filter((_, i) => i !== index));
    setUploadProgress(prev => {
      const newProgress = { ...prev };
      delete newProgress[index];
      return newProgress;
    });
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
      handleAddFiles(droppedFiles);
    }
  }, [handleAddFiles]);

  const handleUploadFiles = async () => {
    console.log('Starting file upload process...');
    if (uploadFiles.length === 0) {
      const errorMsg = 'No files to upload';
      console.error(errorMsg);
      toast.error(errorMsg);
      return;
    }

    console.log(`Preparing to upload ${uploadFiles.length} files`);
    setIsUploading(true);
    handleCloseUploadModal();

    let cleanupNotificationSync: (() => void) | null = null;
    try {
      console.log('Setting up notification sync...');
      cleanupNotificationSync = await triggerUploadNotificationSync();
      console.log('Notification sync setup complete');

      for (let i = 0; i < uploadFiles.length; i++) {
        const file = uploadFiles[i];
        const fileId = i.toString();
        console.log(`Processing file ${i + 1}/${uploadFiles.length}:`, file.name);

        setUploadProgress(prev => ({ ...prev, [fileId]: 0 }));

        try {
          const formData = new FormData();
          formData.append('file', file);
          formData.append('fileName', file.name);
          formData.append('fileSize', file.size.toString());
          formData.append('fileType', file.type);
          formData.append('fileId', fileId);
          formData.append('uploadTimestamp', new Date().toISOString());

          console.log('Sending request to webhook...');
          console.log('Webhook URL:', 'https://n8n.srv943319.hstgr.cloud/webhook/upload01');
          
          const startTime = Date.now();
          const response = await fetch('https://n8n.srv943319.hstgr.cloud/webhook/upload01', {
            method: 'POST',
            body: formData,
            headers: {
              'Accept': 'application/json',
            },
          });
          const endTime = Date.now();
          
          console.log(`Request completed in ${endTime - startTime}ms`);
          console.log('Response status:', response.status, response.statusText);
          
          if (!response.ok) {
            const errorText = await response.text().catch(() => 'No error details');
            console.error('Upload failed with response:', errorText);
            throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
          }

          const responseData = await response.json().catch(() => ({}));
          console.log('Upload successful, server response:', responseData);
          
          setUploadProgress(prev => ({ ...prev, [fileId]: 100 }));
          toast.success(`Successfully uploaded ${file.name}`);
          addNotification({
            title: 'Upload Successful',
            message: `Successfully uploaded ${file.name}`,
            type: 'success',
            priority: 'low',
          });

        } catch (error) {
          console.error(`Error uploading ${file.name}:`, error);
          toast.error(`Failed to upload ${file.name}`);
          setUploadProgress(prev => ({ ...prev, [fileId]: -1 }));
        }
      }
    } catch (error) {
      console.error('Error in upload process:', error);
      toast.error('Failed to complete upload process. Check console for details.');
    } finally {
      console.log('Cleaning up upload process...');
      setIsUploading(false);
      if (cleanupNotificationSync) {
        cleanupNotificationSync();
      }
      console.log('Fetching updated records...');
      fetchRecords();
    }
  };

  // Composition functions
  const handleSelectForComposition = (index: number) => {
    setSelectedForComposition(prev =>
      prev.includes(index)
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  const handleComposeMerge = async () => {
    if (selectedForComposition.length < 2) {
      toast.error('Please select at least 2 images to compose');
      return;
    }
    
    setIsComposing(true);
    
    try {
      const selectedFiles = uploadFiles.filter((_, index) => 
        selectedForComposition.includes(index) && uploadFiles[index].type.startsWith('image/')
      );
      
      if (selectedFiles.length < 2) {
        throw new Error('Please select at least 2 valid images');
      }
      
      console.log(`Starting composition with ${selectedFiles.length} images:`, selectedFiles.map(f => f.name));
      
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Canvas context not available');
      }
      
      const images = await Promise.all(
        selectedFiles.map(file => {
          return new Promise<HTMLImageElement>((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            const objectUrl = URL.createObjectURL(file);
            
            const handleLoad = () => {
              console.log(`Image loaded: ${file.name}, dimensions: ${img.width}x${img.height}`);
              URL.revokeObjectURL(objectUrl);
              resolve(img);
            };
            
            const handleError = (error: Event | string) => {
              console.error(`Failed to load image: ${file.name}`, error);
              URL.revokeObjectURL(objectUrl);
              reject(new Error(`Failed to load image: ${file.name}`));
            };
            
            img.onload = handleLoad;
            img.onerror = handleError;
            img.src = objectUrl;
            
            const timeout = setTimeout(() => {
              URL.revokeObjectURL(objectUrl);
              reject(new Error(`Image loading timeout: ${file.name}`));
            }, 10000); // 10 second timeout
            
            img.onload = () => {
              clearTimeout(timeout);
              handleLoad();
            };
            
            img.onerror = (error: Event | string) => {
              clearTimeout(timeout);
              handleError(error);
            };
          });
        })
      );
      
      console.log(`Loaded ${images.length} images for composition`);
      const maxWidth = Math.max(...images.map(img => img.width));
      const totalHeight = images.reduce((sum, img) => sum + img.height, 0);
      console.log(`Composition dimensions: ${maxWidth}x${totalHeight}`);
      
      canvas.width = maxWidth;
      canvas.height = totalHeight;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      let currentY = 0;
      images.forEach((img, index) => {
        const x = (maxWidth - img.width) / 2; // Center horizontally
        ctx.drawImage(img, x, currentY);
        console.log(`Drew image ${index} at position (${x}, ${currentY})`);
        currentY += img.height;
      });
      
      const blob = await new Promise<Blob>((resolve, reject) => {
        const quality = compositionQuality === 'high' ? 0.95 : compositionQuality === 'medium' ? 0.8 : 0.6;
        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Failed to create blob'));
        }, 'image/jpeg', quality);
      });
      
      const timestamp = Date.now();
      const photoName = `composition-${timestamp}.jpg`;
      const file = new File([blob], photoName, { type: 'image/jpeg' });
      handleAddFiles([file]);
      setSelectedForComposition([]);
      setIsComposing(false);
      toast.success('Composition created successfully!');
    } catch (error) {
      console.error('Composition error:', error);
      setIsComposing(false);
      toast.error('Failed to create composition');
    }
  };
  const handleStartCamera = async () => {
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('Camera not supported in this browser');
      }
      
      const constraints = {
        video: {
          facingMode: 'environment',
          width: { ideal: 1080 },
          height: { ideal: 1920 }
        }
      };
      
      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);
      setShowCamera(true);
      
      setTimeout(() => {
        if (videoRef.current && mediaStream) {
          videoRef.current.srcObject = mediaStream;
          videoRef.current.play();
        }
      }, 100);
      
    } catch (error) {
      console.error('Camera error:', error);
      toast.error('Unable to access camera. Please check permissions.');
    }
  };

  const handleStopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setShowCamera(false);
  };

  const handleCapturePhoto = async () => {
    if (!videoRef.current || !canvasRef.current) {
      toast.error('Camera not ready');
      return;
    }
    
    setIsCapturing(true);
    
    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      if (!context) {
        throw new Error('Canvas context not available');
      }
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Failed to create blob'));
        }, 'image/jpeg', 0.9);
      });
      
      const timestamp = Date.now();
      const photoName = `photo-${timestamp}.jpg`;
      const file = new File([blob], photoName, { type: 'image/jpeg' });
      
      handleAddFiles([file]);
      
      setIsCapturing(false);
      toast.success('Photo captured successfully!');
      
    } catch (error) {
      console.error('Capture error:', error);
      setIsCapturing(false);
      toast.error('Failed to capture photo');
    }
  };

  // Composition functions



  const truncateText = (text: string, maxLength: number = 100) => {
    return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Sidebar */}
      <Sidebar 
        isOpen={isSidebarOpen} 
        onToggle={handleToggleSidebar}
        currentSection="dashboard"
      />
      
      {/* Header */}
      <div className="bg-white/90 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Button
                onClick={handleToggleSidebar}
                variant="outline"
                size="sm"
                className="sm:hidden flex items-center gap-2 border-slate-300 hover:border-blue-500 hover:text-blue-600"
              >
                <Menu className="h-4 w-4" />
              </Button>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg transform hover:scale-105 transition-transform duration-200">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="hidden sm:block text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">CV Manager</h1>
                  <p className="hidden sm:block text-xs text-slate-500">Intelligent Resume Management</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="hidden sm:flex items-center space-x-2 text-sm text-slate-600">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span>System Online</span>
              </div>
              <Button
                onClick={handleRefresh}
                disabled={loading}
                variant="outline"
                className="hidden sm:flex shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 border-slate-300 hover:border-blue-500 hover:text-blue-600"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button
                onClick={handleToggleSound}
                onMouseEnter={playHoverSound}
                variant="outline"
                size="sm"
                className={`hidden sm:flex shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 border-slate-300 p-2 ${
                  soundEnabled 
                    ? 'hover:border-blue-500 hover:text-blue-600 text-blue-600 border-blue-300' 
                    : 'hover:border-red-500 hover:text-red-600 text-red-600 border-red-300'
                }`}
                title={soundEnabled ? 'Disable Sounds' : 'Enable Sounds'}
              >
                {soundEnabled ? (
                  <Volume2 className="w-3 h-3 sm:w-4 sm:h-4" />
                ) : (
                  <VolumeX className="w-3 h-3 sm:w-4 sm:h-4" />
                )}
              </Button>
              <NotificationBell />
              <Button 
                onClick={handleOpenUploadModal}
                disabled={isUploading}
                className={`bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 ${
                  isUploading ? 'opacity-75 cursor-not-allowed transform-none' : ''
                }`}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload CV
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 transition-all duration-300 ${isSidebarOpen ? 'lg:ml-64' : ''}`}>
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="group hover:shadow-xl transition-all duration-300 border-slate-200 bg-gradient-to-br from-white to-blue-50 hover:from-blue-50 hover:to-indigo-50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600 group-hover:text-blue-600 transition-colors">Total CVs</CardTitle>
              <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                <Users className="h-4 w-4 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{totalRecords}</div>
              <p className="text-xs text-slate-500 flex items-center mt-1">
                <span className="w-1 h-1 bg-blue-500 rounded-full mr-2"></span>
                Candidates in database
              </p>
            </CardContent>
          </Card>
          
          <Card className="group hover:shadow-xl transition-all duration-300 border-slate-200 bg-gradient-to-br from-white to-emerald-50 hover:from-emerald-50 hover:to-green-50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600 group-hover:text-emerald-600 transition-colors">Recent Uploads</CardTitle>
              <div className="p-2 bg-emerald-100 rounded-lg group-hover:bg-emerald-200 transition-colors">
                <TrendingUp className="h-4 w-4 text-emerald-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">
                {records.filter(r => {
                  const uploadDate = new Date(r.uploadDate);
                  const weekAgo = new Date();
                  weekAgo.setDate(weekAgo.getDate() - 7);
                  return uploadDate > weekAgo;
                }).length}
              </div>
              <p className="text-xs text-slate-500 flex items-center mt-1">
                <span className="w-1 h-1 bg-emerald-500 rounded-full mr-2"></span>
                This week
              </p>
            </CardContent>
          </Card>
          
          <Card className="group hover:shadow-xl transition-all duration-300 border-slate-200 bg-gradient-to-br from-white to-purple-50 hover:from-purple-50 hover:to-violet-50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600 group-hover:text-purple-600 transition-colors">Processing Status</CardTitle>
              <div className="p-2 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors">
                <FileText className="h-4 w-4 text-purple-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600 group-hover:text-purple-600 transition-colors flex items-center">
                Active
                <div className="w-2 h-2 bg-green-500 rounded-full ml-2 animate-pulse"></div>
              </div>
              <p className="text-xs text-slate-500 flex items-center mt-1">
                <span className="w-1 h-1 bg-purple-500 rounded-full mr-2"></span>
                System operational
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card className="mb-6 border-slate-200 bg-white/80 backdrop-blur-sm shadow-lg">
          <CardHeader className="bg-transparent rounded-t-lg">
            <CardTitle className="text-lg text-slate-800 flex items-center">
              <Search className="w-5 h-5 mr-2 text-blue-600" />
              Search & Filter
            </CardTitle>
            <CardDescription className="text-slate-600">
              Find candidates quickly with advanced search and sorting options
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative group">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4 group-focus-within:text-blue-500 transition-colors" />
                <Input
                  placeholder="Search by name, email, university, or skills..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10 border-slate-300 focus:border-blue-500 focus:ring-blue-500 bg-white/50 backdrop-blur-sm hover:bg-white transition-all duration-200"
                />
              </div>
              <div className="flex gap-2">
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-48 border-slate-300 bg-white/50 backdrop-blur-sm hover:bg-white transition-all duration-200">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="uploadDate">📅 Upload Date</SelectItem>
                    <SelectItem value="firstName">👤 First Name</SelectItem>
                    <SelectItem value="lastName">👤 Last Name</SelectItem>
                    <SelectItem value="email">📧 Email</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
                  className="border-slate-300 hover:bg-slate-50 transition-colors"
                >
                  {sortDirection === 'asc' ? '↑' : '↓'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CV Records Table */}
        <Card className="border-slate-200 bg-white/80 backdrop-blur-sm shadow-lg">
          <CardHeader className="bg-gradient-to-r from-slate-50 to-blue-50 rounded-t-lg">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg text-slate-800 flex items-center">
                  <FileText className="w-5 h-5 mr-2 text-blue-600" />
                  CV Records
                </CardTitle>
                <CardDescription className="text-slate-600 mt-1">
                  {totalRecords} total candidates • {records.length} displayed
                </CardDescription>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  onClick={handleRefresh}
                  disabled={loading}
                  variant="outline"
                  size="sm"
                  className="border-slate-300 hover:border-blue-500 hover:text-blue-600 transition-all duration-200"
                >
                  <RefreshCw className={`w-3 h-3 mr-1 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                  {loading ? 'Loading...' : 'Ready'}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead 
                        className="cursor-pointer hover:text-red-600 transition-colors"
                        onClick={() => handleSort('firstName')}
                      >
                        Name {sortBy === 'firstName' && (sortDirection === 'asc' ? '↑' : '↓')}
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer hover:text-red-600 transition-colors"
                        onClick={() => handleSort('email')}
                      >
                        Email {sortBy === 'email' && (sortDirection === 'asc' ? '↑' : '↓')}
                      </TableHead>
                      <TableHead>University</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {records.map((record) => (
                      <TableRow key={record.id} className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-200 group">
                        <TableCell>
                          <button
                            onClick={() => handleViewRecord(record)}
                            className="text-left hover:text-blue-600 hover:underline transition-all duration-200 cursor-pointer bg-transparent border-none p-0 font-medium group-hover:font-semibold flex items-center"
                          >
                            <div className="w-8 h-8 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mr-3 group-hover:from-blue-200 group-hover:to-indigo-200 transition-all duration-200">
                              <span className="text-sm font-semibold text-blue-600">
                                {record.firstName.charAt(0)}{record.lastName.charAt(0)}
                              </span>
                            </div>
                            <div>
                              <div className="font-medium text-slate-900 group-hover:text-blue-600 transition-colors">
                                {record.firstName} {record.lastName}
                              </div>
                              <div className="text-xs text-slate-500 group-hover:text-blue-500 transition-colors">
                                Click to view details
                              </div>
                            </div>
                          </button>
                        </TableCell>
                        <TableCell className="text-slate-600 group-hover:text-slate-800 transition-colors">
                          <div className="flex items-center">
                            <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                            {record.email}
                          </div>
                        </TableCell>
                        <TableCell>
                          {record.universities && (
                            <Badge variant="secondary" className="bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800 hover:from-purple-200 hover:to-pink-200 transition-all duration-200">
                              {truncateText(record.universities, 30)}
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                
                {records.length === 0 && (
                  <div className="text-center py-16">
                    <div className="w-20 h-20 bg-gradient-to-r from-slate-100 to-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <FileText className="h-10 w-10 text-slate-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-slate-900 mb-2">No CVs found</h3>
                    <p className="text-slate-500 mb-6 max-w-md mx-auto">
                      {searchTerm ? 'Try adjusting your search terms or filters to find what you\'re looking for.' : 'Get started by uploading your first CV to begin building your candidate database.'}
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                      <Button 
                        onClick={() => {
                          playClickSound();
                          router.push('/upload');
                        }}
                        className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Upload CV
                      </Button>
                      {searchTerm && (
                        <Button 
                          variant="outline"
                          onClick={() => handleSearch('')}
                          className="border-slate-300 hover:bg-slate-50"
                        >
                          Clear Search
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {/* Total Records Display */}
            <div className="flex items-center justify-center mt-6">
              <div className="text-sm text-gray-500">
                Showing all {totalRecords} records
              </div>
            </div>
            
            {/* Pagination - Hidden since showing all records */}
            {false && totalPages > 1 && (
              <div className="flex items-center justify-between mt-6">
                <div className="text-sm text-gray-500">
                  Showing {((currentPage - 1) * 10) + 1} to {Math.min(currentPage * 10, totalRecords)} of {totalRecords} results
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="border-red-200 text-red-600 hover:bg-red-50"
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="border-red-200 text-red-600 hover:bg-red-50"
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

        {/* CV Details Modal */}
        {isModalOpen && (
          <Modal
            isOpen={isModalOpen}
            onClose={handleCloseModal}
            title={selectedRecord ? `${selectedRecord.firstName} ${selectedRecord.lastName}` : ''}
            description={selectedRecord?.email}
            size="2xl"
          >
          {selectedRecord && (
            <div className="space-y-6">
              {/* Basic Information */}
               <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 shadow-sm">
                 <h3 className="text-lg font-semibold text-blue-800 mb-4 flex items-center">
                   <Users className="w-5 h-5 mr-2 text-blue-600" />
                   Basic Information
                 </h3>
                 <div className="grid grid-cols-1 gap-4">
                   <div className="bg-white rounded-lg p-4 border border-blue-100">
                      <span className="text-sm font-medium text-blue-600 block mb-1">Email</span>
                      <a 
                        href={`mailto:${selectedRecord.email}`}
                        className="text-blue-600 hover:text-blue-800 break-all text-sm underline hover:no-underline transition-colors cursor-pointer"
                        title={`Send email to ${selectedRecord.email}`}
                      >
                        {selectedRecord.email}
                      </a>
                    </div>
                   {selectedRecord.universities && (
                     <div className="bg-white rounded-lg p-4 border border-blue-100">
                       <span className="text-sm font-medium text-blue-600 block mb-1">University</span>
                       <span className="text-gray-900 leading-relaxed text-sm">{selectedRecord.universities}</span>
                     </div>
                   )}
                 </div>
               </div>

              {/* CV Document */}
              {selectedRecord.cvUrl && (
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-green-800 mb-4 flex items-center">
                    <Download className="w-5 h-5 mr-2 text-green-600" />
                    CV Document
                  </h3>
                  <div className="bg-white rounded-lg p-4 border border-green-100 hover:border-green-200 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                          <FileText className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <span className="text-gray-900 font-medium block">CV Document</span>
                          <span className="text-gray-500 text-sm">Click to view or copy URL</span>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleCopyToClipboard(selectedRecord.cvUrl, 'CV URL')}
                          className="px-3 py-1 text-sm border border-green-200 text-green-600 hover:bg-green-100 rounded transition-colors flex items-center"
                        >
                          <Copy className="w-3 h-3 mr-1" />
                          Copy URL
                        </button>
                        <button
                          onClick={() => window.open(selectedRecord.cvUrl, '_blank')}
                          className="px-3 py-1 text-sm border border-green-200 text-green-600 hover:bg-green-100 rounded transition-colors flex items-center"
                        >
                          <Eye className="w-3 h-3 mr-1" />
                          View CV
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Resume Summary */}
              {selectedRecord.resumeSummary && (
                <div className="bg-gradient-to-br from-purple-50 to-violet-50 border border-purple-200 rounded-xl p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-purple-800 flex items-center">
                      <FileText className="w-5 h-5 mr-2 text-purple-600" />
                      Resume Summary
                    </h3>
                    <button
                      onClick={() => handleCopyToClipboard(selectedRecord.resumeSummary, 'Resume Summary')}
                      className="px-3 py-2 text-sm border border-purple-200 text-purple-600 hover:bg-purple-100 rounded-lg transition-colors flex items-center font-medium"
                    >
                      <Copy className="w-4 h-4 mr-1" />
                      Copy
                    </button>
                  </div>
                  <div className="text-sm text-gray-700 bg-white p-4 rounded-lg border border-purple-100 max-h-48 overflow-y-auto leading-relaxed shadow-sm">
                    {selectedRecord.resumeSummary}
                  </div>
                </div>
              )}

              {/* Interview Questions */}
              {selectedRecord.interviewQuestions && (
                <div className="bg-gradient-to-br from-amber-50 to-yellow-50 border border-amber-200 rounded-xl p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-amber-800 flex items-center">
                      <Search className="w-5 h-5 mr-2 text-amber-600" />
                      Interview Questions
                    </h3>
                    <button
                      onClick={() => handleCopyToClipboard(selectedRecord.interviewQuestions, 'Interview Questions')}
                      className="px-3 py-2 text-sm border border-amber-200 text-amber-600 hover:bg-amber-100 rounded-lg transition-colors flex items-center font-medium"
                    >
                      <Copy className="w-4 h-4 mr-1" />
                      Copy
                    </button>
                  </div>
                  <div className="text-sm text-gray-700 bg-white p-4 rounded-lg border border-amber-100 max-h-48 overflow-y-auto leading-relaxed shadow-sm">
                    {selectedRecord.interviewQuestions}
                  </div>
                </div>
              )}

              {/* Detected Gaps */}
              {selectedRecord.detectedGaps && (
                <div className="bg-gradient-to-br from-orange-50 to-red-50 border border-orange-200 rounded-xl p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-orange-800 flex items-center">
                      <TrendingUp className="w-5 h-5 mr-2 text-orange-600" />
                      Detected Gaps
                    </h3>
                    <button
                      onClick={() => handleCopyToClipboard(selectedRecord.detectedGaps, 'Detected Gaps')}
                      className="px-3 py-2 text-sm border border-orange-200 text-orange-600 hover:bg-orange-100 rounded-lg transition-colors flex items-center font-medium"
                    >
                      <Copy className="w-4 h-4 mr-1" />
                      Copy
                    </button>
                    </div>
                  </div>
                  <div className="text-sm text-gray-700 bg-white p-4 rounded-lg border border-orange-100 max-h-48 overflow-y-auto leading-relaxed shadow-sm">
                    {selectedRecord.detectedGaps}
                  </div>
                </div>
              )}

              {/* Holder Summary */}
              {selectedRecord.holderSummary && (
                <div className="bg-gradient-to-br from-teal-50 to-cyan-50 border border-teal-200 rounded-xl p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-teal-800 flex items-center">
                      <Users className="w-5 h-5 mr-2 text-teal-600" />
                      Holder Summary
                    </h3>
                    <button
                      onClick={() => handleCopyToClipboard(selectedRecord.holderSummary, 'Holder Summary')}
                      className="px-3 py-2 text-sm border border-teal-200 text-teal-600 hover:bg-teal-100 rounded-lg transition-colors flex items-center font-medium"
                    >
                      <Copy className="w-4 h-4 mr-1" />
                      Copy
                    </button>
                  </div>
                  <div className="text-sm text-gray-700 bg-white p-4 rounded-lg border border-teal-100 max-h-48 overflow-y-auto leading-relaxed shadow-sm">
                    {selectedRecord.holderSummary}
                  </div>
                </div>
              )}
            </div>
          )}
        </Modal>
      )}

      {/* Full Screen Upload Interface */}
      {isUploadModalOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 transition-opacity duration-300 ease-out"
            onClick={handleCloseUploadModal}
          />
          
          {/* Slide-up Interface */}
          <div className="fixed inset-0 z-50 flex items-end pointer-events-none">
            <div 
              data-upload-interface
              className={`w-full h-full sm:h-[95%] bg-white rounded-t-3xl shadow-2xl transform transition-all duration-500 ease-out pointer-events-auto ${
                isUploadModalOpen 
                  ? 'translate-y-0 opacity-100 scale-100' 
                  : 'translate-y-full opacity-0 scale-95'
              }`}
              style={{
                transformOrigin: 'bottom center',
                animation: isUploadModalOpen ? 'slideUpPop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)' : 'none'
              }}
            >
              {/* Header */}
              <div className="sticky top-0 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-200 rounded-t-3xl p-6 z-10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl flex items-center justify-center">
                      <Upload className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">Upload Center</h2>
                      <p className="text-gray-600">Upload and manage your CV files</p>
                    </div>
                  </div>
                  <Button
                    onClick={handleCloseUploadModal}
                    variant="outline"
                    size="lg"
                    className="rounded-2xl px-6 py-3 border-2 hover:bg-red-50 hover:border-red-300 hover:text-red-600 transition-all duration-200"
                  >
                    ✕ Close
                  </Button>
                </div>
              </div>

              {/* Scrollable Content Container */}
              <div className="h-full overflow-y-auto" style={{ height: 'calc(100% - 120px)' }}>
                <div className="p-6 space-y-8">
                {/* Enhanced Upload Area */}
                <div
                  className={`border-3 border-dashed rounded-3xl p-8 sm:p-12 text-center transition-all duration-500 ${
                    isDragOver 
                      ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-indigo-50 shadow-2xl scale-105 border-blue-400' 
                      : 'border-gray-300 hover:border-blue-400 hover:bg-gradient-to-br hover:from-blue-25 hover:to-indigo-25 hover:shadow-xl'
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  {/* Upload Icon */}
                  <div className={`rounded-full w-24 h-24 sm:w-32 sm:h-32 mx-auto mb-6 flex items-center justify-center transition-all duration-300 ${
                    isDragOver 
                      ? 'bg-gradient-to-r from-blue-500 to-indigo-500 scale-110 shadow-2xl' 
                      : 'bg-gradient-to-r from-blue-100 to-indigo-100 hover:scale-105 shadow-lg'
                  }`}>
                    <Upload className={`h-12 w-12 sm:h-16 sm:w-16 transition-all duration-300 ${
                      isDragOver ? 'text-white' : 'text-blue-600'
                    }`} />
                  </div>
                  
                  {/* Upload Text */}
                  <div className="space-y-4 mb-8">
                    <h3 className={`text-2xl sm:text-3xl font-bold transition-colors duration-300 ${
                      isDragOver ? 'text-blue-700' : 'text-gray-800'
                    }`}>
                      {isDragOver ? 'Drop files here! 🎉' : 'Drop files here ✨'}
                    </h3>
                    <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
                      Drag and drop your CV files here, or click to browse. We support PDF, Word documents, and images.
                    </p>
                    
                    {/* File Type Icons */}
                    <div className="flex items-center justify-center gap-4 mt-4">
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <div className="w-6 h-6 bg-red-100 rounded-lg flex items-center justify-center">
                          <FileText className="w-3 h-3 text-red-600" />
                        </div>
                        <span>PDF</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <div className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center">
                          <FileText className="w-3 h-3 text-blue-600" />
                        </div>
                        <span>Word</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                                                       <div className="w-6 h-6 bg-purple-100 rounded-lg flex items-center justify-center">
                                 <ImageIcon className="w-3 h-3 text-purple-600" />
                               </div>
                        <span>Images</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button
                      onClick={() => fileInputRef.current?.click()}
                      className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-4 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 text-lg font-semibold transform hover:scale-105"
                    >
                      📁 Choose Files
                    </Button>
                    <Button
                      onClick={handleStartCamera}
                      variant="outline"
                      className="px-8 py-4 rounded-2xl border-2 hover:bg-blue-50 hover:border-blue-300 text-lg font-semibold transition-all duration-300 transform hover:scale-105"
                    >
                      📸 Take Photo
                    </Button>
                  </div>
                  
                  {/* Drag & Drop Hint */}
                  <div className="mt-6 text-sm text-gray-500">
                    <p className="flex items-center justify-center gap-2">
                      <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></span>
                      Drag & drop files here or click the buttons above
                    </p>
                  </div>
                  
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.webp"
                    onChange={(e) => e.target.files && handleAddFiles(e.target.files)}
                    className="hidden"
                  />
                </div>

                {/* File Management Section */}
                {uploadFiles.length > 0 && (
                  <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <h3 className="text-2xl font-bold text-gray-800">Selected Files ({uploadFiles.length})</h3>
                        <p className="text-gray-600 text-sm mt-1">Review and manage your files before upload</p>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-3">
                        <Button
                          onClick={() => setUploadFiles([])}
                          variant="outline"
                          size="lg"
                          className="rounded-xl px-6 py-3 border-2 hover:bg-red-50 hover:border-red-300 hover:text-red-600 transition-all duration-200"
                        >
                          🗑️ Clear All
                        </Button>
                        <Button
                          onClick={handleUploadFiles}
                          disabled={isUploading}
                          size="lg"
                          className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-xl px-8 py-3 shadow-lg hover:shadow-xl transition-all duration-200"
                        >
                          {isUploading ? (
                            <>
                              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-3" />
                              Uploading...
                            </>
                          ) : (
                            <>
                              🚀 Upload All Files
                            </>
                          )}
                        </Button>
                      </div>
                    </div>

                    {/* Enhanced File Grid with Previews */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {uploadFiles.map((file, index) => (
                        <div key={index} className="group bg-white rounded-2xl border-2 border-gray-200 p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 hover:border-blue-300">
                          {/* File Header */}
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                              {file.type.startsWith('image/') ? (
                                <div className="w-12 h-12 bg-gradient-to-r from-purple-100 to-pink-100 rounded-xl flex items-center justify-center">
                                  <ImageIcon className="w-6 h-6 text-purple-600" />
                                </div>
                              ) : file.type === 'application/pdf' ? (
                                <div className="w-12 h-12 bg-gradient-to-r from-red-100 to-pink-100 rounded-xl flex items-center justify-center">
                                  <FileText className="w-6 h-6 text-red-600" />
                                </div>
                              ) : (
                                <div className="w-12 h-12 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-xl flex items-center justify-center">
                                  <FileText className="w-6 h-6 text-blue-600" />
                                </div>
                              )}
                              <div className="min-w-0">
                                <h4 className="font-semibold text-gray-900 text-lg truncate" title={file.name}>
                                  {file.name}
                                </h4>
                                <p className="text-gray-600 text-sm">
                                  {(file.size / 1024 / 1024).toFixed(2)} MB
                                </p>
                              </div>
                            </div>
                            <Button
                              onClick={() => handleRemoveFile(index)}
                              variant="ghost"
                              size="sm"
                              className="text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                            >
                              ✕
                            </Button>
                          </div>
                          
                          {/* File Preview */}
                          <div className="mb-4">
                            {file.type.startsWith('image/') ? (
                              <div className="relative">
                                <img
                                  src={URL.createObjectURL(file)}
                                  alt={file.name}
                                  className="w-full h-32 object-cover rounded-xl border border-gray-200 shadow-sm"
                                  onError={(e) => {
                                    console.error(`Failed to load image preview: ${file.name}`);
                                    e.currentTarget.style.display = 'none';
                                  }}
                                />
                                <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded-full">
                                  IMAGE
                                </div>
                              </div>
                            ) : file.type === 'application/pdf' ? (
                              <div className="w-full h-32 bg-gradient-to-br from-red-50 to-pink-50 rounded-xl border-2 border-red-200 flex items-center justify-center shadow-sm">
                                <div className="text-center">
                                  <FileText className="w-12 h-12 text-red-500 mx-auto mb-2" />
                                  <p className="text-red-700 font-medium text-sm">PDF Document</p>
                                </div>
                              </div>
                            ) : file.type.includes('word') ? (
                              <div className="w-full h-32 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200 flex items-center justify-center shadow-sm">
                                <div className="text-center">
                                  <FileText className="w-12 h-12 text-blue-500 mx-auto mb-2" />
                                  <p className="text-blue-700 font-medium text-sm">Word Document</p>
                                </div>
                              </div>
                            ) : (
                              <div className="w-full h-32 bg-gradient-to-br from-gray-50 to-slate-50 rounded-xl border-2 border-gray-200 flex items-center justify-center shadow-sm">
                                <div className="text-center">
                                  <FileText className="w-12 h-12 text-gray-500 mx-auto mb-2" />
                                  <p className="text-gray-700 font-medium text-sm">Document</p>
                                </div>
                              </div>
                            )}
                          </div>
                          
                          {/* File Actions */}
                          <div className="flex gap-2 mt-4">
                            <Button
                              onClick={() => handleRemoveFile(index)}
                              variant="outline"
                              size="sm"
                              className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 hover:border-red-300 transition-all duration-200"
                            >
                              Remove
                            </Button>
                            {file.type.startsWith('image/') && (
                              <Button
                                onClick={() => handleSelectForComposition(index)}
                                variant={selectedForComposition.includes(index) ? "default" : "outline"}
                                size="sm"
                                className={`flex-1 transition-all duration-200 ${
                                  selectedForComposition.includes(index)
                                    ? 'bg-purple-600 hover:bg-purple-700 text-white'
                                    : 'text-purple-600 hover:text-purple-700 hover:bg-purple-50 border-purple-200 hover:border-purple-300'
                                }`}
                              >
                                {selectedForComposition.includes(index) ? '✓ Selected' : 'Select for Merge'}
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                 {/* Enhanced Camera Interface */}
                 {showCamera && (
                   <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-3xl p-8 border-2 border-green-200 shadow-lg">
                     <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                       <div>
                         <h3 className="text-3xl font-bold text-gray-800 flex items-center gap-3 mb-2">
                           📸 Camera
                         </h3>
                         <p className="text-gray-600 text-lg">Take photos directly from your device camera</p>
                       </div>
                       <Button
                         onClick={handleStopCamera}
                         variant="outline"
                         size="lg"
                         className="rounded-xl px-6 py-3 border-2 hover:bg-red-50 hover:border-red-300 hover:text-red-600 transition-all duration-200"
                       >
                         ✕ Stop Camera
                       </Button>
                     </div>
                     
                     <div className="space-y-8">
                       {/* Video Preview */}
                       <div className="relative bg-black rounded-2xl overflow-hidden aspect-video w-full max-w-3xl mx-auto shadow-2xl">
                         <video
                           ref={videoRef}
                           autoPlay
                           playsInline
                           muted
                           className="w-full h-full object-cover"
                         />
                         <canvas
                           ref={canvasRef}
                           className="hidden"
                         />
                         
                         {/* Camera Overlay */}
                         <div className="absolute inset-0 pointer-events-none">
                           {/* Corner Guides */}
                           <div className="absolute top-4 left-4 w-8 h-8 border-2 border-white border-opacity-50 rounded-tl-lg"></div>
                           <div className="absolute top-4 right-4 w-8 h-8 border-2 border-white border-opacity-50 rounded-tr-lg"></div>
                           <div className="absolute bottom-4 left-4 w-8 h-8 border-2 border-white border-opacity-50 rounded-bl-lg"></div>
                           <div className="absolute bottom-4 right-4 w-8 h-8 border-2 border-white border-opacity-50 rounded-br-lg"></div>
                           
                           {/* Center Focus */}
                           <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-16 h-16 border-2 border-white border-opacity-30 rounded-full"></div>
                         </div>
                       </div>
                       
                       {/* Camera Controls */}
                       <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
                         <Button
                           onClick={handleCapturePhoto}
                           disabled={isCapturing || !stream}
                           size="lg"
                           className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white px-12 py-6 rounded-full text-xl font-semibold shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-105 disabled:transform-none disabled:scale-100"
                         >
                           {isCapturing ? (
                             <>
                               <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mr-4" />
                               Capturing...
                             </>
                           ) : (
                             <>
                               📸 Capture Photo
                             </>
                           )}
                         </Button>
                       </div>
                       
                       {/* Enhanced Instructions */}
                       <div className="bg-white rounded-2xl p-6 border-2 border-green-200 shadow-lg">
                         <div className="text-center space-y-4">
                           <div className="flex items-center justify-center gap-3 mb-4">
                             <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                               <span className="text-green-600 font-bold text-lg">💡</span>
                             </div>
                             <h4 className="text-lg font-semibold text-gray-800">Camera Tips</h4>
                           </div>
                           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-600">
                             <div className="flex items-center gap-2">
                               <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                               <span>Position your device for the best angle</span>
                             </div>
                             <div className="flex items-center gap-2">
                               <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                               <span>Ensure good lighting for clear photos</span>
                             </div>
                             <div className="flex items-center gap-2">
                               <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                               <span>Hold steady when capturing</span>
                             </div>
                             <div className="flex items-center gap-2">
                               <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                               <span>Photos auto-add to your upload list</span>
                             </div>
                           </div>
                         </div>
                       </div>
                     </div>
                   </div>
                 )}

                 {/* Enhanced Photo Composition Section */}
                 <div className="bg-white rounded-2xl p-6 border-2 border-purple-200">
                   <div className="text-center mb-6">
                     <h3 className="text-2xl font-bold text-gray-800 mb-2">🎨 Photo Composition</h3>
                     <p className="text-gray-600">
                       Select 2-5 images to merge into one. Original photos will be removed after composition.
                     </p>
                   </div>
                   
                   {uploadFiles.filter(f => f.type.startsWith('image/')).length > 0 ? (
                     <div className="space-y-6">
                       {/* Simple Quality Selector */}
                       <div className="flex items-center justify-center gap-4">
                         <label className="text-sm font-medium text-gray-700">Quality:</label>
                         <select
                           value={compositionQuality}
                           onChange={(e) => setCompositionQuality(e.target.value as 'low' | 'medium' | 'high')}
                           className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                         >
                           <option value="low">Low (Fast)</option>
                           <option value="medium">Medium</option>
                           <option value="high">High (Slow)</option>
                         </select>
                       </div>
                       
                       {/* Simple Image Grid */}
                       <div>
                         <div className="flex items-center justify-between mb-4">
                           <h4 className="font-medium text-gray-800">
                             Select Images ({selectedForComposition.length} selected)
                           </h4>
                           {selectedForComposition.length > 0 && (
                             <button
                               onClick={() => setSelectedForComposition([])}
                               className="text-sm text-purple-600 hover:text-purple-700 underline"
                             >
                               Clear
                             </button>
                           )}
                         </div>
                         
                         <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                           {uploadFiles
                             .map((file, index) => ({ file, index }))
                             .filter(({ file }) => file.type.startsWith('image/'))
                             .map(({ file, index }) => (
                               <div
                                 key={index}
                                 className={`relative border-2 rounded-lg overflow-hidden cursor-pointer ${
                                   selectedForComposition.includes(index) 
                                     ? 'border-purple-500 ring-2 ring-purple-200' 
                                     : 'border-gray-200 hover:border-purple-300'
                                 }`}
                                 onClick={() => handleSelectForComposition(index)}
                               >
                                 <img
                                   src={URL.createObjectURL(file)}
                                   alt={file.name}
                                   className="w-full h-24 object-cover"
                                   onError={(e) => {
                                     console.error(`Failed to load image preview: ${file.name}`);
                                     e.currentTarget.style.display = 'none';
                                   }}
                                 />
                                 
                                 {/* Simple Selection Indicator */}
                                 <div className="absolute top-1 right-1">
                                   {selectedForComposition.includes(index) ? (
                                     <div className="w-5 h-5 bg-purple-600 rounded-full flex items-center justify-center">
                                       <span className="text-white text-xs">✓</span>
                                     </div>
                                   ) : (
                                     <div className="w-5 h-5 border-2 border-white bg-black bg-opacity-50 rounded-full"></div>
                                   )}
                                 </div>
                               </div>
                             ))}
                         </div>
                         

                       </div>
                       
                       {/* Simple Compose Button */}
                       <div className="text-center">
                         <Button
                           onClick={handleComposeMerge}
                           disabled={selectedForComposition.length < 2 || isComposing}
                           className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 rounded-lg font-medium"
                         >
                           {isComposing ? (
                             <>
                               <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                               Creating...
                             </>
                           ) : (
                             `🎨 Merge ${selectedForComposition.length} Images`
                           )}
                         </Button>
                       </div>
                       
                       {/* Auto-delete Warning */}
                       {selectedForComposition.length > 0 && (
                         <div className="bg-gradient-to-r from-orange-50 to-red-50 border-2 border-orange-200 rounded-2xl p-6 text-center">
                           <div className="flex items-center justify-center gap-3 mb-3">
                             <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                               <span className="text-white font-bold text-sm">!</span>
                             </div>
                             <h5 className="text-lg font-semibold text-orange-800">Important Notice</h5>
                           </div>
                           <p className="text-orange-700 mb-3">
                             After creating the composition, the {selectedForComposition.length} selected original images will be 
                             <span className="font-bold"> automatically removed</span> from your upload list to save space.
                           </p>
                           <p className="text-orange-600 text-sm">
                             The new merged composition will replace them and be ready for upload.
                           </p>
                         </div>
                       )}
                     </div>
                   ) : (
                     <div className="text-center py-8 text-gray-500">
                       <p>No images available. Upload some images first.</p>
                     </div>
                   )}
                 </div>
               </div>
             </div>
             
             {/* Mobile-friendly bottom close button */}
             <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 sm:hidden">
               <Button
                 onClick={handleCloseUploadModal}
                 className="w-full bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white py-4 rounded-2xl text-lg font-semibold shadow-lg"
               >
                 ✕ Close Upload Center
               </Button>
             </div>
           </div>
         </div>
       </>
     )}
    </div>
  );
};

export default CVDashboard;