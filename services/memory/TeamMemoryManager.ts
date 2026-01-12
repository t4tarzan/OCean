/**
 * Team Memory Manager
 * ===================
 * 
 * Manages collective team memory, enabling teams to learn from projects
 * and share knowledge across all team members and agents.
 */

import { Pool } from 'pg';
import { getLettaClient, LettaClient } from '../../lib/letta/LettaClient';

export interface TeamMemory {
  id?: string;
  teamId: string;
  type: string;
  title: string;
  description: string;
  context?: any;
  lettaMemoryId?: string;
  tags?: string[];
  createdAt?: Date;
}

export interface Pattern {
  id: string;
  teamId: string;
  category: string;
  name: string;
  description: string;
  patternData: any;
  timesUsed: number;
  successRate: number;
  createdAt: Date;
  lastUsedAt?: Date;
}

export class TeamMemoryManager {
  private db: Pool;
  private letta: LettaClient;

  constructor(db: Pool) {
    this.db = db;
    this.letta = getLettaClient();
  }

  /**
   * Store team memory across all team agents
   */
  async storeTeamMemory(memory: TeamMemory): Promise<string> {
    try {
      // 1. Store in PostgreSQL
      const result = await this.db.query(`
        INSERT INTO team_memory (
          team_id, memory_type, title, description,
          context, letta_memory_id, tags
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id
      `, [
        memory.teamId,
        memory.type,
        memory.title,
        memory.description,
        JSON.stringify(memory.context || {}),
        memory.lettaMemoryId,
        memory.tags || []
      ]);

      const memoryId = result.rows[0].id;

      // 2. Archive in Letta for all team agents
      const teamAgents = await this.getTeamAgents(memory.teamId);
      for (const agent of teamAgents) {
        if (agent.letta_agent_id) {
          await this.letta.archiveMemory(
            agent.letta_agent_id,
            JSON.stringify({
              ...memory,
              id: memoryId
            }),
            {
              type: 'team_memory',
              team_id: memory.teamId,
              memory_type: memory.type
            }
          );
        }
      }

      console.log(`✅ Stored team memory: ${memory.title}`);
      return memoryId;
    } catch (error) {
      console.error('❌ Failed to store team memory:', error);
      throw error;
    }
  }

  /**
   * Search team memory
   */
  async searchTeamMemory(
    teamId: string,
    query: string,
    limit: number = 10
  ): Promise<TeamMemory[]> {
    try {
      const result = await this.db.query(`
        SELECT 
          id,
          team_id as "teamId",
          memory_type as type,
          title,
          description,
          context,
          letta_memory_id as "lettaMemoryId",
          tags,
          created_at as "createdAt"
        FROM team_memory
        WHERE team_id = $1
        AND (
          title ILIKE $2
          OR description ILIKE $2
          OR $3 = ANY(tags)
        )
        ORDER BY created_at DESC
        LIMIT $4
      `, [teamId, `%${query}%`, query, limit]);

      return result.rows;
    } catch (error) {
      console.error('❌ Failed to search team memory:', error);
      return [];
    }
  }

  /**
   * Get team patterns
   */
  async getTeamPatterns(teamId: string, category?: string): Promise<Pattern[]> {
    try {
      let sql = `
        SELECT 
          id,
          team_id as "teamId",
          category,
          name,
          description,
          pattern_data as "patternData",
          times_used as "timesUsed",
          success_rate as "successRate",
          created_at as "createdAt",
          last_used_at as "lastUsedAt"
        FROM patterns
        WHERE team_id = $1
      `;
      const params: any[] = [teamId];

      if (category) {
        sql += ' AND category = $2';
        params.push(category);
      }

      sql += ' ORDER BY times_used DESC, success_rate DESC';

      const result = await this.db.query(sql, params);
      return result.rows;
    } catch (error) {
      console.error('❌ Failed to get team patterns:', error);
      return [];
    }
  }

