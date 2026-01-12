/**
 * Architect Agent
 * ===============
 * 
 * Senior Software Architect AI Agent with Letta memory integration.
 * Specializes in system design, architecture decisions, and technology selection.
 */

import { LettaEnhancedAgent, TaskContext, TaskResult } from './LettaEnhancedAgent';
import { AgentTask } from '../types';
import axios from 'axios';

export class ArchitectAgent extends LettaEnhancedAgent {
  constructor() {
    super({
      id: 'architect-001',
      type: 'architect',
      name: 'Architect Agent',
      model: 'claude-opus-4-20250514'
    });
    this.initializeLettaAgent();
  }

  /**
   * Get agent persona for Letta memory system
   */
  protected getPersona(): string {
    return `You are a Senior Software Architect AI Agent specializing in system design and architecture decisions.

Your expertise includes:
- Microservices architecture
- Database design (PostgreSQL, Neo4j, Redis, Qdrant)
- API design (REST, GraphQL, tRPC)
- System design patterns
- Cloud architecture
- Security architecture

You learn from every project, remembering successful patterns and avoiding past mistakes.`;
  }

  /**
   * Execute task with Letta memory context
   */
  protected async execute(task: TaskContext, context: any): Promise<TaskResult> {
    const systemPrompt = this.getSystemPrompt();
    const agentTask: AgentTask = {
      id: `arch-${Date.now()}`,
      task_type: 'system_design',
      description: task.description,
      requirements: task.requirements || context,
      assigned_agents: [this.id],
      status: 'in_progress',
      priority: 5,
      created_at: new Date()
    };

    const result = await this.callClaude(systemPrompt, agentTask);

    return {
      success: true,
      approach: 'architecture-analysis',
      output: result,
      learnings: ['Applied proven architecture patterns from memory']
    };
  }

  /**
   * Process task with memory-aware execution
   */
  async processTask(task: AgentTask): Promise<TaskResult> {
    try {
      console.log(`Architect Agent processing task: ${task.description}`);

      // Use executeWithMemory for context-aware execution
      return await this.executeWithMemory(
        {
          description: task.description,
          requirements: task.requirements
        },
        { task }
      );
    } catch (error: any) {
      return {
        success: false,
        approach: 'error',
        output: null,
        learnings: [`Error: ${error.message}`]
      };
    }
  }

  /**
   * Get system prompt for architecture tasks
   */
  getSystemPrompt(): string {
    return `You are a Senior Software Architect AI Agent specializing in system design and architecture decisions.

Your responsibilities:
1. Design system architecture (components, layers, services)
2. Select appropriate technology stacks
3. Create database schema outlines
4. Design API structures and endpoints
5. Make and document architecture decisions
6. Consider scalability, maintainability, and best practices

Your expertise includes:
- Microservices architecture
- Database design (PostgreSQL, Neo4j, Redis, Qdrant)
- API design (REST, GraphQL, tRPC)
- System design patterns
- Cloud architecture
- Security architecture

When given a feature or project:
1. Analyze requirements thoroughly
2. Design a scalable architecture
3. Select appropriate technologies
4. Create high-level component diagrams
5. Define data models and relationships
6. Design API contracts
7. Document all decisions with reasoning

Always provide structured, actionable output in JSON format.`;
  }

  /**
   * Call Claude API through OCEAN proxy
   */
  private async callClaude(systemPrompt: string, task: AgentTask): Promise<any> {
    const apiProxyUrl = process.env.API_PROXY_URL || 'http://localhost:3001';
    
    try {
      const response = await axios.post(`${apiProxyUrl}/claude/chat`, {
        model: 'claude-opus-4-20250514',
        messages: [
          {
            role: 'user',
            content: `${systemPrompt}

Task: ${task.description}
Requirements: ${JSON.stringify(task.requirements)}

Please provide:
1. System Architecture Design
2. Technology Stack Recommendations
3. Database Schema Outline
4. API Design
5. Key Architecture Decisions

Format your response as JSON with these sections.`
          }
        ],
        max_tokens: 4096
      });

      return response.data;
    } catch (error: any) {
      console.error('Error calling Claude API:', error.message);
      throw error;
    }
  }

  /**
   * Design system architecture for a feature
   */
  async designSystem(featureDescription: string, context: any): Promise<any> {
    const task: AgentTask = {
      id: `arch-${Date.now()}`,
      task_type: 'system_design',
      description: featureDescription,
      requirements: context,
      assigned_agents: [this.id],
      status: 'in_progress',
      priority: 5,
      created_at: new Date()
    };

    return await this.processTask(task);
  }

  /**
   * Analyze requirements with memory context
   */
  private async analyzeRequirements(feature: any, memory: any): Promise<any> {
    return {
      complexity: this.assessComplexity(feature),
      suggestedPatterns: memory?.patterns || [],
      technicalConstraints: feature.constraints || [],
      scalabilityNeeds: this.assessScalability(feature)
    };
  }

  /**
   * Assess feature complexity
   */
  private assessComplexity(feature: any): string {
    const description = feature.description || feature.toString();
    if (description.length > 500) return 'high';
    if (description.length > 200) return 'medium';
    return 'low';
  }

  /**
   * Assess scalability needs
   */
  private assessScalability(feature: any): string {
    const keywords = ['user', 'scale', 'concurrent', 'load', 'performance'];
    const description = (feature.description || feature.toString()).toLowerCase();
    const matches = keywords.filter(k => description.includes(k)).length;
    if (matches >= 3) return 'high';
    if (matches >= 1) return 'medium';
    return 'low';
  }

  /**
   * Store design decisions in Letta memory
   */
  async notifyAgents(design: any, feature: any): Promise<void> {
    if (this.lettaAgentId) {
      await this.askLetta(`I've completed a system design with the following components:
- Database: ${JSON.stringify(design.database)}
- API: ${JSON.stringify(design.api)}
- Frontend: ${JSON.stringify(design.frontend)}

Please remember this design pattern for future reference.`);
    }

    console.log('✅ Design decisions stored in memory and ready for other agents');
  }
}
