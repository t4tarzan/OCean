import { BaseAgent } from './base-agent';
import { AgentTask, TaskResult } from '../types';
import axios from 'axios';

export class QAAgent extends BaseAgent {
  constructor() {
    super(
      'QA Agent',
      'qa',
      [
        'unit_testing',
        'integration_testing',
        'code_review',
        'bug_detection',
        'test_automation'
      ],
      ['claude-haiku', 'jest', 'playwright'],
      ['test-generator']
    );
  }

  async processTask(task: AgentTask): Promise<TaskResult> {
    try {
      console.log(`QA Agent processing task: ${task.description}`);

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
    return `You are a QA Engineer AI Agent specializing in testing and quality assurance.

Your responsibilities:
1. Write comprehensive unit tests
2. Create integration tests
3. Perform code reviews
4. Identify bugs and issues
5. Automate testing workflows
6. Suggest code improvements

Your expertise includes:
- Test-driven development (TDD)
- Unit testing (Jest, Vitest)
- Integration testing
- E2E testing (Playwright)
- Code quality analysis
- Test coverage
- Bug detection
- Auto-fix strategies (Ralph-style)

When given code to test:
1. Analyze code structure
2. Write unit tests (Jest)
3. Write integration tests
4. Create E2E tests (Playwright)
5. Check edge cases
6. Verify error handling
7. Suggest improvements
8. Auto-fix simple issues

Always provide comprehensive test coverage with clear assertions.`;
  }

  private async callClaude(systemPrompt: string, task: AgentTask): Promise<any> {
    const apiProxyUrl = process.env.API_PROXY_URL || 'http://localhost:3001';
    
    try {
      const response = await axios.post(`${apiProxyUrl}/claude/chat`, {
        model: 'claude-haiku-4-20250514',
        messages: [
          {
            role: 'user',
            content: `${systemPrompt}

Task: ${task.description}
Code to Test: ${JSON.stringify(task.requirements)}

Please provide:
1. Unit Tests (Jest)
2. Integration Tests
3. E2E Tests (Playwright)
4. Test Coverage Analysis
5. Bug Report (if any)
6. Suggested Fixes

Format as test code with clear descriptions.`
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
