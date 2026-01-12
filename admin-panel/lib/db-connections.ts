import { Pool } from 'pg';
import neo4j from 'neo4j-driver';
import { createClient } from 'redis';

// PostgreSQL Connection Pool
export const pgPool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: 5432,
  database: 'ocean_db',
  user: 'ocean_user',
  password: process.env.POSTGRES_PASSWORD || 'OceanSecure2026!DB',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Neo4j Driver
export const neo4jDriver = neo4j.driver(
  process.env.NEO4J_URI || 'bolt://localhost:7687',
  neo4j.auth.basic(
    process.env.NEO4J_USER || 'neo4j',
    process.env.NEO4J_PASSWORD || 'OceanNeo4j2026!'
  )
);

// Redis Client
export const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});

redisClient.on('error', (err) => console.error('Redis Client Error', err));

// Helper function to query PostgreSQL
export async function queryPostgres<T = any>(sql: string, params?: any[]): Promise<T[]> {
  const client = await pgPool.connect();
  try {
    const result = await client.query(sql, params);
    return result.rows;
  } finally {
    client.release();
  }
}

// Helper function to query Neo4j
export async function queryNeo4j<T = any>(cypher: string, params?: any): Promise<T[]> {
  const session = neo4jDriver.session();
  try {
    const result = await session.run(cypher, params);
    return result.records.map(record => record.toObject() as T);
  } finally {
    await session.close();
  }
}

// Initialize Redis connection
export async function initRedis() {
  if (!redisClient.isOpen) {
    await redisClient.connect();
  }
  return redisClient;
}
