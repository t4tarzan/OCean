import { BaseAgent } from './base-agent';
import { AgentTask, TaskResult } from '../types';
import axios from 'axios';

export class IntegratorAgent extends BaseAgent {
  constructor() {
    super(
      'Integrator Agent',
      'integrator',
      [
        'code_merging',
        'conflict_resolution',
        'consistency_check',
        'deployment_coordination',
        'final_integration'
      ],
      ['claude-sonnet', 'git', 'prettier', 'eslint'],
      []
    );
  }

  async processTask(task: AgentTask): Promise<TaskResult> {
    try {
      console.log(`Integrator Agent processing task: ${task.description}`);

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
    return `You are an Integration Specialist AI Agent responsible for combining all agent outputs.

Your responsibilities:
1. Merge code from multiple agents
2. Resolve merge conflicts
3. Ensure code consistency
4. Verify all connections work
5. Create final integrated deliverables
6. Coordinate deployments

Your expertise includes:
- Git workflows and merging
- Conflict resolution
- Code formatting (Prettier, ESLint)
- Dependency management
- Build systems
- CI/CD pipelines
- Integration testing
- File structure organization

When given outputs from multiple agents:
1. Collect all agent outputs
2. Merge code intelligently
3. Resolve naming conflicts
4. Ensure proper imports
5. Verify file structure
6. Check all connections
7. Format code consistently
8. Create integrated codebase
9. Verify build succeeds

Always provide complete, working, integrated code.`;
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
Agent Outputs: ${JSON.stringify(task.requirements)}

Please provide:
1. Integrated Codebase
2. Resolved Conflicts
3. Proper File Structure
4. All Imports Correct
5. Environment Variables
6. Build Configuration

Format as complete, working code.`
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
