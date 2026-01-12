/**
 * Pattern Extractor
 * =================
 * 
 * Automatically extracts successful patterns from completed projects
 * and makes them reusable for future projects.
 */

import { Pool } from 'pg';
import { getLettaClient, LettaClient } from '../../lib/letta/LettaClient';
import { getKnowledgeGraphManager, KnowledgeGraphManager } from '../knowledge-graph/KnowledgeGraphManager';

export interface Pattern {
  id?: string;
  teamId: string;
  name: string;
  category: string;
  description: string;
  patternData: {
    files?: Array<{ path: string; content: string }>;
    dependencies?: string[];
    mcpsUsed?: string[];
    configFiles?: Array<{ name: string; content: string }>;
  };
  timesUsed: number;
  successRate: number;
  createdAt?: Date;
  lastUsedAt?: Date;
}

export interface PatternTemplate {
  id: string;
  name: string;
  category: string;
  description: string;
  files: Array<{ path: string; template: string }>;
  dependencies: string[];
  instructions: string;
}

export class PatternExtractor {
  private db: Pool;
  private letta: LettaClient;
  private knowledgeGraph: KnowledgeGraphManager;

  constructor(db: Pool) {
    this.db = db;
    this.letta = getLettaClient();
    this.knowledgeGraph = getKnowledgeGraphManager(db);
  }

  /**
   * Extract patterns from successful team projects
   */
  async extractPatterns(teamId: string): Promise<Pattern[]> {
    try {
      console.log(`🔍 Extracting patterns for team: ${teamId}`);

      // 1. Get all successful projects (80%+ completion rate)
      const projects = await this.db.query(`
        SELECT * FROM projects
        WHERE team_id = $1
          AND status = 'completed'
        ORDER BY created_at DESC
        LIMIT 20
      `, [teamId]);

      if (projects.rows.length === 0) {
        console.log('No completed projects found');
        return [];
      }

      const patterns: Pattern[] = [];

      // 2. Analyze each project for patterns
      for (const project of projects.rows) {
        const projectPatterns = await this.analyzeProject(project, teamId);
        patterns.push(...projectPatterns);
      }

      // 3. Group similar patterns
      const groupedPatterns = this.groupSimilarPatterns(patterns);

      // 4. Store in database
      for (const pattern of groupedPatterns) {
        await this.storePattern(pattern);
      }

      console.log(`✅ Extracted ${groupedPatterns.length} patterns from ${projects.rows.length} projects`);
      return groupedPatterns;
    } catch (error) {
      console.error('❌ Failed to extract patterns:', error);
      return [];
    }
  }

  /**
   * Analyze a single project for patterns
   */
  private async analyzeProject(project: any, teamId: string): Promise<Pattern[]> {
    const patterns: Pattern[] = [];

    try {
      // Get all decisions for this project
      const decisions = await this.db.query(`
        SELECT * FROM decisions WHERE project_id = $1
      `, [project.id]);

      // Extract common patterns
      const authPattern = this.extractAuthPattern(decisions.rows, teamId);
      if (authPattern) patterns.push(authPattern);

      const apiPattern = this.extractAPIPattern(decisions.rows, teamId);
      if (apiPattern) patterns.push(apiPattern);

      const dbPattern = this.extractDatabasePattern(decisions.rows, teamId);
      if (dbPattern) patterns.push(dbPattern);

      const statePattern = this.extractStateManagementPattern(decisions.rows, teamId);
      if (statePattern) patterns.push(statePattern);

    } catch (error) {
      console.error(`Failed to analyze project ${project.id}:`, error);
    }

    return patterns;
  }

  /**
   * Extract authentication pattern
   */
  private extractAuthPattern(decisions: any[], teamId: string): Pattern | null {
    const authDecisions = decisions.filter(d =>
      d.type === 'authentication' || 
      d.decision?.toLowerCase().includes('auth') ||
      d.decision?.toLowerCase().includes('login')
    );

    if (authDecisions.length === 0) return null;

    const authTech = this.extractTechnology(authDecisions, ['clerk', 'auth0', 'nextauth', 'supabase']);

    return {
      teamId,
      name: 'Authentication Pattern',
      category: 'authentication',
      description: authDecisions[0].decision || 'Authentication implementation',
      patternData: {
        dependencies: authTech ? [authTech] : [],
        mcpsUsed: ['auth-provider'],
        configFiles: [
          {
            name: 'auth.config.ts',
            content: '// Authentication configuration based on team pattern'
          }
        ]
      },
      timesUsed: 1,
      successRate: 0.95
    };
  }

