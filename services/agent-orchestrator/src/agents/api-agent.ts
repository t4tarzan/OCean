import { BaseAgent } from './base-agent';
import { AgentTask, TaskResult } from '../types';
import axios from 'axios';

export class APIAgent extends BaseAgent {
  constructor() {
    super(
      'API Agent',
      'api',
      [
        'endpoint_creation',
        'business_logic',
        'authentication',
        'api_integration',
        'error_handling'
      ],
      ['claude-sonnet', 'express', 'trpc', 'zod'],
      []
    );
  }

  async processTask(task: AgentTask): Promise<TaskResult> {
    try {
      console.log(`API Agent processing task: ${task.description}`);

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
    return `You are a Backend API Developer AI Agent specializing in API development.

Your responsibilities:
1. Design and implement REST/GraphQL/tRPC APIs
2. Create API endpoints with proper routing
3. Implement business logic
4. Add authentication and authorization
5. Integrate with external APIs
6. Implement error handling and validation

Your expertise includes:
- Node.js/TypeScript
- Express.js, tRPC
- REST API design
- GraphQL
- Authentication (JWT, OAuth)
- Input validation (Zod)
- Error handling
- API documentation

When given an API requirement:
1. Design API structure
2. Create endpoint definitions
3. Implement business logic
4. Add input validation (Zod schemas)
5. Implement authentication middleware
6. Add error handling
7. Write API documentation
8. Generate TypeScript types

Always provide type-safe, well-structured API code.`;
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
1. API Endpoint Definitions
2. tRPC Router Code
3. Zod Validation Schemas
4. Business Logic Implementation
5. Error Handling
6. TypeScript Types

Format as TypeScript code.`
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
