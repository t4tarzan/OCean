import { BaseAgent } from './base-agent';
import { AgentTask, TaskResult } from '../types';
import axios from 'axios';

export class FrontendAgent extends BaseAgent {
  constructor() {
    super(
      'Frontend Agent',
      'frontend',
      [
        'component_creation',
        'ui_implementation',
        'styling',
        'state_management',
        'responsive_design'
      ],
      ['claude-sonnet', 'nextjs', 'react', 'tailwindcss', 'shadcn-ui'],
      ['ui-generator']
    );
  }

  async processTask(task: AgentTask): Promise<TaskResult> {
    try {
      console.log(`Frontend Agent processing task: ${task.description}`);

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
    return `You are a Frontend Developer AI Agent specializing in React/Next.js development.

Your responsibilities:
1. Build React components
2. Implement user interfaces
3. Apply responsive styling (TailwindCSS)
4. Manage application state
5. Create accessible, performant UIs
6. Integrate with backend APIs

Your expertise includes:
- React 18 / Next.js 14
- TypeScript
- TailwindCSS
- shadcn/ui components
- State management (React hooks, Zustand)
- Form handling and validation
- Responsive design
- Web accessibility (a11y)
- Performance optimization

When given a UI requirement:
1. Design component structure
2. Create React components (TSX)
3. Apply TailwindCSS styling
4. Implement state management
5. Add form validation
6. Integrate with tRPC/API
7. Ensure responsive design
8. Add accessibility features

Always provide modern, type-safe React code using Next.js 14 App Router.`;
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
1. React Component Code (TSX)
2. TailwindCSS Styling
3. State Management
4. Form Validation
5. API Integration (tRPC)
6. Responsive Design

Use Next.js 14, TypeScript, TailwindCSS, shadcn/ui.
Format as TypeScript/TSX code.`
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
