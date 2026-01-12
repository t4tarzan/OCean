/**
 * Predictive Context Engine
 * =========================
 * 
 * Predicts and pre-loads relevant context for new projects based on
 * team history, similar projects, and learned patterns.
 */

import { Pool } from 'pg';
import { getLettaClient, LettaClient } from '../../lib/letta/LettaClient';
import { getKnowledgeGraphManager, KnowledgeGraphManager } from '../knowledge-graph/KnowledgeGraphManager';
import { getTeamMemoryManager, TeamMemoryManager } from '../memory/TeamMemoryManager';
import { TechStack } from '../knowledge-graph/KnowledgeGraphManager';

export interface PredictedContext {
  techStack: TechStack;
  patterns: Array<{
    id: string;
    name: string;
    category: string;
    description: string;
    successRate: number;
    timesUsed: number;
  }>;
  similarProjects: Array<{
    id: string;
    name: string;
    similarity: number;
    successRate: number;
  }>;
  suggestedModules: ReusableModule[];
  commonPitfalls: Pitfall[];
  estimatedTime: number;
  teamMemories: Array<{
    title: string;
    description: string;
    relevance: number;
  }>;
}

export interface ReusableModule {
  id: string;
  name: string;
  description: string;
  path: string;
  usageCount: number;
  similarity: number;
}

export interface Pitfall {
  description: string;
  solution: string;
  frequency: number;
}

export class PredictiveContextEngine {
  private db: Pool;
  private letta: LettaClient;
  private knowledgeGraph: KnowledgeGraphManager;
  private teamMemory: TeamMemoryManager;

  constructor(db: Pool) {
    this.db = db;
    this.letta = getLettaClient();
    this.knowledgeGraph = getKnowledgeGraphManager(db);
    this.teamMemory = getTeamMemoryManager(db);
  }

  /**
   * Predict context for a new project/feature
   */
  async predictContext(
    teamId: string,
    projectType: string,
    featureDescription: string
  ): Promise<PredictedContext> {
    try {
      console.log(`🔮 Predicting context for: ${featureDescription}`);

      // Run predictions in parallel for speed
      const [teamMemories, techStack, similarProjects, patterns] = await Promise.all([
        this.queryTeamMemory(teamId, projectType, featureDescription),
        this.knowledgeGraph.recommendTechStack(projectType, teamId),
        this.findSimilarProjects(teamId, projectType, featureDescription),
        this.getRelevantPatterns(teamId, featureDescription)
      ]);

      // Get additional context based on initial predictions
      const [suggestedModules, commonPitfalls] = await Promise.all([
        this.suggestReusableModules(teamId, featureDescription),
        this.predictPitfalls(teamId, projectType)
      ]);

      const estimatedTime = this.estimateTime(similarProjects, featureDescription);

      const predictions: PredictedContext = {
        techStack,
        patterns,
        similarProjects,
        suggestedModules,
        commonPitfalls,
        estimatedTime,
        teamMemories
      };

      console.log(`✅ Context predicted: ${patterns.length} patterns, ${similarProjects.length} similar projects`);
      return predictions;
    } catch (error) {
      console.error('❌ Failed to predict context:', error);
      return this.getDefaultContext();
    }
  }

  /**
   * Query team memory for relevant experiences
   */
  private async queryTeamMemory(
    teamId: string,
    projectType: string,
    featureDescription: string
  ): Promise<Array<{ title: string; description: string; relevance: number }>> {
    try {
      const memories = await this.teamMemory.searchTeamMemory(
        teamId,
        `${projectType} ${featureDescription}`,
        10
      );

      return memories.map(m => ({
        title: m.title,
        description: m.description,
        relevance: 0.8 // Could be calculated based on similarity
      }));
    } catch (error) {
      console.error('Failed to query team memory:', error);
      return [];
    }
  }

  /**
   * Find similar past projects
   */
  private async findSimilarProjects(
    teamId: string,
    projectType: string,
    description: string
  ): Promise<Array<{ id: string; name: string; similarity: number; successRate: number }>> {
    try {
      const projects = await this.db.query(`
        SELECT 
          id,
          name,
          status,
          created_at,
          completed_at
        FROM projects
        WHERE team_id = $1
          AND type = $2
          AND status = 'completed'
        ORDER BY completed_at DESC
        LIMIT 10
      `, [teamId, projectType]);

      // Calculate similarity based on description keywords
      const keywords = this.extractKeywords(description);
      const similar = [];

      for (const project of projects.rows) {
        const projectKeywords = this.extractKeywords(project.name);
        const similarity = this.calculateKeywordSimilarity(keywords, projectKeywords);
        
        if (similarity > 0.3) {
          similar.push({
            id: project.id,
            name: project.name,
            similarity,
            successRate: 0.85 // Could be calculated from actual metrics
          });
        }
      }

      return similar.sort((a, b) => b.similarity - a.similarity).slice(0, 5);
    } catch (error) {
      console.error('Failed to find similar projects:', error);
      return [];
    }
  }

