# 🌊 OCEAN Phase 2: Core Agent System

**Duration:** 5 weeks  
**Status:** 🔄 In Progress (Week 1)  
**Dependencies:** Phase 1 (Foundation & Infrastructure) ✅ Complete

---

## Overview

Phase 2 builds the multi-agent orchestration system that powers OCEAN's autonomous development capabilities. This includes OASF-style agent registration, inter-agent messaging, and specialized AI agents working together.

**Goal:** Create a robust multi-agent system where specialized AI agents collaborate to build software faster than any single agent could alone.

---

## Objectives

1. 🔄 Implement OASF-style agent registry
2. 🔄 Build inter-agent messaging framework
3. ⏳ Create 7 specialized AI agents
4. ⏳ Develop orchestration layer
5. ⏳ Build agent dashboard UI
6. ⏳ Implement real-time monitoring

---

## Week 1: Agent Registry & Messaging Bus

### 1.1 OASF-Style Agent Registry

**Tasks:**
- [x] Create agent registration system
- [x] Implement agent capability discovery
- [x] Build agent health monitoring
- [x] Create agent lifecycle management

**File Structure:**
```
services/
├── agent-registry/
│   ├── src/
│   │   ├── index.ts                    # Main server
│   │   ├── registry/
│   │   │   ├── AgentRegistry.ts        # Core registry
│   │   │   ├── CapabilityManager.ts    # Manage capabilities
│   │   │   └── HealthMonitor.ts        # Health checks
│   │   ├── api/
│   │   │   ├── register.ts             # Register agent
│   │   │   ├── discover.ts             # Discover agents
│   │   │   └── health.ts               # Health endpoints
│   │   └── models/
│   │       ├── Agent.ts                # Agent model
│   │       └── Capability.ts           # Capability model
│   ├── package.json
│   └── tsconfig.json
```

**Deliverables:**

**Agent Registry Core:**
```typescript
// services/agent-registry/src/registry/AgentRegistry.ts
import { Pool } from 'pg';
import { EventEmitter } from 'events';

export class AgentRegistry extends EventEmitter {
  private db: Pool;
  private agents: Map<string, Agent> = new Map();

  constructor(db: Pool) {
    super();
    this.db = db;
    this.loadAgentsFromDB();
  }

  async registerAgent(agent: AgentRegistration): Promise<Agent> {
    // Validate agent
    this.validateAgent(agent);

    // Store in database
    const result = await this.db.query(`
      INSERT INTO agents (name, type, model, expertise, tools, mcps, config, letta_agent_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [
      agent.name,
      agent.type,
      agent.model,
      agent.expertise,
      agent.tools,
      agent.mcps,
      agent.config,
      agent.lettaAgentId
    ]);

    const registeredAgent = result.rows[0];

    // Store in memory
    this.agents.set(registeredAgent.id, registeredAgent);

    // Register capabilities
    for (const capability of agent.capabilities) {
      await this.registerCapability(registeredAgent.id, capability);
    }

    // Emit event
    this.emit('agent:registered', registeredAgent);

    return registeredAgent;
  }

  async discoverAgents(query: AgentQuery): Promise<Agent[]> {
    const { type, expertise, tools, status } = query;

    let sql = 'SELECT * FROM agents WHERE 1=1';
    const params: any[] = [];
    let paramCount = 1;

    if (type) {
      sql += ` AND type = $${paramCount++}`;
      params.push(type);
    }

    if (expertise) {
      sql += ` AND expertise @> $${paramCount++}`;
      params.push(expertise);
    }

    if (tools) {
      sql += ` AND tools @> $${paramCount++}`;
      params.push(tools);
    }

    if (status) {
      sql += ` AND status = $${paramCount++}`;
      params.push(status);
    }

    const result = await this.db.query(sql, params);
    return result.rows;
  }

  async updateAgentStatus(agentId: string, status: AgentStatus): Promise<void> {
    await this.db.query(`
      UPDATE agents
      SET status = $1, last_active = NOW()
      WHERE id = $2
    `, [status, agentId]);

    const agent = this.agents.get(agentId);
    if (agent) {
      agent.status = status;
      this.emit('agent:status_changed', { agentId, status });
    }
  }

  async getAgentHealth(agentId: string): Promise<AgentHealth> {
    const agent = this.agents.get(agentId);
    if (!agent) throw new Error('Agent not found');

    return {
      agentId,
      status: agent.status,
      lastActive: agent.last_active,
      tasksCompleted: agent.tasks_completed,
      successRate: agent.success_rate,
      avgResponseTime: agent.avg_response_time
    };
  }

  private async loadAgentsFromDB(): Promise<void> {
    const result = await this.db.query('SELECT * FROM agents');
    for (const agent of result.rows) {
      this.agents.set(agent.id, agent);
    }
  }

  private validateAgent(agent: AgentRegistration): void {
    if (!agent.name) throw new Error('Agent name required');
    if (!agent.type) throw new Error('Agent type required');
    if (!agent.model) throw new Error('Agent model required');
  }
}
```

**Agent Registration API:**
```typescript
// services/agent-registry/src/api/register.ts
import express from 'express';
import { AgentRegistry } from '../registry/AgentRegistry';

