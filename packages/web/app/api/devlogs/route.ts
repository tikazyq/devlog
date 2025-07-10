import { NextRequest, NextResponse } from 'next/server';
import { getDevlogManager } from '@/lib/devlog-manager';
import { broadcastUpdate } from '@/lib/sse-manager';

// Mark this route as dynamic to prevent static generation
export const dynamic = 'force-dynamic';

// GET /api/devlogs - List all devlogs
export async function GET(request: NextRequest) {
  try {
    const devlogManager = await getDevlogManager();

    const { searchParams } = new URL(request.url);
    const filter: any = {};

    // Parse query parameters
    if (searchParams.get('status')) filter.status = searchParams.get('status') as any;
    if (searchParams.get('type')) filter.type = searchParams.get('type') as any;
    if (searchParams.get('priority')) filter.priority = searchParams.get('priority') as any;

    const devlogs = await devlogManager.listDevlogs(filter);
    return NextResponse.json(devlogs);
  } catch (error) {
    console.error('Error fetching devlogs:', error);
    return NextResponse.json({ error: 'Failed to fetch devlogs' }, { status: 500 });
  }
}

// POST /api/devlogs - Create new devlog
export async function POST(request: NextRequest) {
  try {
    const devlogManager = await getDevlogManager();

    const data = await request.json();
    const devlog = await devlogManager.createDevlog(data);
    
    // Broadcast the new devlog to all connected clients
    broadcastUpdate('devlog-created', devlog);
    
    return NextResponse.json(devlog, { status: 201 });
  } catch (error) {
    console.error('Error creating devlog:', error);
    return NextResponse.json({ error: 'Failed to create devlog' }, { status: 500 });
  }
}
