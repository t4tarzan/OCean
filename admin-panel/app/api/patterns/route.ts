import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://ocean_user:OceanSecure2026!DB@localhost:5432/ocean_db'
});

export async function GET(request: NextRequest) {
  try {
    const result = await pool.query(`
      SELECT 
        id,
        name,
        category,
        description,
        success_rate,
        times_used,
        avg_time_to_implement,
        created_by,
        created_at,
        pattern_data
      FROM patterns
      ORDER BY times_used DESC, created_at DESC
      LIMIT 100
    `);

    const patterns = result.rows.map(row => ({
      ...row,
      author: {
        name: 'Team Member',
        avatar: null
      }
    }));

    return NextResponse.json({ patterns });
  } catch (error: any) {
    console.error('Patterns fetch error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, category, description, instructions } = body;

    const result = await pool.query(`
      INSERT INTO patterns (name, category, description, pattern_data, created_by)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [
      name,
      category,
      description,
      JSON.stringify({ instructions }),
      'current-user'
    ]);

    return NextResponse.json({ pattern: result.rows[0] });
  } catch (error: any) {
    console.error('Pattern creation error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
