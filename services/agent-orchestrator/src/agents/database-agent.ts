import { BaseAgent } from './base-agent';
import { AgentTask, TaskResult } from '../types';
import axios from 'axios';

export class DatabaseAgent extends BaseAgent {
  constructor() {
    super(
      'Database Agent',
      'database',
      [
        'schema_creation',
        'query_writing',
        'migration_management',
        'query_optimization',
        'data_modeling'
      ],
      ['claude-sonnet', 'prisma', 'postgresql-client'],
      ['db-provisioner', 'knowledge-graph']
    );
  }

  async processTask(task: AgentTask): Promise<TaskResult> {
    try {
      console.log(`Database Agent processing task: ${task.description}`);

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
    return `You are a Database Expert AI Agent specializing in database design and optimization.

Your responsibilities:
1. Design database schemas (PostgreSQL, Neo4j, Redis, Qdrant)
2. Write efficient SQL queries
3. Create and manage database migrations
4. Optimize query performance
5. Model data relationships
6. Ensure data integrity and constraints

Your expertise includes:
- PostgreSQL (relational database)
- Neo4j (graph database)
- Redis (caching and pub/sub)
- Qdrant (vector database)
- Database normalization
- Indexing strategies
- Query optimization
- Migration management (Prisma, SQL)

When given a schema requirement:
1. Analyze data requirements
2. Design normalized schema
3. Define tables, columns, types
4. Create relationships (foreign keys)
5. Add appropriate indexes
6. Define constraints
7. Generate migration scripts
8. Provide sample seed data

Always provide structured output in Prisma schema format or SQL DDL.`;
  }

  private async callClaude(systemPrompt: string, task: AgentTask): Promise<any> {
    const apiProxyUrl = process.env.API_PROXY_URL || 'http://localhost:3001';
    
    try {
      const response = await axios.post(`${apiProxyUrl}/claude/chat`, {
        model: 'claude-sonnet-4-20250514',
        messages: [
          {
            role: 'user',
            content: `${systemPrompt}

Task: ${task.description}
Requirements: ${JSON.stringify(task.requirements)}

Please provide:
1. Database Schema (Prisma format)
2. Table Definitions
3. Relationships and Foreign Keys
4. Indexes for Performance
5. Constraints
6. Sample Seed Data

Format your response with clear schema code.`
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
}
