import { NextRequest } from 'next/server';

// Note: This WebSocket endpoint has been replaced with Server-Sent Events (SSE)
// See /api/events for the new real-time implementation

export async function GET(request: NextRequest) {
  return new Response(
    'WebSocket endpoint deprecated. Use Server-Sent Events at /api/events instead.',
    { 
      status: 410, // Gone
      headers: {
        'Content-Type': 'text/plain'
      }
    }
  );
}
