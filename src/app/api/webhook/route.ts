import { NextRequest, NextResponse } from 'next/server';
import { Notification } from '@/types/notification';

// In-memory storage for webhook notifications
// In production, you'd use a database or Redis
let webhookNotifications: Notification[] = [];

// Webhook handler for Airtable responses
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Handle Airtable response format
    if (body && typeof body === 'object' && 'status' in body && 'message' in body) {
      const { status, message, candidate } = body;
      
      // Determine notification type and priority based on status
      let notificationType: 'cv_analysis' | 'success' | 'error' | 'warning' | 'info';
      let priority: 'low' | 'medium' | 'high';
      
      if (status === 'success') {
        notificationType = 'cv_analysis';
        priority = 'medium';
      } else if (status === 'error') {
        notificationType = 'error';
        priority = 'high';
      } else if (status === 'warning') {
        notificationType = 'warning';
        priority = 'medium';
      } else {
        notificationType = 'info';
        priority = 'low';
      }
      
      // Create notification data with new structure
      const notificationData = {
        id: `webhook_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        title: candidate ? `CV Analysis: ${candidate}` : 'CV Analysis Update',
        message: candidate ? `Analysis completed for ${candidate}` : message,
        type: notificationType,
        priority: priority,
        timestamp: Date.now(),
        read: false,
        candidate: candidate || null,
        canHide: true,
        originalMessage: message
      };
      
      // Store notification in memory
      webhookNotifications.unshift(notificationData);
      
      // Keep only last 100 notifications
      if (webhookNotifications.length > 100) {
        webhookNotifications = webhookNotifications.slice(0, 100);
      }
      
      return NextResponse.json({
        success: true,
        message: 'Webhook processed successfully',
        notification: {
          title: notificationData.title,
          message: notificationData.message,
          type: notificationData.type,
          priority: notificationData.priority,
          candidate: notificationData.candidate
        }
      });
    }
    
    // Handle other webhook formats
    return NextResponse.json({
      success: true,
      message: 'Webhook received successfully'
    });
    
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { success: false, message: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve webhook notifications
export async function GET() {
  return NextResponse.json({
    success: true,
    notifications: webhookNotifications
  });
}
