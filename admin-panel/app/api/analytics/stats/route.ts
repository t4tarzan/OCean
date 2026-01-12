import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';
import { getAnalyticsEngine } from '@/services/analytics/AnalyticsEngine';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://ocean_user:OceanSecure2026!DB@localhost:5432/ocean_db'
});

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const teamId = searchParams.get('teamId') || 'default-team';
    const period = searchParams.get('period') || '30d';

    const analyticsEngine = getAnalyticsEngine(pool);
    const stats = await analyticsEngine.calculateTeamStats(teamId, period);

    return NextResponse.json({ stats });
  } catch (error: any) {
    console.error('Analytics stats error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