  /**
   * Store a successful pattern
   */
  async storePattern(pattern: Omit<Pattern, 'id' | 'createdAt'>): Promise<string> {
    try {
      const result = await this.db.query(`
        INSERT INTO patterns (
          team_id, category, name, description,
          pattern_data, times_used, success_rate
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id
      `, [
        pattern.teamId,
        pattern.category,
        pattern.name,
        pattern.description,
        JSON.stringify(pattern.patternData),
        pattern.timesUsed || 0,
        pattern.successRate || 0
      ]);

      console.log(`✅ Stored pattern: ${pattern.name}`);
      return result.rows[0].id;
    } catch (error) {
      console.error('❌ Failed to store pattern:', error);
      throw error;
    }
  }

  /**
   * Update pattern usage statistics
   */
  async updatePatternUsage(patternId: string, success: boolean): Promise<void> {
    try {
      await this.db.query(`
        UPDATE patterns
        SET 
          times_used = times_used + 1,
          success_rate = (
            (success_rate * times_used + $1) / (times_used + 1)
          ),
          last_used_at = NOW()
        WHERE id = $2
      `, [success ? 1 : 0, patternId]);

      console.log(`✅ Updated pattern usage: ${patternId}`);
    } catch (error) {
      console.error('❌ Failed to update pattern usage:', error);
    }
  }

  /**
   * Share memory across all team members
   */
  async shareMemoryAcrossTeam(memory: TeamMemory): Promise<void> {
    try {
      const teamMembers = await this.getTeamMembers(memory.teamId);

      for (const member of teamMembers) {
        // Store notification for team member
        await this.db.query(`
          INSERT INTO notifications (user_id, type, title, message, metadata)
          VALUES ($1, 'team_memory', $2, $3, $4)
        `, [
          member.id,
          `New Team Learning: ${memory.title}`,
          memory.description,
          JSON.stringify({ memoryId: memory.id, teamId: memory.teamId })
        ]);
      }

      console.log(`✅ Shared memory across team: ${memory.title}`);
    } catch (error) {
      console.error('❌ Failed to share memory across team:', error);
    }
  }

  /**
   * Get all agents for a team
   */
  private async getTeamAgents(teamId: string): Promise<any[]> {
    const result = await this.db.query(`
      SELECT id, name, type, letta_agent_id
      FROM agents
      WHERE id IN (
        SELECT agent_id FROM team_agents WHERE team_id = $1
      )
    `, [teamId]);

    return result.rows;
  }

  /**
   * Get all members of a team
   */
  private async getTeamMembers(teamId: string): Promise<any[]> {
    const result = await this.db.query(`
      SELECT u.id, u.email, u.name
      FROM users u
      JOIN team_members tm ON u.id = tm.user_id
      WHERE tm.team_id = $1
    `, [teamId]);

    return result.rows;
  }

  /**
   * Get team memory summary
   */
  async getTeamMemorySummary(teamId: string): Promise<any> {
    try {
      const stats = await this.db.query(`
        SELECT 
          COUNT(*) as total_memories,
          COUNT(DISTINCT memory_type) as memory_types,
          COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days') as recent_memories
        FROM team_memory
        WHERE team_id = $1
      `, [teamId]);

      const patterns = await this.db.query(`
        SELECT 
          COUNT(*) as total_patterns,
          AVG(success_rate) as avg_success_rate,
          SUM(times_used) as total_uses
        FROM patterns
        WHERE team_id = $1
      `, [teamId]);

      return {
        memories: stats.rows[0],
        patterns: patterns.rows[0]
      };
    } catch (error) {
      console.error('❌ Failed to get team memory summary:', error);
      return null;
    }
  }
}

// Singleton instance
let teamMemoryManagerInstance: TeamMemoryManager | null = null;

/**
 * Get or create singleton team memory manager
 */
export function getTeamMemoryManager(db: Pool): TeamMemoryManager {
  if (!teamMemoryManagerInstance) {
    teamMemoryManagerInstance = new TeamMemoryManager(db);
  }
  return teamMemoryManagerInstance;
}
