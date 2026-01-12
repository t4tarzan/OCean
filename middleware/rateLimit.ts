/**
 * Rate Limiting Middleware
 * ========================
 * 
 * Redis-based rate limiting to prevent abuse and ensure fair usage.
 * Implements sliding window algorithm.
 */

import Redis from 'ioredis';
import { NextRequest, NextResponse } from 'next/server';

export interface RateLimitOptions {
  windowMs: number;
  max: number;
  message?: string;
  keyGenerator?: (req: NextRequest) => string;
}

export class RateLimiter {
  private redis: Redis;

  constructor() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD
    });
  }

  /**
   * Create rate limit middleware
   */
  middleware(options: RateLimitOptions) {
    return async (req: NextRequest): Promise<NextResponse | null> => {
      const key = options.keyGenerator 
        ? options.keyGenerator(req)
        : this.defaultKeyGenerator(req);

      const rateLimitKey = `ratelimit:${key}`;

      try {
        // Increment counter
        const current = await this.redis.incr(rateLimitKey);

        // Set expiry on first request
        if (current === 1) {
          await this.redis.pexpire(rateLimitKey, options.windowMs);
        }

        // Get TTL
        const ttl = await this.redis.pttl(rateLimitKey);

        // Check if limit exceeded
        if (current > options.max) {
          const retryAfter = Math.ceil(ttl / 1000);
          
          return new NextResponse(
            JSON.stringify({
              error: options.message || 'Too many requests',
              retryAfter
            }),
            {
              status: 429,
              headers: {
                'Content-Type': 'application/json',
                'X-RateLimit-Limit': options.max.toString(),
                'X-RateLimit-Remaining': '0',
                'X-RateLimit-Reset': new Date(Date.now() + ttl).toISOString(),
                'Retry-After': retryAfter.toString()
              }
            }
          );
        }

        // Add rate limit headers to response
        const response = NextResponse.next();
        response.headers.set('X-RateLimit-Limit', options.max.toString());
        response.headers.set('X-RateLimit-Remaining', (options.max - current).toString());
        response.headers.set('X-RateLimit-Reset', new Date(Date.now() + ttl).toISOString());

        return null; // Allow request to proceed
      } catch (error) {
        console.error('Rate limit error:', error);
        // On error, allow request (fail open)
        return null;
      }
    };
  }

  /**
   * Default key generator (IP + path)
   */
  private defaultKeyGenerator(req: NextRequest): string {
    const ip = req.headers.get('x-forwarded-for') || 
               req.headers.get('x-real-ip') || 
               'unknown';
    const path = new URL(req.url).pathname;
    return `${ip}:${path}`;
  }

  /**
   * Check rate limit status
   */
  async checkLimit(key: string, options: RateLimitOptions): Promise<{
    allowed: boolean;
    remaining: number;
    resetAt: Date;
  }> {
    const rateLimitKey = `ratelimit:${key}`;
    
    try {
      const current = await this.redis.get(rateLimitKey);
      const count = current ? parseInt(current) : 0;
      const ttl = await this.redis.pttl(rateLimitKey);

      return {
        allowed: count < options.max,
        remaining: Math.max(0, options.max - count),
        resetAt: new Date(Date.now() + (ttl > 0 ? ttl : options.windowMs))
      };
    } catch (error) {
      console.error('Check limit error:', error);
      return {
        allowed: true,
        remaining: options.max,
        resetAt: new Date(Date.now() + options.windowMs)
      };
    }
  }

  /**
   * Reset rate limit for key
   */
  async reset(key: string): Promise<void> {
    const rateLimitKey = `ratelimit:${key}`;
    await this.redis.del(rateLimitKey);
  }

  /**
   * Close Redis connection
   */
  async close(): Promise<void> {
    await this.redis.quit();
  }
}

// Predefined rate limit configurations
export const rateLimitConfigs = {
  // Strict limits for authentication endpoints
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5,
    message: 'Too many authentication attempts, please try again later'
  },
  
  // Standard API limits
  api: {
    windowMs: 60 * 1000, // 1 minute
    max: 60,
    message: 'API rate limit exceeded'
  },
  
  // Generous limits for read operations
  read: {
    windowMs: 60 * 1000, // 1 minute
    max: 120,
    message: 'Too many requests'
  },
  
  // Stricter limits for write operations
  write: {
    windowMs: 60 * 1000, // 1 minute
    max: 30,
    message: 'Too many write operations'
  },
  
  // Very strict for expensive operations
  expensive: {
    windowMs: 60 * 1000, // 1 minute
    max: 10,
    message: 'Rate limit exceeded for this operation'
  }
};

// Singleton instance
let rateLimiterInstance: RateLimiter | null = null;

export function getRateLimiter(): RateLimiter {
  if (!rateLimiterInstance) {
    rateLimiterInstance = new RateLimiter();
  }
  return rateLimiterInstance;
}

export default RateLimiter;
