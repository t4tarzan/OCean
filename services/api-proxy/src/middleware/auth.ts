import { Request, Response, NextFunction } from 'express';
import { Pool } from 'pg';

const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: 5432,
  database: 'ocean_db',
  user: 'ocean_user',
  password: process.env.POSTGRES_PASSWORD,
});

export async function verifyAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid authorization header' });
    }

    const token = authHeader.substring(7);
    
    const result = await pool.query(
      'SELECT id, email, role, status FROM platform_users WHERE id = $1 AND status = $2',
      [token, 'active']
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid token or inactive user' });
    }

    (req as any).user = {
      userId: result.rows[0].id,
      email: result.rows[0].email,
      role: result.rows[0].role,
    };

    next();
  } catch (error) {
    console.error('Auth error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
}
