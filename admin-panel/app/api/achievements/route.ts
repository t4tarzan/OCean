import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';
import { getAchievementSystem } from '@/services/achievements/AchievementSystem';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://ocean_user:OceanSecure2026!DB@localhost:5432/ocean_db'
});

export async function GET(request: NextRequest) {
  try {
    const achievementSystem = getAchievementSystem(pool);
    const achievements = await achievementSystem.getAllAchievements();

    return NextResponse.json({ achievements });
  } catch (error: any) {
    console.error('Achievements fetch error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
