import { BaseAgent } from './base-agent';
import { LettaEnhancedAgent, TaskContext, TaskResult } from './LettaEnhancedAgent';
import { AgentTask } from '../types';
import axios from 'axios';

export class ArchitectAgent extends BaseAgent {
  constructor() {
    super(
      'Architect Agent',
      'architect',
      [
        'system_design',
        'technology_selection',
        'schema_design',
        'api_design',
        'decision_making'
      ],
      ['claude-opus', 'database-schema-designer', 'architecture-diagram-generator'],
      ['decision-logger', 'knowledge-graph']
    );
  }

  async processTask(task: AgentTask): Promise<TaskResult> {
    try {
      console.log(`Architect Agent processing task: ${task.description}`);

      const systemPrompt = this.getSystemPrompt();
      const result = await this.callClaude(systemPrompt, task);

      return {
        success: true,
        data: result,
        metadata: {
          agent: this.getName(),
          taskType: task.task_type,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }

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

  async designSystem(featureDescription: string, context: any): Promise<any> {
    const task: AgentTask = {
      id: `arch-${Date.now()}`,
      task_type: 'system_design',
      description: featureDescription,
      requirements: context,
      assigned_agents: [this.getId()],
      status: 'in_progress',
      priority: 5,
      created_at: new Date()
    };

    return await this.processTask(task);
  }

  private async analyzeRequirements(feature: any, memory: any): Promise<any> {
    // Analyze feature requirements considering team's previous patterns
    return {
      complexity: this.assessComplexity(feature),
      suggestedPatterns: memory?.patterns || [],
      technicalConstraints: feature.constraints || [],
      scalabilityNeeds: this.assessScalability(feature)
    };
  }

  private assessComplexity(feature: any): string {
    const description = feature.description || feature.toString();
    if (description.length > 500) return 'high';
    if (description.length > 200) return 'medium';
    return 'low';
  }

  private assessScalability(feature: any): string {
    // Simple heuristic for scalability assessment
    const keywords = ['user', 'scale', 'concurrent', 'load', 'performance'];
    const description = (feature.description || feature.toString()).toLowerCase();
    const matches = keywords.filter(k => description.includes(k)).length;
    if (matches >= 3) return 'high';
    if (matches >= 1) return 'medium';
    return 'low';
  }

  async notifyAgents(design: any, feature: any): Promise<void> {
    // Notify Database Agent about schema needs
    if (design.database) {
      await this.sendMessage('database-agent', 'request', {
        subject: 'Database schema needed',
        body: 'System design complete. Please create database schema.',
        design: design.database,
        entities: design.entities
      });
    }

    // Notify API Agent about endpoint needs
    if (design.api) {
      await this.sendMessage('api-agent', 'request', {
        subject: 'API endpoints needed',
        body: 'Architecture ready. Please implement API endpoints.',
        endpoints: design.api.endpoints,
        authentication: design.api.authentication
      });
    }

    // Notify Frontend Agent about UI needs
    if (design.frontend) {
      await this.sendMessage('frontend-agent', 'request', {
        subject: 'UI implementation needed',
        body: 'Design complete. Please build frontend.',
        pages: design.frontend.pages,
        components: design.frontend.components
      });
    }
  }

}
