import { NextRequest, NextResponse } from 'next/server';
import { getDevlogManager } from '../../../../lib/devlog-manager';

// Mark this route as dynamic to prevent static generation
export const dynamic = 'force-dynamic';

// GET /api/devlogs/stats/timeseries - Get time series statistics for dashboard charts
export async function GET(request: NextRequest) {
  try {
    const devlogManager = await getDevlogManager();
    
    // Parse query parameters from NextRequest
    const days = request.nextUrl.searchParams.get('days') ? parseInt(request.nextUrl.searchParams.get('days')!) : undefined;
    const from = request.nextUrl.searchParams.get('from') || undefined;
    const to = request.nextUrl.searchParams.get('to') || undefined;

    const timeSeriesRequest = {
      ...(days && { days }),
      ...(from && { from }),
      ...(to && { to }),
    };

    const timeSeriesStats = await devlogManager.getTimeSeriesStats(timeSeriesRequest);
    return NextResponse.json(timeSeriesStats);
  } catch (error) {
    console.error('Error fetching time series stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch time series stats' }, 
      { status: 500 }
    );
  }
}
