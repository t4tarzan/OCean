/**
 * Letta Enhanced Agent Base Class
 * ================================
 * 
 * Extends agents with Letta (MemGPT) memory capabilities.
 * Provides persistent memory, learning from past experiences, and context recall.
 */

import { LettaClient, getLettaClient } from '../../../../lib/letta/LettaClient';
import { pool } from '../db';

export interface AgentConfig {
  id: string;
  type: string;
  name: string;
  model: string;
}

export interface TaskContext {
  description: string;
  requirements?: any;
  projectId?: string;
  memory?: any;
}

export interface TaskResult {
  success: boolean;
  approach: string;
  output: any;
  learnings?: string[];
}

export abstract class LettaEnhancedAgent {
  protected id: string;
  protected type: string;
  protected name: string;
  protected model: string;
  protected letta: LettaClient;
  protected lettaAgentId: string | null = null;

  constructor(config: AgentConfig) {
    this.id = config.id;
    this.type = config.type;
    this.name = config.name;
    this.model = config.model;
    this.letta = getLettaClient();
  }

  /**
   * Initialize Letta agent with specific persona
   */
  async initializeLettaAgent(): Promise<void> {
    try {
      // Check if Letta agent already exists
      const existing = await pool.query(
        'SELECT letta_agent_id FROM agents WHERE id = $1',
        [this.id]
      );

      if (existing.rows[0]?.letta_agent_id) {
        this.lettaAgentId = existing.rows[0].letta_agent_id;
        console.log(`✅ Letta agent ${this.lettaAgentId} already exists for ${this.name}`);
        return;
      }

      // Create new Letta agent
      const lettaAgent = await this.letta.createAgent({
        name: `${this.type}-${this.id}`,
        persona: this.getPersona(),
        human: 'OCEAN Development Team',
        model: this.model
      });

      this.lettaAgentId = lettaAgent.id;

      // Store Letta agent ID in database
      await pool.query(
        'UPDATE agents SET letta_agent_id = $1 WHERE id = $2',
        [this.lettaAgentId, this.id]
      );

      console.log(`✅ Created Letta agent ${this.lettaAgentId} for ${this.name}`);
    } catch (error) {
      console.error(`❌ Failed to initialize Letta agent for ${this.name}:`, error);
      // Continue without Letta if it fails
    }
  }

  /**
   * Get agent-specific persona for Letta
   */
  protected abstract getPersona(): string;

  /**
   * Execute task with memory context
   */
  protected async executeWithMemory(
    task: TaskContext,
    context: any
  ): Promise<TaskResult> {
    if (!this.lettaAgentId) {
      // Fallback to execution without memory
      return await this.execute(task, context);
    }

    try {
      // 1. Load relevant memory
      const memory = await this.loadRelevantMemory(task);

      // 2. Execute task with memory context
      const result = await this.execute(task, { ...context, memory });

      // 3. Save new learnings to memory
      await this.saveToMemory(task, result);

      return result;
    } catch (error) {
      console.error(`❌ Error executing with memory:`, error);
      // Fallback to execution without memory
      return await this.execute(task, context);
    }
  }

  /**
   * Execute task (to be implemented by subclasses)
   */
  protected abstract execute(task: TaskContext, context: any): Promise<TaskResult>;

  /**
   * Load relevant memory for task
   */
  private async loadRelevantMemory(task: TaskContext): Promise<any> {
    if (!this.lettaAgentId) return null;

    try {
      // Search archival memory for relevant past experiences
      const relevantMemories = await this.letta.searchArchival(
        this.lettaAgentId,
        `${task.description}`,
        5
      );

      // Get core memory (agent's persistent knowledge)
      const coreMemory = await this.letta.loadMemory(this.lettaAgentId);

      // Get recent conversation history
      const recall = await this.letta.getConversationHistory(this.lettaAgentId, 10);

      return {
        core: coreMemory,
        archival: relevantMemories,
        recall: recall
      };
    } catch (error) {
      console.error(`⚠️  Failed to load memory:`, error);
      return null;
    }
  }

  /**
   * Save task experience to memory
   */
  private async saveToMemory(task: TaskContext, result: TaskResult): Promise<void> {
    if (!this.lettaAgentId) return;

    try {
      // Archive the experience
      const experience = {
        task: task.description,
        approach: result.approach,
        outcome: result.success ? 'success' : 'failure',
        learnings: result.learnings || [],
        timestamp: new Date().toISOString()
      };

      await this.letta.archiveMemory(
        this.lettaAgentId,
        JSON.stringify(experience),
        {
          type: 'task_experience',
          agent_type: this.type,
          success: result.success,
          project_id: task.projectId
        }
      );

      console.log(`💾 Saved experience to memory for ${this.name}`);
    } catch (error) {
      console.error(`⚠️  Failed to save to memory:`, error);
    }
  }

  /**
   * Send message to Letta agent for conversational interaction
   */
  protected async askLetta(message: string): Promise<string> {
    if (!this.lettaAgentId) {
      throw new Error('Letta agent not initialized');
    }

    try {
      const response = await this.letta.sendMessage(this.lettaAgentId, message);
      
      // Extract text from response messages
      const assistantMessages = response.messages
        .filter(m => m.role === 'assistant')
        .map(m => m.content)
        .join('\n');

      return assistantMessages;
    } catch (error) {
      console.error(`❌ Failed to ask Letta:`, error);
      throw error;
    }
  }

  /**
   * Update agent's core memory
   */
  protected async updateCoreMemory(updates: { human?: string; persona?: string }): Promise<void> {
    if (!this.lettaAgentId) return;

    try {
      await this.letta.saveMemory(this.lettaAgentId, {
        core_memory: updates
      } as any);

      console.log(`✅ Updated core memory for ${this.name}`);
    } catch (error) {
      console.error(`⚠️  Failed to update core memory:`, error);
    }
  }

  /**
   * Get agent's memory summary
   */
  async getMemorySummary(): Promise<any> {
    if (!this.lettaAgentId) {
      return { status: 'no_letta_agent' };
    }

    try {
      const memory = await this.letta.loadMemory(this.lettaAgentId);
      const recentHistory = await this.letta.getConversationHistory(this.lettaAgentId, 5);

      return {
        status: 'active',
        letta_agent_id: this.lettaAgentId,
        core_memory: memory.core_memory,
        archival_count: memory.archival_memory?.length || 0,
        recent_interactions: recentHistory.length
      };
    } catch (error) {
      console.error(`⚠️  Failed to get memory summary:`, error);
      return { status: 'error', error: error.message };
    }
  }
}
