import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://ocean_user:OceanSecure2026!DB@localhost:5432/ocean_db'
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, message, context } = body;

    await pool.query(`
      INSERT INTO feedback (type, message, context, created_at)
      VALUES ($1, $2, $3, NOW())
    `, [type, message, JSON.stringify(context)]);

    console.log(`📝 Feedback received: ${type} - ${message}`);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Feedback submission error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
