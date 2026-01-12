export type AgentType = 
  | 'architect'
  | 'database'
  | 'api'
  | 'frontend'
  | 'qa'
  | 'security'
  | 'integrator'
  | 'orchestrator';

export type AgentStatus = 
  | 'idle'
  | 'busy'
  | 'offline'
  | 'error'
  | 'initializing';

export type TaskStatus = 
  | 'pending'
  | 'assigned'
  | 'in_progress'
  | 'completed'
  | 'failed'
  | 'cancelled';

export type MessageType =
  | 'task_assignment'
  | 'task_update'
  | 'task_complete'
  | 'request'
  | 'response'
  | 'notification'
  | 'error';

export interface Agent {
  id: string;
  name: string;
  type: AgentType;
  description?: string;
  status: AgentStatus;
  expertise: string[];
  tools: string[];
  mcps: string[];
  config?: Record<string, any>;
  last_heartbeat?: Date;
  last_active?: Date;
  tasks_completed: number;
  tasks_failed: number;
  success_rate?: number;
  avg_response_time?: number;
  created_at: Date;
  updated_at?: Date;
}

export interface AgentTask {
  id: string;
  task_type: string;
  description: string;
  requirements?: Record<string, any>;
  assigned_agents: string[];
  orchestrator_id?: string;
  status: TaskStatus;
  priority: number;
  result?: Record<string, any>;
  error?: string;
  started_at?: Date;
  completed_at?: Date;
  created_at: Date;
}

export interface AgentMessage {
  id: string;
  from_agent_id: string;
  to_agent_id: string;
  message_type: MessageType;
  payload: Record<string, any>;
  priority: number;
  read: boolean;
  created_at: Date;
}

export interface TaskRequest {
  type: string;
  description: string;
  requirements?: Record<string, any>;
  priority?: number;
}

export interface TaskResult {
  success: boolean;
  data?: any;
  error?: string;
  metadata?: Record<string, any>;
}
