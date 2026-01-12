/**
 * Achievement System
 * ==================
 * 
 * Gamification system that tracks user progress and unlocks rewards.
 * Achievements unlock MCPs, features, and other capabilities.
 */

import { Pool } from 'pg';
import { getActivityLogger } from '../activity/ActivityLogger';

export interface UserEvent {
  type: 'feature_completed' | 'pattern_shared' | 'help_given' | 'prompt_success';
  userId: string;
  timeTaken?: number;
  complexity?: string;
  metadata?: any;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  requirements: {
    type: string;
    count?: number;
    maxTime?: number;
    maxAttempts?: number;
  };
  unlocks_mcps?: string[];
  unlocks_features?: string[];
  created_at: Date;
}

export class AchievementSystem {
  private db: Pool;

  constructor(db: Pool) {
    this.db = db;
    this.ensureSchema();
  }

  private async ensureSchema(): Promise<void> {
    await this.db.query(`
      CREATE TABLE IF NOT EXISTS achievements (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        icon VARCHAR(10) NOT NULL,
        rarity VARCHAR(20) NOT NULL,
        requirements JSONB NOT NULL,
        unlocks_mcps TEXT[],
        unlocks_features TEXT[],
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS user_achievements (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id VARCHAR(255) NOT NULL,
        achievement_id UUID NOT NULL REFERENCES achievements(id),
        unlocked_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(user_id, achievement_id)
      );

      CREATE INDEX IF NOT EXISTS idx_user_achievements_user ON user_achievements(user_id);
      CREATE INDEX IF NOT EXISTS idx_user_achievements_achievement ON user_achievements(achievement_id);
    `);

    // Seed default achievements
    await this.seedAchievements();
  }

  private async seedAchievements(): Promise<void> {
    const achievements = [
      {
        name: 'First Blood',
        description: 'Ship your first feature with AI',
        icon: '🎯',
        rarity: 'common',
        requirements: { type: 'feature_count', count: 1 },
        unlocks_mcps: ['database-provisioner']
      },
      {
        name: 'Speed Demon',
        description: 'Ship a feature in under 10 minutes',
        icon: '⚡',
        rarity: 'rare',
        requirements: { type: 'speed', maxTime: 600000 },
        unlocks_mcps: ['rag-pipeline', 'knowledge-graph']
      },
      {
        name: 'Team Player',
        description: 'Help 5 teammates with patterns',
        icon: '🤝',
        rarity: 'epic',
        requirements: { type: 'help_count', count: 5 },
        unlocks_mcps: ['pattern-library-access']
      },
      {
        name: 'AI Whisperer',
        description: 'Get AI to solve complex problem in one prompt',
        icon: '🧙',
        rarity: 'legendary',
        requirements: { type: 'prompt_efficiency', maxAttempts: 1 },
        unlocks_mcps: ['all-advanced-mcps']
      },
      {
        name: 'Full Stack Hero',
        description: 'Ship complete app in one day',
        icon: '🦸',
        rarity: 'legendary',
        requirements: { type: 'full_stack', maxTime: 86400000 },
        unlocks_mcps: ['deployment-automation']
      }
    ];

    for (const achievement of achievements) {
      await this.db.query(`
        INSERT INTO achievements (name, description, icon, rarity, requirements, unlocks_mcps)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT DO NOTHING
      `, [
        achievement.name,
        achievement.description,
        achievement.icon,
        achievement.rarity,
        JSON.stringify(achievement.requirements),
        achievement.unlocks_mcps
      ]);
    }
  }

  /**
   * Check and unlock achievements for a user event
   */
  async checkAchievements(userId: string, event: UserEvent): Promise<Achievement[]> {
    const unlocked: Achievement[] = [];

    try {
      const achievements = await this.db.query('SELECT * FROM achievements');

      for (const achievement of achievements.rows) {
        // Check if already unlocked
        const existing = await this.db.query(`
          SELECT * FROM user_achievements
          WHERE user_id = $1 AND achievement_id = $2
        `, [userId, achievement.id]);

        if (existing.rows.length > 0) continue;

        // Check if criteria met
        if (await this.checkCriteria(userId, achievement.requirements, event)) {
          await this.unlockAchievement(userId, achievement);
          unlocked.push(achievement);
        }
      }
    } catch (error) {
      console.error('Failed to check achievements:', error);
    }

    return unlocked;
  }

