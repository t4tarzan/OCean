import { 
  ArchitectAgent, 
  DatabaseAgent, 
  APIAgent, 
  FrontendAgent, 
  QAAgent, 
  SecurityAgent, 
  IntegratorAgent 
} from '../agents';
import { Agent, AgentTask, AgentType } from '../types';
import db from '../utils/database';
import messageBus from '../messaging/redis-bus';

interface ExecutionStep {
  name: string;
  agentType: AgentType;
  parallel: boolean;
  dependencies: AgentType[];
}

interface ExecutionPlan {
  steps: ExecutionStep[];
  estimatedDuration: number;
}

interface BuildResult {
  success: boolean;
  results: any[];
  learnings: string[];
  errors?: string[];
}

export class AgentOrchestrator {
  private agents: Map<AgentType, any>;
  private orchestratorId: string;

  constructor() {
    this.agents = new Map();
    this.orchestratorId = 'orchestrator-main';
    this.initializeAgents();
  }

  private async initializeAgents() {
    // Initialize all 7 specialized agents
    const architectAgent = new ArchitectAgent();
    const databaseAgent = new DatabaseAgent();
    const apiAgent = new APIAgent();
    const frontendAgent = new FrontendAgent();
    const qaAgent = new QAAgent();
    const securityAgent = new SecurityAgent();
    const integratorAgent = new IntegratorAgent();

    // Register all agents
    await Promise.all([
      architectAgent.register(),
      databaseAgent.register(),
      apiAgent.register(),
      frontendAgent.register(),
      qaAgent.register(),
      securityAgent.register(),
      integratorAgent.register()
    ]);

    // Store in map
    this.agents.set('architect', architectAgent);
    this.agents.set('database', databaseAgent);
    this.agents.set('api', apiAgent);
    this.agents.set('frontend', frontendAgent);
    this.agents.set('qa', qaAgent);
    this.agents.set('security', securityAgent);
    this.agents.set('integrator', integratorAgent);

    console.log('✅ All 7 agents initialized and registered');
  }

  async buildFeature(featureDescription: string, requirements: any): Promise<BuildResult> {
    console.log(`🚀 Orchestrator starting feature build: ${featureDescription}`);

    try {
      // 1. Create execution plan
      const plan = await this.createExecutionPlan(featureDescription, requirements);
      console.log(`📋 Execution plan created with ${plan.steps.length} steps`);

      // 2. Execute plan
      const results = await this.executePlan(plan, featureDescription, requirements);

      // 3. Extract learnings
      const learnings = this.extractLearnings(results);

      return {
        success: results.every(r => r.success),
        results,
        learnings
      };
    } catch (error: any) {
      console.error('❌ Orchestrator error:', error.message);
      return {
        success: false,
        results: [],
        learnings: [],
        errors: [error.message]
      };
    }
  }

  private async createExecutionPlan(
    featureDescription: string,
    requirements: any
  ): Promise<ExecutionPlan> {
    // Standard execution plan for feature development
    const plan: ExecutionPlan = {
      steps: [
        {
          name: 'Architecture Design',
          agentType: 'architect',
          parallel: false,
          dependencies: []
        },
        {
          name: 'Database Schema',
          agentType: 'database',
          parallel: false,
          dependencies: ['architect']
        },
        {
          name: 'API Development',
          agentType: 'api',
          parallel: false,
          dependencies: ['database']
        },
        {
          name: 'Frontend Development',
          agentType: 'frontend',
          parallel: false,
          dependencies: ['api']
        },
        {
          name: 'Quality Assurance',
          agentType: 'qa',
          parallel: true,
          dependencies: ['frontend']
        },
        {
          name: 'Security Audit',
          agentType: 'security',
          parallel: true,
          dependencies: ['api', 'frontend']
        },
        {
          name: 'Integration',
          agentType: 'integrator',
          parallel: false,
          dependencies: ['qa', 'security']
        }
      ],
      estimatedDuration: 300 // seconds
    };

    return plan;
  }

