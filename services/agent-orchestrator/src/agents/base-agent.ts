import { v4 as uuidv4 } from 'uuid';
import { Agent, AgentType, AgentStatus, AgentTask, AgentMessage, TaskResult } from '../types';
import db from '../utils/database';
import messageBus from '../messaging/redis-bus';

export abstract class BaseAgent {
  protected agent: Agent;
  private heartbeatInterval?: NodeJS.Timeout;

  constructor(
    name: string,
    type: AgentType,
    expertise: string[],
    tools: string[] = [],
    mcps: string[] = []
  ) {
    this.agent = {
      id: uuidv4(),
      name,
      type,
      status: 'initializing',
      expertise,
      tools,
      mcps,
      tasks_completed: 0,
      tasks_failed: 0,
      created_at: new Date(),
      updated_at: new Date(),
    };
  }

  // Abstract methods that each agent must implement
  abstract processTask(task: AgentTask): Promise<TaskResult>;
  abstract getSystemPrompt(): string;

  // Register agent in database
  async register(): Promise<void> {
    try {
      const result = await db.query(
        `INSERT INTO agents (id, name, type, status, expertise, tools, mcps)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (id) DO UPDATE 
         SET status = $4, last_active = NOW()
         RETURNING *`,
        [
          this.agent.id,
          this.agent.name,
          this.agent.type,
          'idle',
          this.agent.expertise,
          this.agent.tools,
          this.agent.mcps
        ]
      );

      this.agent = result.rows[0];
      console.log(`Agent ${this.agent.name} registered with ID: ${this.agent.id}`);

      // Subscribe to agent-specific messages
      await messageBus.subscribeToAgent(this.agent.id, this.handleMessage.bind(this));

      // Start heartbeat
      this.startHeartbeat();
    } catch (error) {
      console.error(`Failed to register agent ${this.agent.name}:`, error);
      throw error;
    }
  }

  // Update agent status
  async updateStatus(status: AgentStatus): Promise<void> {
    this.agent.status = status;
    await db.query(
      'UPDATE agents SET status = $1, updated_at = NOW() WHERE id = $2',
      [status, this.agent.id]
    );
  }

  // Send heartbeat
  private async sendHeartbeat(): Promise<void> {
    await db.query(
      'UPDATE agents SET last_heartbeat = NOW() WHERE id = $1',
      [this.agent.id]
    );
  }

  // Start heartbeat interval
  private startHeartbeat(): void {
    const interval = parseInt(process.env.AGENT_HEARTBEAT_INTERVAL || '30000');
    this.heartbeatInterval = setInterval(() => {
      this.sendHeartbeat().catch(console.error);
    }, interval);
  }

  // Stop heartbeat
  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
  }

  // Handle incoming messages
  private async handleMessage(message: AgentMessage): Promise<void> {
    console.log(`Agent ${this.agent.name} received message:`, message.message_type);

    switch (message.message_type) {
      case 'task_assignment':
        await this.handleTaskAssignment(message.payload);
        break;
      case 'request':
        await this.handleRequest(message);
        break;
      default:
        console.log(`Unhandled message type: ${message.message_type}`);
    }
  }

  // Handle task assignment
  private async handleTaskAssignment(taskData: any): Promise<void> {
    try {
      await this.updateStatus('busy');

      // Fetch full task details
      const taskResult = await db.query(
        'SELECT * FROM agent_tasks WHERE id = $1',
        [taskData.task_id]
      );

      if (taskResult.rows.length === 0) {
        throw new Error(`Task ${taskData.task_id} not found`);
      }

      const task: AgentTask = taskResult.rows[0];

      // Update task status
      await db.query(
        'UPDATE agent_tasks SET status = $1, started_at = NOW() WHERE id = $2',
        ['in_progress', task.id]
      );

      // Process the task
      const result = await this.processTask(task);

      // Update task with result
      if (result.success) {
        await db.query(
          `UPDATE agent_tasks 
           SET status = $1, result = $2, completed_at = NOW() 
           WHERE id = $3`,
          ['completed', JSON.stringify(result.data), task.id]
        );

        // Increment tasks completed
        await db.query(
          'UPDATE agents SET tasks_completed = tasks_completed + 1 WHERE id = $1',
          [this.agent.id]
        );
      } else {
        await db.query(
          `UPDATE agent_tasks 
           SET status = $1, error = $2, completed_at = NOW() 
           WHERE id = $3`,
          ['failed', result.error, task.id]
        );

        // Increment tasks failed
        await db.query(
          'UPDATE agents SET tasks_failed = tasks_failed + 1 WHERE id = $1',
          [this.agent.id]
        );
      }

      // Notify orchestrator
      if (task.orchestrator_id) {
        await messageBus.sendToAgent(task.orchestrator_id, {
          id: uuidv4(),
          from_agent_id: this.agent.id,
          to_agent_id: task.orchestrator_id,
          message_type: 'task_complete',
          payload: { task_id: task.id, result },
          priority: 5,
          read: false,
          created_at: new Date(),
        });
      }

      await this.updateStatus('idle');
    } catch (error) {
      console.error(`Error processing task:`, error);
      await this.updateStatus('error');
    }
  }

  // Handle generic requests
  private async handleRequest(message: AgentMessage): Promise<void> {
    // Override in subclasses for custom request handling
    console.log(`Request received but not handled:`, message);
  }

  // Send message to another agent
  async sendMessage(
    toAgentId: string,
    messageType: string,
    payload: any
  ): Promise<void> {
    const message: AgentMessage = {
      id: uuidv4(),
      from_agent_id: this.agent.id,
      to_agent_id: toAgentId,
      message_type: messageType as any,
      payload,
      priority: 5,
      read: false,
      created_at: new Date(),
    };

    // Store in database
    await db.query(
      `INSERT INTO agent_messages (id, from_agent_id, to_agent_id, message_type, payload, priority)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [message.id, message.from_agent_id, message.to_agent_id, message.message_type, JSON.stringify(message.payload), message.priority]
    );

    // Send via message bus
    await messageBus.sendToAgent(toAgentId, message);
  }

  // Shutdown agent
  async shutdown(): Promise<void> {
    this.stopHeartbeat();
    await this.updateStatus('offline');
    console.log(`Agent ${this.agent.name} shutdown`);
  }

  // Getters
  getId(): string {
    return this.agent.id;
  }

  getName(): string {
    return this.agent.name;
  }

  getType(): AgentType {
    return this.agent.type;
  }

  getStatus(): AgentStatus {
    return this.agent.status;
  }
}
