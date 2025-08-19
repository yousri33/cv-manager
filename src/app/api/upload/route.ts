import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { success: false, message: 'No file provided' },
        { status: 400 }
      );
    }
    
    const files = [file]; // Convert single file to array for consistent processing

    // Validate file types
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
    const invalidFiles = files.filter(file => !allowedTypes.includes(file.type));
    
    if (invalidFiles.length > 0) {
      return NextResponse.json(
        { success: false, message: 'Only PDF, Word documents, and images (JPEG, PNG, GIF, WebP) are allowed' },
        { status: 400 }
      );
    }

    // Validate file sizes (max 10MB per file)
    const maxSize = 10 * 1024 * 1024; // 10MB
    const oversizedFiles = files.filter(file => file.size > maxSize);
    
    if (oversizedFiles.length > 0) {
      return NextResponse.json(
        { success: false, message: 'File size must be less than 10MB' },
        { status: 400 }
      );
    }

    const webhookUrl = process.env.WEBHOOK_URL;
    if (!webhookUrl) {
      return NextResponse.json(
        { success: false, message: 'Webhook URL not configured' },
        { status: 500 }
      );
    }

    // Create new FormData for webhook
    const webhookFormData = new FormData();
    
    for (const file of files) {
      webhookFormData.append('files', file);
    }

    // Forward to webhook
    const response = await axios.post(webhookUrl, webhookFormData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 30000, // 30 seconds timeout
    });

    return NextResponse.json({
      success: true,
      message: `Successfully uploaded ${files.length} file(s)`,
      data: response.data,
    });
  } catch (error) {
    console.error('Upload error:', error);
    
    if (axios.isAxiosError(error)) {
      return NextResponse.json(
        { 
          success: false, 
          message: `Webhook error: ${error.message}` 
        },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { success: false, message: 'Upload failed' },
      { status: 500 }
    );
  }
}