  private async executePlan(
    plan: ExecutionPlan,
    featureDescription: string,
    requirements: any
  ): Promise<any[]> {
    const results: any[] = [];
    const completedSteps = new Set<AgentType>();

    for (const step of plan.steps) {
      console.log(`\n🔄 Executing step: ${step.name} (${step.agentType})`);

      // Check dependencies
      const dependenciesMet = step.dependencies.every(dep => completedSteps.has(dep));
      if (!dependenciesMet) {
        console.log(`⏸️  Waiting for dependencies: ${step.dependencies.join(', ')}`);
        // In a real implementation, we'd wait or handle this better
        continue;
      }

      // Get agent
      const agent = this.agents.get(step.agentType);
      if (!agent) {
        console.error(`❌ Agent not found: ${step.agentType}`);
        continue;
      }

      // Create task
      const task: AgentTask = {
        id: `task-${Date.now()}-${step.agentType}`,
        task_type: step.name.toLowerCase().replace(/\s+/g, '_'),
        description: `${step.name}: ${featureDescription}`,
        requirements: {
          ...requirements,
          previousResults: results
        },
        assigned_agents: [agent.getId()],
        orchestrator_id: this.orchestratorId,
        status: 'in_progress',
        priority: 5,
        created_at: new Date()
      };

      // Store task in database
      await db.query(
        `INSERT INTO agent_tasks (id, task_type, description, requirements, assigned_agents, orchestrator_id, status, priority)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          task.id,
          task.task_type,
          task.description,
          JSON.stringify(task.requirements),
          task.assigned_agents,
          task.orchestrator_id,
          task.status,
          task.priority
        ]
      );

      // Execute task
      try {
        const result = await agent.processTask(task);
        results.push({
          step: step.name,
          agentType: step.agentType,
          success: result.success,
          data: result.data,
          error: result.error
        });

        if (result.success) {
          completedSteps.add(step.agentType);
          console.log(`✅ ${step.name} completed successfully`);
        } else {
          console.error(`❌ ${step.name} failed: ${result.error}`);
        }

        // Update task status in database
        await db.query(
          `UPDATE agent_tasks SET status = $1, result = $2, completed_at = NOW() WHERE id = $3`,
          [result.success ? 'completed' : 'failed', JSON.stringify(result), task.id]
        );
      } catch (error: any) {
        console.error(`❌ Error executing ${step.name}:`, error.message);
        results.push({
          step: step.name,
          agentType: step.agentType,
          success: false,
          error: error.message
        });
      }
    }

    return results;
  }

  private extractLearnings(results: any[]): string[] {
    const learnings: string[] = [];

    // Analyze results for patterns and learnings
    const successfulSteps = results.filter(r => r.success).length;
    const totalSteps = results.length;

    learnings.push(`Completed ${successfulSteps}/${totalSteps} steps successfully`);

    // Extract specific learnings from each agent
    results.forEach(result => {
      if (result.success && result.data) {
        learnings.push(`${result.step}: ${result.agentType} agent completed task`);
      }
    });

    return learnings;
  }

  async getAgentStatus(): Promise<any[]> {
    const result = await db.query('SELECT * FROM agents ORDER BY type');
    return result.rows;
  }

  async getActiveTasks(): Promise<any[]> {
    const result = await db.query(
      `SELECT * FROM agent_tasks WHERE status IN ('pending', 'in_progress') ORDER BY created_at DESC`
    );
    return result.rows;
  }

  async getRecentTasks(limit: number = 10): Promise<any[]> {
    const result = await db.query(
      `SELECT * FROM agent_tasks ORDER BY created_at DESC LIMIT $1`,
      [limit]
    );
    return result.rows;
  }

  async shutdown() {
    console.log('🛑 Shutting down orchestrator and all agents');
    for (const [type, agent] of this.agents.entries()) {
      await agent.shutdown();
      console.log(`  ✅ ${type} agent shutdown`);
    }
  }
}

// Singleton instance
let orchestratorInstance: AgentOrchestrator | null = null;

export async function getOrchestrator(): Promise<AgentOrchestrator> {
  if (!orchestratorInstance) {
    orchestratorInstance = new AgentOrchestrator();
  }
  return orchestratorInstance;
}
