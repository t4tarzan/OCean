/**
 * Letta Client Library
 * ====================
 * 
 * TypeScript client for interacting with Letta (MemGPT) API server.
 * Provides memory-first AI agent capabilities for OCEAN agents.
 */

import axios, { AxiosInstance } from 'axios';

export interface LettaAgentConfig {
  name: string;
  preset?: string;
  human?: string;
  persona: string;
  model?: string;
  contextWindow?: number;
}

export interface LettaAgent {
  id: string;
  name: string;
  created_at: string;
  model: string;
  preset: string;
}

export interface LettaResponse {
  messages: Array<{
    role: string;
    content: string;
    created_at: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface LettaMemory {
  core_memory: {
    human: string;
    persona: string;
  };
  archival_memory: ArchivalMemory[];
  recall_memory: Message[];
}

export interface ArchivalMemory {
  id: string;
  content: string;
  metadata?: any;
  created_at: string;
}

export interface Message {
  id: string;
  role: string;
  content: string;
  created_at: string;
}

export class LettaClient {
  private client: AxiosInstance;
  private baseUrl: string;

  constructor(baseUrl: string = 'http://localhost:8283', apiKey?: string) {
    this.baseUrl = baseUrl;
    this.client = axios.create({
      baseURL: baseUrl,
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey && { 'Authorization': `Bearer ${apiKey}` })
      },
      timeout: 30000
    });
  }

  /**
   * Create a new Letta agent with memory capabilities
   */
  async createAgent(config: LettaAgentConfig): Promise<LettaAgent> {
    const response = await this.client.post('/agents', {
      name: config.name,
      preset: config.preset || 'ocean_agent',
      human: config.human || 'OCEAN Developer',
      persona: config.persona,
      model: config.model || 'claude-3-5-sonnet-20241022',
      context_window: config.contextWindow || 200000
    });

    return response.data;
  }

  /**
   * Send a message to a Letta agent
   */
  async sendMessage(
    agentId: string,
    message: string,
    role: string = 'user'
  ): Promise<LettaResponse> {
    const response = await this.client.post(`/agents/${agentId}/messages`, {
      message,
      role,
      stream: false
    });

    return response.data;
  }

  /**
   * Load agent's memory
   */
  async loadMemory(agentId: string, query?: string): Promise<LettaMemory> {
    const response = await this.client.get(`/agents/${agentId}/memory`, {
      params: { query }
    });

    return response.data;
  }

  /**
   * Update agent's core memory
   */
  async saveMemory(agentId: string, memory: Partial<LettaMemory>): Promise<void> {
    await this.client.put(`/agents/${agentId}/memory`, memory);
  }

  /**
   * Archive content to long-term memory
   */
  async archiveMemory(
    agentId: string,
    content: string,
    metadata?: any
  ): Promise<void> {
    await this.client.post(`/agents/${agentId}/archival`, {
      content,
      metadata
    });
  }

  /**
   * Search archival memory
   */
  async searchArchival(
    agentId: string,
    query: string,
    limit: number = 10
  ): Promise<ArchivalMemory[]> {
    const response = await this.client.get(`/agents/${agentId}/archival/search`, {
      params: { query, limit }
    });

    return response.data;
  }

  /**
   * Get conversation history
   */
  async getConversationHistory(
    agentId: string,
    limit: number = 50
  ): Promise<Message[]> {
    const response = await this.client.get(`/agents/${agentId}/messages`, {
      params: { limit }
    });

    return response.data;
  }

  /**
   * List all agents
   */
  async listAgents(): Promise<LettaAgent[]> {
    const response = await this.client.get('/agents');
    return response.data;
  }

  /**
   * Get agent details
   */
  async getAgent(agentId: string): Promise<LettaAgent> {
    const response = await this.client.get(`/agents/${agentId}`);
    return response.data;
  }

  /**
   * Delete an agent
   */
  async deleteAgent(agentId: string): Promise<void> {
    await this.client.delete(`/agents/${agentId}`);
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.client.get('/health');
      return response.status === 200;
    } catch {
      return false;
    }
  }
}

// Singleton instance
let lettaClientInstance: LettaClient | null = null;

/**
 * Get or create singleton Letta client
 */
export function getLettaClient(baseUrl?: string, apiKey?: string): LettaClient {
  if (!lettaClientInstance) {
    lettaClientInstance = new LettaClient(
      baseUrl || process.env.LETTA_URL || 'http://localhost:8283',
      apiKey || process.env.LETTA_API_KEY
    );
  }
  return lettaClientInstance;
}
