import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';
import { getAchievementSystem } from '@/services/achievements/AchievementSystem';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://ocean_user:OceanSecure2026!DB@localhost:5432/ocean_db'
});

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId') || 'current-user';

    const achievementSystem = getAchievementSystem(pool);
    const achievements = await achievementSystem.getUserAchievements(userId);

    return NextResponse.json({ achievements });
  } catch (error: any) {
    console.error('User achievements fetch error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
