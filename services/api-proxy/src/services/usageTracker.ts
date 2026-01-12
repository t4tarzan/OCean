import { Pool } from 'pg';

const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: 5432,
  database: 'ocean_db',
  user: 'ocean_user',
  password: process.env.POSTGRES_PASSWORD,
});

interface UsageData {
  userId: string;
  service: string;
  model: string;
  endpoint: string;
  method: string;
  tokensIn: number;
  tokensOut: number;
  duration: number;
  timestamp: Date;
}

export async function logUsage(data: UsageData): Promise<void> {
  const cost = calculateCost(data.service, data.model, data.tokensIn, data.tokensOut);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS api_usage (
      id SERIAL PRIMARY KEY,
      user_id UUID,
      service VARCHAR(50),
      model VARCHAR(100),
      endpoint VARCHAR(255),
      method VARCHAR(10),
      tokens_in INTEGER,
      tokens_out INTEGER,
      total_tokens INTEGER,
      cost DECIMAL(10, 6),
      duration INTEGER,
      timestamp TIMESTAMP DEFAULT NOW()
    )
  `);

  await pool.query(
    `INSERT INTO api_usage 
     (user_id, service, model, endpoint, method, tokens_in, tokens_out, total_tokens, cost, duration, timestamp)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
    [
      data.userId,
      data.service,
      data.model,
      data.endpoint,
      data.method,
      data.tokensIn,
      data.tokensOut,
      data.tokensIn + data.tokensOut,
      cost,
      data.duration,
      data.timestamp,
    ]
  );
}

function calculateCost(service: string, model: string, tokensIn: number, tokensOut: number): number {
  const pricing: Record<string, { input: number; output: number }> = {
    'claude-3-opus-20240229': { input: 0.015 / 1000, output: 0.075 / 1000 },
    'claude-3-sonnet-20240229': { input: 0.003 / 1000, output: 0.015 / 1000 },
    'claude-3-haiku-20240307': { input: 0.00025 / 1000, output: 0.00125 / 1000 },
    'gpt-4-turbo': { input: 0.01 / 1000, output: 0.03 / 1000 },
    'gpt-4': { input: 0.03 / 1000, output: 0.06 / 1000 },
    'gpt-3.5-turbo': { input: 0.0005 / 1000, output: 0.0015 / 1000 },
    'gemini-pro': { input: 0.00025 / 1000, output: 0.0005 / 1000 },
    'llama-3.1-70b-versatile': { input: 0.00059 / 1000000, output: 0.00079 / 1000000 },
    'llama-3.1-8b-instant': { input: 0.00005 / 1000000, output: 0.00008 / 1000000 },
    'mixtral-8x7b-32768': { input: 0.00024 / 1000000, output: 0.00024 / 1000000 },
  };

  const modelPricing = pricing[model] || { input: 0.001 / 1000, output: 0.002 / 1000 };
  return tokensIn * modelPricing.input + tokensOut * modelPricing.output;
}
