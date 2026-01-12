/**
 * Activity Logger
 * ===============
 * 
 * Captures and logs all team events for the activity feed.
 * Stores in PostgreSQL and broadcasts via Redis pub/sub.
 */

import { Pool } from 'pg';
import { createClient, RedisClientType } from 'redis';

export interface ActivityInput {
  teamId: string;
  type: 'feature_completed' | 'pattern_shared' | 'achievement' | 'decision_made' | 'agent_task';
  actorId: string;
  actorType: 'user' | 'agent';
  title: string;
  description: string;
  metadata?: Record<string, any>;
  replayUrl?: string;
}

export interface Activity extends ActivityInput {
  id: string;
  reactions: Record<string, string[]>;
  commentsCount: number;
  createdAt: Date;
}

export class ActivityLogger {
  private db: Pool;
  private redis: RedisClientType;

  constructor(db: Pool) {
    this.db = db;
    this.redis = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379'
    });
    this.initialize();
  }

  private async initialize(): Promise<void> {
    await this.redis.connect();
    await this.ensureSchema();
    console.log('✅ Activity Logger initialized');
  }

  private async ensureSchema(): Promise<void> {
    await this.db.query(`
      CREATE TABLE IF NOT EXISTS activity_feed (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        team_id UUID NOT NULL,
        activity_type VARCHAR(50) NOT NULL,
        actor_id VARCHAR(255) NOT NULL,
        actor_type VARCHAR(20) NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        metadata JSONB,
        replay_url TEXT,
        reactions JSONB DEFAULT '{}',
        comments_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_activity_feed_team ON activity_feed(team_id);
      CREATE INDEX IF NOT EXISTS idx_activity_feed_type ON activity_feed(activity_type);
      CREATE INDEX IF NOT EXISTS idx_activity_feed_created ON activity_feed(created_at DESC);
    `);
  }

  /**
   * Log a new activity
   */
  async logActivity(activity: ActivityInput): Promise<string> {
    try {
      const result = await this.db.query(`
        INSERT INTO activity_feed (
          team_id, activity_type, actor_id, actor_type,
          title, description, metadata, replay_url
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id
      `, [
        activity.teamId,
        activity.type,
        activity.actorId,
        activity.actorType,
        activity.title,
        activity.description,
        JSON.stringify(activity.metadata || {}),
        activity.replayUrl
      ]);

      const activityId = result.rows[0].id;

      // Broadcast to Redis for real-time updates
      await this.redis.publish('activity_feed', JSON.stringify({
        type: 'new_activity',
        teamId: activity.teamId,
        activityId
      }));

      console.log(`📝 Logged activity: ${activity.title}`);
      return activityId;
    } catch (error) {
      console.error('Failed to log activity:', error);
      throw error;
    }
  }

  /**
   * Get activities for a team
   */
  async getActivities(
    teamId: string,
    filter?: string,
    limit: number = 50
  ): Promise<Activity[]> {
    try {
      let query = `
        SELECT 
          id,
          team_id as "teamId",
          activity_type as "activityType",
          actor_id as "actorId",
          actor_type as "actorType",
          title,
          description,
          metadata,
          replay_url as "replayUrl",
          reactions,
          comments_count as "commentsCount",
          created_at as "createdAt"
        FROM activity_feed
        WHERE team_id = $1
      `;

      const params: any[] = [teamId];

      if (filter && filter !== 'all') {
        query += ' AND activity_type = $2';
        params.push(filter);
      }

      query += ' ORDER BY created_at DESC LIMIT $' + (params.length + 1);
      params.push(limit);

      const result = await this.db.query(query, params);
      return result.rows;
    } catch (error) {
      console.error('Failed to get activities:', error);
      return [];
    }
  }

  /**
   * Add reaction to activity
   */
  async addReaction(activityId: string, userId: string, emoji: string): Promise<void> {
    try {
      await this.db.query(`
        UPDATE activity_feed
        SET reactions = jsonb_set(
          COALESCE(reactions, '{}'::jsonb),
          ARRAY[$1],
          COALESCE(reactions->$1, '[]'::jsonb) || $2::jsonb,
          true
        )
        WHERE id = $3
      `, [emoji, JSON.stringify([userId]), activityId]);

      console.log(`👍 Added reaction ${emoji} to activity ${activityId}`);
    } catch (error) {
      console.error('Failed to add reaction:', error);
    }
  }

  /**
   * Remove reaction from activity
   */
  async removeReaction(activityId: string, userId: string, emoji: string): Promise<void> {
    try {
      // Get current reactions
      const result = await this.db.query(`
        SELECT reactions FROM activity_feed WHERE id = $1
      `, [activityId]);

      if (result.rows.length === 0) return;

      const reactions = result.rows[0].reactions || {};
      if (reactions[emoji]) {
        reactions[emoji] = reactions[emoji].filter((id: string) => id !== userId);
        if (reactions[emoji].length === 0) {
          delete reactions[emoji];
        }
      }

      await this.db.query(`
        UPDATE activity_feed SET reactions = $1 WHERE id = $2
      `, [JSON.stringify(reactions), activityId]);

      console.log(`👎 Removed reaction ${emoji} from activity ${activityId}`);
    } catch (error) {
      console.error('Failed to remove reaction:', error);
    }
  }

  /**
   * Increment comment count
   */
  async incrementCommentCount(activityId: string): Promise<void> {
    try {
      await this.db.query(`
        UPDATE activity_feed
        SET comments_count = comments_count + 1
        WHERE id = $1
      `, [activityId]);
    } catch (error) {
      console.error('Failed to increment comment count:', error);
    }
  }

  /**
   * Log feature completion
   */
  async logFeatureCompleted(
    teamId: string,
    userId: string,
    featureTitle: string,
    metadata: {
      timeTaken?: number;
      aiAssisted?: boolean;
      agentCount?: number;
      linesOfCode?: number;
    }
  ): Promise<string> {
    return this.logActivity({
      teamId,
      type: 'feature_completed',
      actorId: userId,
      actorType: 'user',
      title: featureTitle,
      description: `Successfully completed feature: ${featureTitle}`,
      metadata
    });
  }

  /**
   * Log pattern shared
   */
  async logPatternShared(
    teamId: string,
    userId: string,
    patternName: string,
    patternDescription: string
  ): Promise<string> {
    return this.logActivity({
      teamId,
      type: 'pattern_shared',
      actorId: userId,
      actorType: 'user',
      title: `Shared pattern: ${patternName}`,
      description: patternDescription
    });
  }

  /**
   * Log achievement unlocked
   */
  async logAchievement(
    teamId: string,
    userId: string,
    achievementName: string,
    achievementDescription: string
  ): Promise<string> {
    return this.logActivity({
      teamId,
      type: 'achievement',
      actorId: userId,
      actorType: 'user',
      title: `🏆 ${achievementName}`,
      description: achievementDescription
    });
  }

  /**
   * Close connections
   */
  async close(): Promise<void> {
    await this.redis.quit();
  }
}

// Singleton instance
let activityLoggerInstance: ActivityLogger | null = null;

export function getActivityLogger(db: Pool): ActivityLogger {
  if (!activityLoggerInstance) {
    activityLoggerInstance = new ActivityLogger(db);
  }
  return activityLoggerInstance;
}

export default ActivityLogger;
