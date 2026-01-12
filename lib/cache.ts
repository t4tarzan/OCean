/**
 * Cache Manager
 * =============
 * 
 * Redis-based caching system with cache-aside pattern.
 * Reduces database load and improves API response times.
 */

import Redis from 'ioredis';

export interface CacheOptions {
  ttl?: number;
  prefix?: string;
}

export class CacheManager {
  private redis: Redis;
  private defaultTTL: number = 3600; // 1 hour

  constructor() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      }
    });

    this.redis.on('error', (err) => {
      console.error('Redis connection error:', err);
    });

    this.redis.on('connect', () => {
      console.log('✅ Redis cache connected');
    });
  }

  /**
   * Get value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const cached = await this.redis.get(key);
      if (!cached) return null;
      return JSON.parse(cached) as T;
    } catch (error) {
      console.error(`Cache get error for key ${key}:`, error);
      return null;
    }
  }

  /**
   * Set value in cache with TTL
   */
  async set(key: string, value: any, ttl: number = this.defaultTTL): Promise<void> {
    try {
      await this.redis.setex(key, ttl, JSON.stringify(value));
    } catch (error) {
      console.error(`Cache set error for key ${key}:`, error);
    }
  }

  /**
   * Delete specific key
   */
  async delete(key: string): Promise<void> {
    try {
      await this.redis.del(key);
    } catch (error) {
      console.error(`Cache delete error for key ${key}:`, error);
    }
  }

  /**
   * Invalidate keys matching pattern
   */
  async invalidate(pattern: string): Promise<void> {
    try {
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        await this.redis.del(...keys);
        console.log(`🗑️ Invalidated ${keys.length} cache keys matching: ${pattern}`);
      }
    } catch (error) {
      console.error(`Cache invalidate error for pattern ${pattern}:`, error);
    }
  }

  /**
   * Cache-aside pattern: Try cache first, fetch on miss, then cache
   */
  async cacheAside<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl: number = this.defaultTTL
  ): Promise<T> {
    // Try cache first
    const cached = await this.get<T>(key);
    if (cached !== null) {
      console.log(`✅ Cache hit: ${key}`);
      return cached;
    }

    console.log(`❌ Cache miss: ${key}`);

    // Fetch from source
    const data = await fetcher();

    // Store in cache
    await this.set(key, data, ttl);

    return data;
  }

  /**
   * Batch get multiple keys
   */
  async mget<T>(keys: string[]): Promise<(T | null)[]> {
    try {
      const values = await this.redis.mget(...keys);
      return values.map(v => v ? JSON.parse(v) as T : null);
    } catch (error) {
      console.error('Cache mget error:', error);
      return keys.map(() => null);
    }
  }

  /**
   * Batch set multiple keys
   */
  async mset(items: Array<{ key: string; value: any; ttl?: number }>): Promise<void> {
    try {
      const pipeline = this.redis.pipeline();
      for (const item of items) {
        const ttl = item.ttl || this.defaultTTL;
        pipeline.setex(item.key, ttl, JSON.stringify(item.value));
      }
      await pipeline.exec();
    } catch (error) {
      console.error('Cache mset error:', error);
    }
  }

  /**
   * Increment counter
   */
  async increment(key: string, ttl?: number): Promise<number> {
    try {
      const value = await this.redis.incr(key);
      if (ttl && value === 1) {
        await this.redis.expire(key, ttl);
      }
      return value;
    } catch (error) {
      console.error(`Cache increment error for key ${key}:`, error);
      return 0;
    }
  }

  /**
   * Get TTL for key
   */
  async ttl(key: string): Promise<number> {
    try {
      return await this.redis.ttl(key);
    } catch (error) {
      console.error(`Cache TTL error for key ${key}:`, error);
      return -1;
    }
  }

  /**
   * Check if key exists
   */
  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.redis.exists(key);
      return result === 1;
    } catch (error) {
      console.error(`Cache exists error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<any> {
    try {
      const info = await this.redis.info('stats');
      const keyspace = await this.redis.info('keyspace');
      return {
        info,
        keyspace,
        connected: this.redis.status === 'ready'
      };
    } catch (error) {
      console.error('Cache stats error:', error);
      return null;
    }
  }

  /**
   * Clear all cache
   */
  async clear(): Promise<void> {
    try {
      await this.redis.flushdb();
      console.log('🗑️ Cache cleared');
    } catch (error) {
      console.error('Cache clear error:', error);
    }
  }

  /**
   * Close Redis connection
   */
  async close(): Promise<void> {
    await this.redis.quit();
  }
}

// Singleton instance
let cacheManagerInstance: CacheManager | null = null;

export function getCacheManager(): CacheManager {
  if (!cacheManagerInstance) {
    cacheManagerInstance = new CacheManager();
  }
  return cacheManagerInstance;
}

export default CacheManager;
