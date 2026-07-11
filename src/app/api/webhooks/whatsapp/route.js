import { NextResponse } from 'next/server';
import { logAction } from '@/lib/logger';

export async function POST(req) {
  try {
    const payload = await req.json();
    
    // OpenWA webhook payload contains message details
    // Here we can parse the incoming message and alert the staff
    
    const sender = payload.from || 'Unknown Number';
    const body = payload.body || payload.text || 'No message content';
    
    // Log the incoming inquiry so admins can track it in system logs
    // In the future, this could be broadcasted via WebSockets or saved to an 'inquiries' table
    await logAction({
      action: 'WhatsApp Inquiry Received',
      details: `New inquiry from ${sender}: ${body.substring(0, 100)}...`,
      severity: 'info',
      employeeId: null // System action
    });

    return NextResponse.json({ success: true, message: 'Webhook received' }, { status: 200 });
  } catch (error) {
    console.error('Error processing WhatsApp webhook:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ message: 'WhatsApp Webhook Endpoint Active' });
}
