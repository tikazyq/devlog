import { NextRequest, NextResponse } from 'next/server';
import { getDevlogManager } from '../../../../lib/devlog-manager';

// Mark this route as dynamic to prevent static generation  
export const dynamic = 'force-dynamic';

// GET /api/devlogs/stats/overview - Get devlog statistics
export async function GET(request: NextRequest) {
  try {
    const devlogManager = await getDevlogManager();

    const stats = await devlogManager.getStats();
    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