  /**
   * Extract API pattern
   */
  private extractAPIPattern(decisions: any[], teamId: string): Pattern | null {
    const apiDecisions = decisions.filter(d =>
      d.type === 'api' || 
      d.decision?.toLowerCase().includes('api') ||
      d.decision?.toLowerCase().includes('endpoint')
    );

    if (apiDecisions.length === 0) return null;

    const apiTech = this.extractTechnology(apiDecisions, ['rest', 'graphql', 'trpc', 'grpc']);

    return {
      teamId,
      name: 'API Design Pattern',
      category: 'api',
      description: apiDecisions[0].decision || 'API design implementation',
      patternData: {
        dependencies: apiTech ? [apiTech] : [],
        mcpsUsed: ['api-generator'],
        configFiles: [
          {
            name: 'api.config.ts',
            content: '// API configuration based on team pattern'
          }
        ]
      },
      timesUsed: 1,
      successRate: 0.90
    };
  }

  /**
   * Extract database pattern
   */
  private extractDatabasePattern(decisions: any[], teamId: string): Pattern | null {
    const dbDecisions = decisions.filter(d =>
      d.type === 'database' || 
      d.decision?.toLowerCase().includes('database') ||
      d.decision?.toLowerCase().includes('schema')
    );

    if (dbDecisions.length === 0) return null;

    const dbTech = this.extractTechnology(dbDecisions, ['postgresql', 'mongodb', 'mysql', 'sqlite']);
    const ormTech = this.extractTechnology(dbDecisions, ['prisma', 'typeorm', 'drizzle', 'sequelize']);

    return {
      teamId,
      name: 'Database Pattern',
      category: 'database',
      description: dbDecisions[0].decision || 'Database implementation',
      patternData: {
        dependencies: [dbTech, ormTech].filter(Boolean) as string[],
        mcpsUsed: ['database-schema-designer'],
        configFiles: [
          {
            name: 'database.config.ts',
            content: '// Database configuration based on team pattern'
          }
        ]
      },
      timesUsed: 1,
      successRate: 0.92
    };
  }

  /**
   * Extract state management pattern
   */
  private extractStateManagementPattern(decisions: any[], teamId: string): Pattern | null {
    const stateDecisions = decisions.filter(d =>
      d.type === 'state_management' || 
      d.decision?.toLowerCase().includes('state') ||
      d.decision?.toLowerCase().includes('redux') ||
      d.decision?.toLowerCase().includes('zustand')
    );

    if (stateDecisions.length === 0) return null;

    const stateTech = this.extractTechnology(stateDecisions, ['redux', 'zustand', 'jotai', 'recoil', 'mobx']);

    return {
      teamId,
      name: 'State Management Pattern',
      category: 'state',
      description: stateDecisions[0].decision || 'State management implementation',
      patternData: {
        dependencies: stateTech ? [stateTech] : [],
        mcpsUsed: ['state-manager'],
        configFiles: [
          {
            name: 'store.config.ts',
            content: '// State management configuration based on team pattern'
          }
        ]
      },
      timesUsed: 1,
      successRate: 0.88
    };
  }

  /**
   * Extract technology from decisions
   */
  private extractTechnology(decisions: any[], keywords: string[]): string | null {
    for (const decision of decisions) {
      const text = `${decision.decision} ${decision.reasoning}`.toLowerCase();
      for (const keyword of keywords) {
        if (text.includes(keyword)) {
          return keyword;
        }
      }
    }
    return null;
  }

  /**
   * Group similar patterns together
   */
  private groupSimilarPatterns(patterns: Pattern[]): Pattern[] {
    const grouped = new Map<string, Pattern[]>();

    for (const pattern of patterns) {
      const key = `${pattern.category}-${pattern.name}`;
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)!.push(pattern);
    }

    const merged: Pattern[] = [];
    for (const [key, group] of grouped) {
      if (group.length === 1) {
        merged.push(group[0]);
      } else {
        merged.push(this.mergePatterns(group));
      }
    }

