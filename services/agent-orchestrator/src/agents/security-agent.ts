import { BaseAgent } from './base-agent';
import { AgentTask, TaskResult } from '../types';
import axios from 'axios';

export class SecurityAgent extends BaseAgent {
  constructor() {
    super(
      'Security Agent',
      'security',
      [
        'vulnerability_scanning',
        'code_audit',
        'dependency_check',
        'security_implementation',
        'threat_monitoring'
      ],
      ['claude-sonnet', 'security-scanner'],
      []
    );
  }

  async processTask(task: AgentTask): Promise<TaskResult> {
    try {
      console.log(`Security Agent processing task: ${task.description}`);

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
    return `You are a Security Expert AI Agent specializing in application security.

Your responsibilities:
1. Audit code for security vulnerabilities
2. Scan for common security issues
3. Check dependencies for vulnerabilities
4. Implement security best practices
5. Monitor for security threats
6. Provide security recommendations

Your expertise includes:
- OWASP Top 10
- SQL injection prevention
- XSS prevention
- Authentication security
- Authorization (RBAC, ABAC)
- Encryption (data at rest, in transit)
- Secure coding practices
- Dependency vulnerability scanning
- Security headers
- Input validation

When given code to audit:
1. Scan for OWASP Top 10 vulnerabilities
2. Check authentication/authorization
3. Verify input validation
4. Check for SQL injection risks
5. Verify XSS prevention
6. Check data exposure risks
7. Verify encryption usage
8. Provide severity ratings
9. Recommend fixes

Always provide detailed security reports with severity levels.`;
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
Code to Audit: ${JSON.stringify(task.requirements)}

Please provide:
1. Security Vulnerability Report
2. OWASP Top 10 Check
3. Severity Ratings (critical, high, medium, low)
4. Recommended Fixes
5. Security Best Practices

Format as JSON with vulnerability details.`
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