const router = express.Router();

router.post('/register', async (req, res) => {
  try {
    const agent = await registry.registerAgent(req.body);
    res.json({ success: true, agent });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/discover', async (req, res) => {
  try {
    const agents = await registry.discoverAgents(req.query);
    res.json({ agents });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:agentId/status', async (req, res) => {
  try {
    await registry.updateAgentStatus(req.params.agentId, req.body.status);
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/:agentId/health', async (req, res) => {
  try {
    const health = await registry.getAgentHealth(req.params.agentId);
    res.json(health);
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
});

export default router;
```

**Acceptance Criteria:**
- Agents can register with capabilities
- Agent discovery working
- Health monitoring functional
- Status updates in real-time

---

### 1.2 Inter-Agent Messaging Framework

**Tasks:**
- [x] Implement message bus (Redis Pub/Sub)
- [x] Create message routing
- [x] Add message persistence (PostgreSQL)
- [x] Implement message acknowledgment
- [x] Build conversation tracking

**Deliverables:**

**Message Bus:**
```typescript
// services/messaging/src/MessageBus.ts
import Redis from 'ioredis';
import { Pool } from 'pg';
import { EventEmitter } from 'events';

export class MessageBus extends EventEmitter {
  private redis: Redis;
  private db: Pool;
  private subscriptions: Map<string, Function[]> = new Map();

  constructor(redis: Redis, db: Pool) {
    super();
    this.redis = redis;
    this.db = db;
  }

  async sendMessage(message: AgentMessage): Promise<void> {
    // 1. Validate message
    this.validateMessage(message);

    // 2. Store in PostgreSQL for persistence
    const result = await this.db.query(`
      INSERT INTO agent_messages (
        from_agent_id, to_agent_id, message_type,
        subject, body, attachments, project_id, feature_id, priority
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `, [
      message.fromAgentId,
      message.toAgentId,
      message.messageType,
      message.subject,
      message.body,
      JSON.stringify(message.attachments),
      message.projectId,
      message.featureId,
      message.priority || 5
    ]);

    const savedMessage = result.rows[0];

    // 3. Publish to Redis for real-time delivery
    await this.redis.publish(
      `agent:${message.toAgentId}`,
      JSON.stringify(savedMessage)
    );

    // 4. Update conversation
    await this.updateConversation(savedMessage);

    // 5. Emit event
    this.emit('message:sent', savedMessage);
  }

  async subscribe(agentId: string, handler: (message: AgentMessage) => Promise<void>): Promise<void> {
    const channel = `agent:${agentId}`;

    // Store handler
    if (!this.subscriptions.has(channel)) {
      this.subscriptions.set(channel, []);
    }
    this.subscriptions.get(channel)!.push(handler);

    // Subscribe to Redis channel
    const subscriber = this.redis.duplicate();
    await subscriber.subscribe(channel);

    subscriber.on('message', async (ch, messageStr) => {
      if (ch !== channel) return;

      const message = JSON.parse(messageStr);

      // Mark as delivered
      await this.db.query(`
        UPDATE agent_messages
        SET status = 'delivered', delivered_at = NOW()
        WHERE id = $1
      `, [message.id]);

      // Call all handlers
      const handlers = this.subscriptions.get(channel) || [];
      for (const h of handlers) {
        try {
          await h(message);

          // Mark as processed
          await this.db.query(`
            UPDATE agent_messages
            SET status = 'processed', processed_at = NOW()
            WHERE id = $1
          `, [message.id]);
        } catch (error) {
          console.error('Handler error:', error);
        }
      }
    });
  }

  async broadcast(message: BroadcastMessage): Promise<void> {
    // Get all active agents
    const agents = await this.db.query(`
      SELECT id FROM agents WHERE status = 'active'
    `);

    // Send to each agent
    for (const agent of agents.rows) {
      await this.sendMessage({
        ...message,
        toAgentId: agent.id
      });
    }
  }

  async getConversation(conversationId: string): Promise<AgentMessage[]> {
    const result = await this.db.query(`
      SELECT * FROM agent_messages
      WHERE project_id = (
        SELECT project_id FROM agent_conversations WHERE id = $1
      )
      ORDER BY sent_at ASC
    `, [conversationId]);

    return result.rows;
  }

  private async updateConversation(message: AgentMessage): Promise<void> {
    // Find or create conversation
    const conversation = await this.db.query(`
      INSERT INTO agent_conversations (project_id, participants, topic)
      VALUES ($1, $2, $3)
      ON CONFLICT (project_id) DO UPDATE
      SET message_count = agent_conversations.message_count + 1,
          participants = array_append(agent_conversations.participants, $4)
      RETURNING *
    `, [
      message.project_id,
      [message.from_agent_id, message.to_agent_id],
      message.subject,
      message.to_agent_id
    ]);
  }

  private validateMessage(message: AgentMessage): void {
    if (!message.fromAgentId) throw new Error('fromAgentId required');
    if (!message.toAgentId) throw new Error('toAgentId required');
    if (!message.messageType) throw new Error('messageType required');
  }
}
```

**Message Types:**
```typescript
// types/messages.ts
export interface AgentMessage {
  id?: string;
  fromAgentId: string;
  toAgentId: string;
  messageType: 'request' | 'response' | 'notification' | 'error';
  subject: string;
  body: string;
  attachments?: any;
  projectId?: string;
  featureId?: string;
  priority?: number;
  status?: 'sent' | 'delivered' | 'read' | 'processed';
  sentAt?: Date;
  deliveredAt?: Date;
  processedAt?: Date;
}

export interface BroadcastMessage extends Omit<AgentMessage, 'toAgentId'> {
  // Broadcast to all agents
}

export interface ConversationSummary {
  id: string;
  projectId: string;
  participants: string[];
  topic: string;
  messageCount: number;
  startedAt: Date;
  lastMessageAt: Date;
}
```

**Acceptance Criteria:**
- Messages delivered in real-time
- Messages persisted in database
- Conversations tracked
- Broadcast working
- Acknowledgments functioning

---

## Week 2-3: Implement 7 Specialized Agents

### 2.1 Architect Agent (Claude Opus)

**Tasks:**
- [x] Create Architect agent
- [x] Implement system design capabilities
- [x] Add tech stack selection logic
- [x] Register agent in database with OASF-style discovery

**Deliverables:**

```typescript
// services/agents/src/ArchitectAgent.ts
import { ClaudeClient } from './claude/ClaudeClient';
import { LettaClient } from './letta/LettaClient';
import { MessageBus } from '../messaging/MessageBus';

export class ArchitectAgent {
  private id: string;
  private claude: ClaudeClient;
  private letta: LettaClient;
  private messageBus: MessageBus;

  constructor(config: AgentConfig) {
    this.id = config.id;
    this.claude = new ClaudeClient('claude-opus-4-20250514');
    this.letta = new LettaClient();
    this.messageBus = config.messageBus;

    // Subscribe to messages
    this.messageBus.subscribe(this.id, this.handleMessage.bind(this));
  }

  async designSystem(feature: Feature, context: any): Promise<SystemDesign> {
    // 1. Load memory from Letta
    const memory = await this.letta.loadMemory(this.id, {
      projectId: feature.project_id,
      query: 'previous architecture decisions'
    });

    // 2. Analyze requirements
    const analysis = await this.analyzeRequirements(feature, memory);

    // 3. Design system architecture
    const design = await this.claude.chat({
      messages: [
        {
          role: 'user',
          content: `You are a senior software architect. Design a system architecture for:

Feature: ${feature.title}
Description: ${feature.description}

Previous decisions: ${JSON.stringify(memory.decisions)}
Team preferences: ${JSON.stringify(memory.teamPreferences)}

Provide:
1. System architecture (components, layers)
2. Tech stack recommendations
3. Database schema outline
4. API design
5. Scalability considerations

Format as JSON.`
        }
      ]
    });

    const systemDesign = JSON.parse(design.content);

    // 4. Save to Letta memory
    await this.letta.saveMemory(this.id, {
      context: `Designed architecture for ${feature.title}`,
      decisions: systemDesign.decisions,
      techStack: systemDesign.techStack
    });

    // 5. Notify other agents
    await this.notifyAgents(systemDesign, feature);

    return systemDesign;
  }

  private async notifyAgents(design: SystemDesign, feature: Feature): Promise<void> {
    // Notify Database Agent
    await this.messageBus.sendMessage({
      fromAgentId: this.id,
      toAgentId: 'database-agent',
      messageType: 'request',
      subject: 'Database schema needed',
      body: `I've designed the system. Please create database schema based on this design.`,
      attachments: {
        design: design.database,
        entities: design.entities
      },
      projectId: feature.project_id,
      featureId: feature.id
    });

    // Notify API Agent
    await this.messageBus.sendMessage({
      fromAgentId: this.id,
      toAgentId: 'api-agent',
      messageType: 'request',
      subject: 'API endpoints needed',
      body: `System design complete. Please implement these API endpoints.`,
      attachments: {
        endpoints: design.api.endpoints,
        authentication: design.api.authentication
      },
      projectId: feature.project_id,
      featureId: feature.id
    });

    // Notify Frontend Agent
    await this.messageBus.sendMessage({
      fromAgentId: this.id,
      toAgentId: 'frontend-agent',
      messageType: 'request',
      subject: 'UI implementation needed',
      body: `Architecture ready. Please build the frontend based on this design.`,
      attachments: {
        pages: design.frontend.pages,
        components: design.frontend.components,
        stateManagement: design.frontend.stateManagement
      },
      projectId: feature.project_id,
      featureId: feature.id
    });
  }

  private async handleMessage(message: AgentMessage): Promise<void> {
    console.log(`Architect received: ${message.subject}`);

    switch (message.messageType) {
      case 'request':
        await this.handleRequest(message);
        break;
      case 'response':
        await this.handleResponse(message);
        break;
      case 'notification':
        await this.handleNotification(message);
        break;
    }
  }
}
```

**Acceptance Criteria:**
- Architect agent registered
- System design generation working
- Tech stack selection logical
- Communication with other agents functional

---

### 2.2 Database Agent (Claude Sonnet + DB MCPs)

**Tasks:**
- [x] Create Database agent
- [x] Implement schema generation
- [x] Add migration creation
- [x] Register agent in database with capabilities

**Deliverables:**

```typescript
// services/agents/src/DatabaseAgent.ts
export class DatabaseAgent {
  private id: string;
  private claude: ClaudeClient;
  private letta: LettaClient;
  private messageBus: MessageBus;
  private mcps: {
    dbProvisioner: MCPClient;
    knowledgeGraph: MCPClient;
  };

  async createSchema(requirements: any, context: any): Promise<DatabaseSchema> {
    // 1. Load team's database patterns from Letta
    const patterns = await this.letta.query({
      agentId: this.id,
      query: 'successful database patterns for similar projects'
    });

    // 2. Generate schema using Claude
    const schema = await this.claude.chat({
      messages: [
        {
          role: 'user',
          content: `You are a database expert. Create a PostgreSQL schema for:

Requirements: ${JSON.stringify(requirements)}
Team patterns: ${JSON.stringify(patterns)}

Include:
1. Tables with columns and types
2. Relationships (foreign keys)
3. Indexes for performance
4. Constraints
5. Sample seed data

Format as Prisma schema.`
        }
      ]
    });

    // 3. Use MCP to provision database
    const provisionResult = await this.mcps.dbProvisioner.call('provision_database', {
      schema: schema.content,
      seedData: true
    });

    // 4. Notify API Agent
    await this.messageBus.sendMessage({
      fromAgentId: this.id,
      toAgentId: 'api-agent',
      messageType: 'response',
      subject: 'Database schema ready',
      body: 'I\'ve created and provisioned the database. You can start building API endpoints.',
      attachments: {
        schema: schema.content,
        databaseUrl: provisionResult.databaseUrl,
        prismaClient: provisionResult.prismaClient
      }
    });

    return provisionResult;
  }
}
```

**Acceptance Criteria:**
- Database agent creating schemas
- MCP integration working
- Migrations generated
- Communication with API agent functional

---

### 2.3 API Agent (Claude Sonnet)

**Tasks:**
- [x] Create API agent
- [x] Implement endpoint generation
- [x] Add validation logic
- [x] Register agent with API capabilities

**Deliverables:**

```typescript
// services/agents/src/APIAgent.ts
export class APIAgent {
  private id: string;
  private claude: ClaudeClient;
  private letta: LettaClient;
  private messageBus: MessageBus;

  async createEndpoints(schema: DatabaseSchema, requirements: any): Promise<APIEndpoints> {
    // 1. Load API patterns from Letta
    const patterns = await this.letta.query({
      agentId: this.id,
      query: 'successful API patterns, tRPC examples'
    });

    // 2. Generate API endpoints using Claude
    const endpoints = await this.claude.chat({
      messages: [
        {
          role: 'user',
          content: `You are a backend developer. Create tRPC API endpoints for:

Database Schema: ${schema}
Requirements: ${JSON.stringify(requirements)}
Team patterns: ${JSON.stringify(patterns)}

Create:
1. tRPC router with all CRUD operations
2. Input validation (Zod schemas)
3. Business logic
4. Error handling
5. Authentication middleware

Format as TypeScript code.`
        }
      ]
    });

    // 3. Notify Frontend Agent
    await this.messageBus.sendMessage({
      fromAgentId: this.id,
      toAgentId: 'frontend-agent',
      messageType: 'response',
      subject: 'API endpoints ready',
      body: 'All API endpoints created. You can start building the UI.',
      attachments: {
        endpoints: endpoints.content,
        types: this.generateTypes(endpoints.content)
      }
    });

    return endpoints;
  }
}
```

**Acceptance Criteria:**
- API agent generating endpoints
- Validation logic included
- Type-safe code generated
- Communication with frontend agent functional

---

### 2.4 Frontend Agent (Claude Sonnet + UI MCPs)

**Tasks:**
- [x] Create Frontend agent
- [x] Implement component generation
- [x] Add page creation
- [x] Register agent with UI capabilities

**Deliverables:**

```typescript
// services/agents/src/FrontendAgent.ts
export class FrontendAgent {
  private id: string;
  private claude: ClaudeClient;
  private letta: LettaClient;
  private messageBus: MessageBus;
  private mcps: {
    uiGenerator: MCPClient;
    imageGen: MCPClient;
  };

  async createUI(apiSpec: any, design: any): Promise<FrontendCode> {
    // 1. Load UI patterns from Letta
    const patterns = await this.letta.query({
      agentId: this.id,
      query: 'successful UI patterns, component library'
    });

    // 2. Generate UI components using Claude
    const components = await this.claude.chat({
      messages: [
        {
          role: 'user',
          content: `You are a frontend developer. Create React components for:

API Spec: ${JSON.stringify(apiSpec)}
Design: ${JSON.stringify(design)}
Team patterns: ${JSON.stringify(patterns)}

Create:
1. Page components
2. Reusable UI components (shadcn/ui style)
3. Forms with validation
4. Data fetching (tRPC)
5. State management

Use: Next.js 14, TypeScript, Tailwind CSS, shadcn/ui

Format as TypeScript/TSX code.`
        }
      ]
    });

    // 3. Use MCP for image generation if needed
    if (design.needsImages) {
      const images = await this.mcps.imageGen.call('generate_images', {
        descriptions: design.imageDescriptions
      });
    }

    return components;
  }
}
```

**Acceptance Criteria:**
- Frontend agent generating components
- UI follows design system
- Type-safe integration with API
- MCP integration working

---

### 2.5 QA Agent (Claude Haiku + Test MCPs)

**Tasks:**
- [x] Create QA agent
- [x] Implement test generation
- [x] Add test execution
- [x] Register agent with testing capabilities

**Deliverables:**

```typescript
// services/agents/src/QAAgent.ts
export class QAAgent {
  private id: string;
  private claude: ClaudeClient;
  private letta: LettaClient;
  private messageBus: MessageBus;
  private mcps: {
    testGenerator: MCPClient;
  };

  async testFeature(feature: Feature, code: any): Promise<TestResults> {
    // 1. Generate tests using Claude (fast Haiku model)
    const tests = await this.claude.chat({
      messages: [
        {
          role: 'user',
          content: `Generate comprehensive tests for:

Feature: ${feature.title}
Code: ${JSON.stringify(code)}

Create:
1. Unit tests
2. Integration tests
3. E2E tests (Playwright)

Format as test code.`
        }
      ]
    });

    // 2. Run tests
    const results = await this.runTests(tests.content);

    // 3. If failures, attempt auto-fix (Ralph-style)
    if (!results.allPassed) {
      const fixes = await this.autoFix(results.failures);
      
      // Re-run tests
      results = await this.runTests(tests.content);
    }

    // 4. Notify integrator
    await this.messageBus.sendMessage({
      fromAgentId: this.id,
      toAgentId: 'integrator-agent',
      messageType: 'response',
      subject: results.allPassed ? 'Tests passed' : 'Tests failed',
      body: `Test results: ${results.passed}/${results.total} passed`,
      attachments: { results }
    });

    return results;
  }

  private async autoFix(failures: TestFailure[]): Promise<Fix[]> {
    const fixes = [];

    for (const failure of failures) {
      const fix = await this.claude.chat({
        messages: [
          {
            role: 'user',
            content: `Fix this test failure:

Test: ${failure.test}
Error: ${failure.error}
Code: ${failure.code}

Provide the fixed code.`
          }
        ]
      });

      fixes.push(fix);
    }

    return fixes;
  }
}
```

**Acceptance Criteria:**
- QA agent generating tests
- Tests executing successfully
- Auto-fix working for simple failures
- Test results reported

---

### 2.6 Security Agent (Claude Sonnet)

**Tasks:**
- [x] Create Security agent
- [x] Implement security scanning
- [x] Add vulnerability detection
- [x] Register agent with security capabilities

**Deliverables:**

```typescript
// services/agents/src/SecurityAgent.ts
export class SecurityAgent {
  private id: string;
  private claude: ClaudeClient;
  private letta: LettaClient;
  private messageBus: MessageBus;

  async auditCode(code: any, feature: Feature): Promise<SecurityAudit> {
    // 1. Scan for common vulnerabilities
    const audit = await this.claude.chat({
      messages: [
        {
          role: 'user',
          content: `You are a security expert. Audit this code for vulnerabilities:

Code: ${JSON.stringify(code)}
Feature: ${feature.title}

Check for:
1. SQL injection
2. XSS vulnerabilities
3. Authentication issues
4. Authorization flaws
5. Data exposure
6. OWASP Top 10

Provide:
- List of vulnerabilities found
- Severity (critical, high, medium, low)
- Recommended fixes

Format as JSON.`
        }
      ]
    });

    const vulnerabilities = JSON.parse(audit.content);

    // 2. If critical issues, notify immediately
    if (vulnerabilities.some(v => v.severity === 'critical')) {
      await this.messageBus.broadcast({
        fromAgentId: this.id,
        messageType: 'notification',
        subject: '🚨 Critical security issues found',
        body: `Found ${vulnerabilities.filter(v => v.severity === 'critical').length} critical vulnerabilities`,
        attachments: { vulnerabilities },
        priority: 10
      });
    }

    return vulnerabilities;
  }
}
```

**Acceptance Criteria:**
- Security agent scanning code
- Vulnerabilities detected
- Severity levels assigned
- Critical issues broadcast immediately

---

### 2.7 Integrator Agent (Claude Sonnet)

**Tasks:**
- [x] Create Integrator agent
- [x] Implement code merging logic
- [x] Add conflict resolution
- [x] Register agent with integration capabilities

**Deliverables:**

```typescript
// services/agents/src/IntegratorAgent.ts
export class IntegratorAgent {
  private id: string;
  private claude: ClaudeClient;
  private letta: LettaClient;
  private messageBus: MessageBus;

  async integrate(results: AgentResult[]): Promise<IntegratedCode> {
    // 1. Collect all agent outputs
    const database = results.find(r => r.agentType === 'database');
    const api = results.find(r => r.agentType === 'api');
    const frontend = results.find(r => r.agentType === 'frontend');
    const tests = results.find(r => r.agentType === 'qa');

    // 2. Integrate using Claude
    const integrated = await this.claude.chat({
      messages: [
        {
          role: 'user',
          content: `You are an integration specialist. Combine these components into a working application:

Database: ${JSON.stringify(database.output)}
API: ${JSON.stringify(api.output)}
Frontend: ${JSON.stringify(frontend.output)}
Tests: ${JSON.stringify(tests.output)}

Ensure:
1. All imports are correct
2. No naming conflicts
3. Proper file structure
4. All connections working
5. Environment variables configured

Provide complete, integrated codebase.`
        }
      ]
    });

    // 3. Resolve any conflicts
    const conflicts = await this.detectConflicts(integrated.content);
    if (conflicts.length > 0) {
      integrated = await this.resolveConflicts(conflicts, integrated.content);
    }

    return integrated;
  }
}
```

**Acceptance Criteria:**
- Integrator combining all outputs
- Conflicts detected and resolved
- Complete codebase generated
- All connections working

---

## Week 4: Orchestration Layer

### 4.1 Multi-Agent Orchestrator

**Tasks:**
- [x] Create orchestration engine
- [x] Implement execution planning
- [x] Add parallel execution support
- [x] Integrate with all agents

**Deliverables:**

```typescript
// services/orchestrator/src/Orchestrator.ts
export class AgentOrchestrator {
  private registry: AgentRegistry;
  private messageBus: MessageBus;
  private letta: LettaClient;
  private agents: Map<string, Agent>;

  async buildFeature(feature: Feature, project: Project): Promise<BuildResult> {
    // 1. Load context from Letta
    const context = await this.letta.loadContext({
      teamId: project.team_id,
      projectId: project.id,
      featureDescription: feature.description
    });

    // 2. Create execution plan
    const plan = await this.createExecutionPlan(feature, context);

    // 3. Execute plan
    const result = await this.executePlan(plan, feature, project);

    // 4. Save learnings to Letta
    await this.letta.saveMemory({
      teamId: project.team_id,
      context: `Completed feature: ${feature.title}`,
      learnings: result.learnings,
      success: result.success
    });

    return result;
  }

  private async createExecutionPlan(feature: Feature, context: any): Promise<ExecutionPlan> {
    return {
      steps: [
        {
          name: 'Architecture Design',
          agent: 'architect-agent',
          parallel: false,
          dependencies: []
        },
        {
          name: 'Parallel Development',
          parallel: true,
          agents: [
            { name: 'database-agent', dependencies: ['architect-agent'] },
            { name: 'api-agent', dependencies: ['database-agent'] },
            { name: 'frontend-agent', dependencies: ['api-agent'] }
          ]
        },
        {
          name: 'Quality Assurance',
          parallel: true,
          agents: [
            { name: 'qa-agent', dependencies: ['frontend-agent'] },
            { name: 'security-agent', dependencies: ['api-agent'] }
          ]
        },
        {
          name: 'Integration',
          agent: 'integrator-agent',
          parallel: false,
          dependencies: ['qa-agent', 'security-agent']
        }
      ]
    };
  }

  private async executePlan(plan: ExecutionPlan, feature: Feature, project: Project): Promise<BuildResult> {
    const results = [];

    for (const step of plan.steps) {
      if (step.parallel) {
        // Execute agents in parallel
        const parallelResults = await Promise.all(
          step.agents.map(agentConfig =>
            this.executeAgent(agentConfig.name, feature, project, results)
          )
        );
        results.push(...parallelResults);
      } else {
        // Execute single agent
        const result = await this.executeAgent(step.agent, feature, project, results);
        results.push(result);
      }
    }

    return {
      success: results.every(r => r.success),
      results,
      learnings: this.extractLearnings(results)
    };
  }

  private async executeAgent(agentId: string, feature: Feature, project: Project, previousResults: any[]): Promise<AgentResult> {
    const agent = this.agents.get(agentId);
    
    // Update agent status
    await this.registry.updateAgentStatus(agentId, 'working');

    try {
      // Execute agent
      const result = await agent.execute(feature, project, previousResults);

      // Update agent status
      await this.registry.updateAgentStatus(agentId, 'idle');

      return result;
    } catch (error) {
      await this.registry.updateAgentStatus(agentId, 'error');
      throw error;
    }
  }
}
```

**Acceptance Criteria:**
- Orchestrator coordinating all agents
- Execution plans generated
- Parallel execution working
- Dependencies respected

---

## Week 5: Agent Dashboard UI

### 5.1 Real-Time Agent Dashboard

**Tasks:**
- [ ] Create agent dashboard UI
- [ ] Add real-time status updates
- [ ] Implement agent activity visualization
- [ ] Add message log viewer

**Deliverables:**

```typescript
// app/agents/page.tsx
export default function AgentDashboard() {
  const { agents, isLoading } = useAgents();
  const { messages } = useAgentMessages();
  const { conversations } = useConversations();

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Agent Orchestra</h1>

      {/* Agent Status Grid */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {agents.map(agent => (
          <Card key={agent.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h3>{agent.name}</h3>
                <StatusBadge status={agent.status} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Tasks:</span>
                  <span>{agent.tasks_completed}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Success Rate:</span>
                  <span>{(agent.success_rate * 100).toFixed(1)}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Avg Response:</span>
                  <span>{agent.avg_response_time}ms</span>
                </div>
              </div>

              {agent.status === 'working' && (
                <div className="mt-4">
                  <Progress value={agent.currentProgress} />
                  <p className="text-xs text-muted-foreground mt-1">
                    {agent.currentTask}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Agent Communication Log */}
      <Card>
        <CardHeader>
          <h2>Agent Communication</h2>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {messages.map(message => (
              <div key={message.id} className="border-l-2 border-blue-500 pl-4 py-2">
                <div className="flex items-center gap-2 text-sm">
                  <Badge>{message.from_agent_id}</Badge>
                  <span>→</span>
                  <Badge variant="outline">{message.to_agent_id}</Badge>
                  <span className="text-muted-foreground">
                    {formatDistanceToNow(message.sent_at)} ago
                  </span>
                </div>
                <p className="font-medium">{message.subject}</p>
                <p className="text-sm text-muted-foreground">{message.body}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

**Acceptance Criteria:**
- Dashboard showing all agents
- Real-time status updates
- Message log visible
- Agent metrics displayed

---

## Deliverables Summary

- ✅ OASF-style agent registry operational
- ✅ Inter-agent messaging framework working
- ✅ 7 specialized agents implemented and registered
- ✅ Multi-agent orchestrator coordinating work
- ✅ Agent dashboard UI showing real-time activity
- ✅ All agents communicating successfully

---

## Success Metrics

- [ ] All 7 agents registered and healthy
- [ ] Agents successfully collaborating on features
- [ ] Messages delivered with < 100ms latency
- [ ] Orchestrator executing plans correctly
- [ ] Dashboard showing accurate real-time data
- [ ] Zero message loss

---

## Next Phase

Once Phase 2 is complete, proceed to [Phase 3: AutoCoder Integration](./ocean3.md)

---

**Phase Owner:** [Name]  
**Start Date:** [Date]  
**Target Completion:** [Date + 5 weeks]  
**Status:** Not Started