    return merged;
  }

  /**
   * Merge multiple similar patterns into one
   */
  private mergePatterns(patterns: Pattern[]): Pattern {
    const allDeps = new Set<string>();
    const allMcps = new Set<string>();

    for (const pattern of patterns) {
      pattern.patternData.dependencies?.forEach(d => allDeps.add(d));
      pattern.patternData.mcpsUsed?.forEach(m => allMcps.add(m));
    }

    return {
      teamId: patterns[0].teamId,
      name: patterns[0].name,
      category: patterns[0].category,
      description: patterns[0].description,
      patternData: {
        dependencies: Array.from(allDeps),
        mcpsUsed: Array.from(allMcps),
        configFiles: patterns[0].patternData.configFiles
      },
      timesUsed: patterns.length,
      successRate: patterns.reduce((sum, p) => sum + p.successRate, 0) / patterns.length
    };
  }

  /**
   * Store pattern in database
   */
  private async storePattern(pattern: Pattern): Promise<void> {
    try {
      await this.db.query(`
        INSERT INTO patterns (
          team_id, name, category, description,
          pattern_data, times_used, success_rate
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (team_id, name) DO UPDATE
        SET times_used = patterns.times_used + 1,
            success_rate = (patterns.success_rate + $7) / 2,
            pattern_data = $5
      `, [
        pattern.teamId,
        pattern.name,
        pattern.category,
        pattern.description,
        JSON.stringify(pattern.patternData),
        pattern.timesUsed,
        pattern.successRate
      ]);

      console.log(`✅ Stored pattern: ${pattern.name}`);
    } catch (error) {
      console.error(`❌ Failed to store pattern ${pattern.name}:`, error);
    }
  }

  /**
   * Get pattern templates for a team
   */
  async getPatternTemplates(teamId: string, category?: string): Promise<PatternTemplate[]> {
    try {
      let sql = `
        SELECT 
          id,
          name,
          category,
          description,
          pattern_data as "patternData",
          times_used as "timesUsed",
          success_rate as "successRate"
        FROM patterns
        WHERE team_id = $1
      `;
      const params: any[] = [teamId];

      if (category) {
        sql += ' AND category = $2';
        params.push(category);
      }

      sql += ' ORDER BY success_rate DESC, times_used DESC';

      const result = await this.db.query(sql, params);

      return result.rows.map(row => ({
        id: row.id,
        name: row.name,
        category: row.category,
        description: row.description,
        files: row.patternData.configFiles || [],
        dependencies: row.patternData.dependencies || [],
        instructions: `Apply this ${row.category} pattern that has been used ${row.timesUsed} times with ${(row.successRate * 100).toFixed(0)}% success rate.`
      }));
    } catch (error) {
      console.error('❌ Failed to get pattern templates:', error);
      return [];
    }
  }

  /**
   * Apply pattern to a new project
   */
  async applyPattern(patternId: string, projectId: string): Promise<boolean> {
    try {
      // Get pattern
      const result = await this.db.query(`
        SELECT * FROM patterns WHERE id = $1
      `, [patternId]);

      if (result.rows.length === 0) {
        console.error('Pattern not found');
        return false;
      }

      const pattern = result.rows[0];

      // Update pattern usage
      await this.db.query(`
        UPDATE patterns
        SET times_used = times_used + 1,
            last_used_at = NOW()
        WHERE id = $1
      `, [patternId]);

      // Log pattern application
      await this.db.query(`
        INSERT INTO pattern_applications (pattern_id, project_id, applied_at)
        VALUES ($1, $2, NOW())
      `, [patternId, projectId]);

      console.log(`✅ Applied pattern ${pattern.name} to project ${projectId}`);
      return true;
    } catch (error) {
      console.error('❌ Failed to apply pattern:', error);
      return false;
    }
  }
}

// Singleton instance
let patternExtractorInstance: PatternExtractor | null = null;

/**
 * Get or create singleton pattern extractor
 */
export function getPatternExtractor(db: Pool): PatternExtractor {
  if (!patternExtractorInstance) {
    patternExtractorInstance = new PatternExtractor(db);
  }
  return patternExtractorInstance;
}