  /**
   * Get relevant patterns for the feature
   */
  private async getRelevantPatterns(
    teamId: string,
    featureDescription: string
  ): Promise<Array<{
    id: string;
    name: string;
    category: string;
    description: string;
    successRate: number;
    timesUsed: number;
  }>> {
    try {
      const categories = this.inferCategories(featureDescription);
      
      const result = await this.db.query(`
        SELECT 
          id,
          name,
          category,
          description,
          success_rate as "successRate",
          times_used as "timesUsed"
        FROM patterns
        WHERE team_id = $1
          AND category = ANY($2)
        ORDER BY success_rate DESC, times_used DESC
        LIMIT 5
      `, [teamId, categories]);

      return result.rows;
    } catch (error) {
      console.error('Failed to get relevant patterns:', error);
      return [];
    }
  }

  /**
   * Suggest reusable modules from past projects
   */
  private async suggestReusableModules(
    teamId: string,
    description: string
  ): Promise<ReusableModule[]> {
    try {
      // For now, return empty array - would need reusable_modules table
      // This would track commonly reused code modules across projects
      return [];
    } catch (error) {
      console.error('Failed to suggest reusable modules:', error);
      return [];
    }
  }

  /**
   * Predict common pitfalls based on team history
   */
  private async predictPitfalls(
    teamId: string,
    projectType: string
  ): Promise<Pitfall[]> {
    try {
      const mistakes = await this.teamMemory.searchTeamMemory(
        teamId,
        `mistakes errors problems ${projectType}`,
        5
      );

      return mistakes
        .filter(m => m.type === 'mistake' || m.type === 'lesson')
        .map(m => ({
          description: m.description,
          solution: m.context?.solution || 'Review team documentation',
          frequency: 1
        }));
    } catch (error) {
      console.error('Failed to predict pitfalls:', error);
      return [];
    }
  }

  /**
   * Estimate time based on similar projects
   */
  private estimateTime(similarProjects: any[], description: string): number {
    if (similarProjects.length === 0) {
      // Default estimates based on description length
      const words = description.split(' ').length;
      if (words < 10) return 60; // 1 hour for simple features
      if (words < 30) return 180; // 3 hours for medium features
      return 480; // 8 hours for complex features
    }

    // Average time from similar projects
    // For now, return a reasonable default
    return 240; // 4 hours average
  }

  /**
   * Infer pattern categories from feature description
   */
  private inferCategories(description: string): string[] {
    const categories: string[] = [];
    const lower = description.toLowerCase();

    if (lower.includes('auth') || lower.includes('login') || lower.includes('user')) {
      categories.push('authentication');
    }
    if (lower.includes('api') || lower.includes('endpoint') || lower.includes('rest')) {
      categories.push('api');
    }
    if (lower.includes('database') || lower.includes('data') || lower.includes('schema')) {
      categories.push('database');
    }
    if (lower.includes('state') || lower.includes('redux') || lower.includes('store')) {
      categories.push('state');
    }
    if (lower.includes('ui') || lower.includes('component') || lower.includes('page')) {
      categories.push('ui');
    }

    return categories.length > 0 ? categories : ['general'];
  }

  /**
   * Extract keywords from text
   */
  private extractKeywords(text: string): string[] {
    const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for']);
    return text
      .toLowerCase()
      .split(/\W+/)
      .filter(word => word.length > 3 && !stopWords.has(word));
  }

  /**
   * Calculate keyword similarity between two sets
   */
  private calculateKeywordSimilarity(keywords1: string[], keywords2: string[]): number {
    if (keywords1.length === 0 || keywords2.length === 0) return 0;

    const set1 = new Set(keywords1);
    const set2 = new Set(keywords2);
    const intersection = new Set([...set1].filter(x => set2.has(x)));

    return intersection.size / Math.max(set1.size, set2.size);
  }

  /**
   * Get default context when prediction fails
   */
  private getDefaultContext(): PredictedContext {
    return {
      techStack: {
        framework: null,
        database: null,
        orm: null,
        styling: null,
        authentication: null
      },
      patterns: [],
      similarProjects: [],
      suggestedModules: [],
      commonPitfalls: [],
      estimatedTime: 240,
      teamMemories: []
    };
  }

  /**
   * Pre-load context for a team (cache warming)
   */
  async preloadTeamContext(teamId: string): Promise<void> {
    try {
      console.log(`🔄 Pre-loading context for team: ${teamId}`);

      // Load common project types
      const projectTypes = ['web', 'mobile', 'api', 'dashboard'];
      
      for (const type of projectTypes) {
        await this.predictContext(teamId, type, `New ${type} project`);
      }

      console.log(`✅ Pre-loaded context for team ${teamId}`);
    } catch (error) {
      console.error('❌ Failed to pre-load team context:', error);
    }
  }
}

// Singleton instance
let predictiveContextEngineInstance: PredictiveContextEngine | null = null;

/**
 * Get or create singleton predictive context engine
 */
export function getPredictiveContextEngine(db: Pool): PredictiveContextEngine {
  if (!predictiveContextEngineInstance) {
    predictiveContextEngineInstance = new PredictiveContextEngine(db);
  }
  return predictiveContextEngineInstance;
}
