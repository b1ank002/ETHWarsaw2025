import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log('Ramp webhook received:', body);
    
    // Handle different webhook events from Ramp Network
    switch (body.type) {
      case 'PURCHASE_CREATED':
        console.log('Purchase created:', body.payload);
        break;
      case 'PURCHASE_SUCCESSFUL':
        console.log('Purchase successful:', body.payload);
        break;
      case 'PURCHASE_FAILED':
        console.log('Purchase failed:', body.payload);
        break;
      default:
        console.log('Unknown webhook event:', body.type);
    }
    
    // Return success response
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Ramp webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ message: 'Ramp webhook endpoint is active' });
}