  /**
   * Check if achievement criteria is met
   */
  private async checkCriteria(
    userId: string,
    requirements: any,
    event: UserEvent
  ): Promise<boolean> {
    try {
      switch (requirements.type) {
        case 'feature_count':
          const count = await this.getUserFeatureCount(userId);
          return count >= requirements.count;

        case 'speed':
          return event.type === 'feature_completed' &&
                 event.timeTaken !== undefined &&
                 event.timeTaken <= requirements.maxTime;

        case 'help_count':
          const helpCount = await this.getUserHelpCount(userId);
          return helpCount >= requirements.count;

        case 'pattern_share':
          const patterns = await this.getUserPatterns(userId);
          return patterns.length >= requirements.count;

        case 'prompt_efficiency':
          return event.type === 'prompt_success' &&
                 event.metadata?.attempts <= requirements.maxAttempts;

        case 'full_stack':
          return event.type === 'feature_completed' &&
                 event.metadata?.isFullStack &&
                 event.timeTaken !== undefined &&
                 event.timeTaken <= requirements.maxTime;

        default:
          return false;
      }
    } catch (error) {
      console.error('Failed to check criteria:', error);
      return false;
    }
  }

  /**
   * Unlock achievement for user
   */
  private async unlockAchievement(userId: string, achievement: any): Promise<void> {
    try {
      // 1. Store unlock
      await this.db.query(`
        INSERT INTO user_achievements (user_id, achievement_id)
        VALUES ($1, $2)
      `, [userId, achievement.id]);

      // 2. Grant rewards
      if (achievement.unlocks_mcps) {
        await this.unlockMCPs(userId, achievement.unlocks_mcps);
      }

      if (achievement.unlocks_features) {
        await this.unlockFeatures(userId, achievement.unlocks_features);
      }

      // 3. Log to activity feed
      const teamId = await this.getUserTeam(userId);
      if (teamId) {
        const activityLogger = getActivityLogger(this.db);
        await activityLogger.logAchievement(
          teamId,
          userId,
          achievement.name,
          achievement.description
        );
      }

      console.log(`🏆 Achievement unlocked: ${achievement.name} for user ${userId}`);
    } catch (error) {
      console.error('Failed to unlock achievement:', error);
    }
  }

  /**
   * Get user's feature count
   */
  private async getUserFeatureCount(userId: string): Promise<number> {
    const result = await this.db.query(`
      SELECT COUNT(*) as count FROM features
      WHERE created_by = $1 AND status = 'done'
    `, [userId]);
    return parseInt(result.rows[0]?.count || '0');
  }

  /**
   * Get user's help count
   */
  private async getUserHelpCount(userId: string): Promise<number> {
    const result = await this.db.query(`
      SELECT COUNT(*) as count FROM activity_feed
      WHERE actor_id = $1 AND activity_type = 'pattern_shared'
    `, [userId]);
    return parseInt(result.rows[0]?.count || '0');
  }

  /**
   * Get user's patterns
   */
  private async getUserPatterns(userId: string): Promise<any[]> {
    const result = await this.db.query(`
      SELECT * FROM patterns WHERE created_by = $1
    `, [userId]);
    return result.rows;
  }

  /**
   * Get user's team
   */
  private async getUserTeam(userId: string): Promise<string | null> {
    const result = await this.db.query(`
      SELECT team_id FROM team_members WHERE user_id = $1 LIMIT 1
    `, [userId]);
    return result.rows[0]?.team_id || null;
  }

  /**
   * Unlock MCPs for user
   */
  private async unlockMCPs(userId: string, mcps: string[]): Promise<void> {
    console.log(`🔓 Unlocking MCPs for user ${userId}:`, mcps);
    // Implementation would integrate with MCP system
  }

  /**
   * Unlock features for user
   */
  private async unlockFeatures(userId: string, features: string[]): Promise<void> {
    console.log(`🔓 Unlocking features for user ${userId}:`, features);
    // Implementation would integrate with feature flag system
  }

  /**
   * Get all achievements
   */
  async getAllAchievements(): Promise<Achievement[]> {
    const result = await this.db.query('SELECT * FROM achievements ORDER BY rarity, name');
    return result.rows;
  }

  /**
   * Get user's achievements
   */
  async getUserAchievements(userId: string): Promise<any[]> {
    const result = await this.db.query(`
      SELECT 
        a.*,
        ua.unlocked_at
      FROM user_achievements ua
      JOIN achievements a ON a.id = ua.achievement_id
      WHERE ua.user_id = $1
      ORDER BY ua.unlocked_at DESC
    `, [userId]);
    return result.rows;
  }
}

// Singleton instance
let achievementSystemInstance: AchievementSystem | null = null;

export function getAchievementSystem(db: Pool): AchievementSystem {
  if (!achievementSystemInstance) {
    achievementSystemInstance = new AchievementSystem(db);
  }
  return achievementSystemInstance;
}

export default AchievementSystem;
