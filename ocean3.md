# 🌊 OCEAN Phase 3: AutoCoder Integration

**Duration:** 4 weeks  
**Status:** Not Started  
**Dependencies:** Phase 1 (Foundation), Phase 2 (Core Agent System)

---

## Overview

Phase 3 integrates AutoCoder into OCEAN as the primary code generation engine, wrapping it (not forking) to add decision logging, visual decision maps, and multi-agent collaboration capabilities.

**Goal:** Seamlessly integrate AutoCoder's autonomous coding capabilities with OCEAN's multi-agent system and decision tracking.

---

## Objectives

1. ✅ Wrap AutoCoder (not fork) for integration
2. ✅ Build decision logger to extract architecture decisions
3. ✅ Create visual Decision Map UI
4. ✅ Integrate AutoCoder with multi-agent system
5. ✅ Implement intelligent Git management
6. ✅ Build feature management system

---

## Week 1: AutoCoder Wrapper & Decision Logger

### 1.1 AutoCoder Installation & Configuration

**Tasks:**
- [x] Install AutoCoder on new Hetzner server
- [x] Configure AutoCoder for multi-user support
- [x] Set up AutoCoder project isolation
- [x] Configure Claude API routing through proxy

**File Structure:**
```
services/
├── autocoder-wrapper/
│   ├── src/
│   │   ├── index.ts                      # Main wrapper service
│   │   ├── AutoCoderManager.ts           # Manage AutoCoder instances
│   │   ├── DecisionLogger.ts             # Extract decisions
│   │   ├── ProjectIsolation.ts           # Multi-user isolation
│   │   └── APIInterceptor.ts             # Route API calls through proxy
│   ├── autocoder/                        # AutoCoder installation
│   │   └── [AutoCoder files]
│   ├── package.json
│   └── tsconfig.json
```

**Deliverables:**

**AutoCoder Manager:**
```typescript
// services/autocoder-wrapper/src/AutoCoderManager.ts
import { spawn, ChildProcess } from 'child_process';
import path from 'path';
import fs from 'fs/promises';

export class AutoCoderManager {
  private instances: Map<string, AutoCoderInstance> = new Map();
  private autocoderPath: string;

  constructor(autocoderPath: string) {
    this.autocoderPath = autocoderPath;
  }

  async createProject(userId: string, projectId: string, projectName: string): Promise<AutoCoderInstance> {
    // 1. Create isolated project directory
    const projectPath = path.join(
      this.autocoderPath,
      'generations',
      userId,
      projectId
    );
    await fs.mkdir(projectPath, { recursive: true });

    // 2. Initialize AutoCoder project
    const instance: AutoCoderInstance = {
      userId,
      projectId,
      projectName,
      projectPath,
      status: 'idle',
      process: null
    };

    // 3. Store instance
    this.instances.set(projectId, instance);

    return instance;
  }

  async startAutoCoderSession(
    projectId: string,
    feature: Feature,
    context: any
  ): Promise<void> {
    const instance = this.instances.get(projectId);
    if (!instance) throw new Error('Project not found');

    // 1. Create app_spec.txt with feature requirements
    const appSpec = this.generateAppSpec(feature, context);
    await fs.writeFile(
      path.join(instance.projectPath, 'prompts', 'app_spec.txt'),
      appSpec
    );

    // 2. Start AutoCoder process
    const process = spawn('python', [
      path.join(this.autocoderPath, 'autonomous_agent_demo.py'),
      '--project', instance.projectPath,
      '--model', context.preferredModel || 'claude-3-5-sonnet-20241022'
    ], {
      cwd: this.autocoderPath,
      env: {
        ...process.env,
        CLAUDE_API_KEY: 'proxy', // Will be intercepted
        ANTHROPIC_API_URL: 'http://localhost:3001/api/claude' // Our proxy
      }
    });

    // 3. Capture output for decision logging
    process.stdout.on('data', (data) => {
      this.handleAutoCoderOutput(projectId, data.toString());
    });

    process.stderr.on('data', (data) => {
      console.error(`AutoCoder error: ${data}`);
    });

    process.on('close', (code) => {
      instance.status = code === 0 ? 'completed' : 'error';
      instance.process = null;
    });

    instance.process = process;
    instance.status = 'running';
  }

  async stopAutoCoderSession(projectId: string): Promise<void> {
    const instance = this.instances.get(projectId);
    if (!instance || !instance.process) return;

    instance.process.kill('SIGTERM');
    instance.status = 'stopped';
  }

  private generateAppSpec(feature: Feature, context: any): string {
    return `
# ${feature.title}

## Description
${feature.description}

## Requirements
${feature.test_steps.map((step, i) => `${i + 1}. ${step}`).join('\n')}

## Technical Context
- Framework: ${context.framework || 'Next.js 14'}
- Database: ${context.database || 'PostgreSQL with Prisma'}
- Styling: ${context.styling || 'Tailwind CSS + shadcn/ui'}
- Authentication: ${context.auth || 'NextAuth.js'}

## Team Patterns
${context.teamPatterns ? JSON.stringify(context.teamPatterns, null, 2) : 'None'}

## Additional Notes
${context.notes || 'None'}
`;
  }

  private handleAutoCoderOutput(projectId: string, output: string): void {
    // Emit output for decision logger
    this.emit('autocoder:output', { projectId, output });

    // Emit for UI (real-time streaming)
    this.emit('autocoder:stream', { projectId, output });
  }
}
```

**API Interceptor:**
```typescript
// services/autocoder-wrapper/src/APIInterceptor.ts
import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';

export class APIInterceptor {
  private app: express.Application;

  constructor() {
    this.app = express();
    this.setupRoutes();
  }

  private setupRoutes(): void {
    // Intercept Claude API calls from AutoCoder
    this.app.use('/api/claude', createProxyMiddleware({
      target: 'http://localhost:3001', // Our API proxy
      changeOrigin: true,
      onProxyReq: (proxyReq, req, res) => {
        // Add user context
        const projectId = req.headers['x-project-id'];
        const userId = req.headers['x-user-id'];
        
        proxyReq.setHeader('X-User-Id', userId);
        proxyReq.setHeader('X-Project-Id', projectId);
      }
    }));
  }

  listen(port: number): void {
    this.app.listen(port, () => {
      console.log(`API Interceptor listening on port ${port}`);
    });
  }
}
```

**Acceptance Criteria:**
- AutoCoder installed and running
- Projects isolated per user
- API calls routed through proxy
- Output captured for logging

---

### 1.2 Decision Logger

**Tasks:**
- [x] Create decision extraction engine
- [x] Implement pattern matching for decisions
- [x] Store decisions in database
- [x] Link decisions to features and files

**Deliverables:**

**Decision Logger:**
```typescript
// services/autocoder-wrapper/src/DecisionLogger.ts
export class DecisionLogger {
  private db: Pool;
  private patterns: DecisionPattern[];

  constructor(db: Pool) {
    this.db = db;
    this.loadPatterns();
  }

  async logDecision(projectId: string, output: string): Promise<void> {
    // 1. Extract decisions from AutoCoder output
    const decisions = this.extractDecisions(output);

    // 2. Store each decision
    for (const decision of decisions) {
      await this.storeDecision(projectId, decision);
    }
  }

  private extractDecisions(output: string): Decision[] {
    const decisions: Decision[] = [];

    for (const pattern of this.patterns) {
      const matches = output.match(pattern.regex);
      if (matches) {
        decisions.push({
          type: pattern.type,
          decision: matches[1],
          reasoning: this.extractReasoning(output, matches.index),
          confidence: pattern.confidence
        });
      }
    }

    return decisions;
  }

  private loadPatterns(): void {
    this.patterns = [
      {
        type: 'framework',
        regex: /(?:chose|selected|using)\s+(Next\.js|React|Vue|Angular)/gi,
        confidence: 0.9
      },
      {
        type: 'database',
        regex: /(?:database|DB):\s*(PostgreSQL|MongoDB|MySQL|SQLite)/gi,
        confidence: 0.95
      },
      {
        type: 'orm',
        regex: /(?:ORM|using)\s+(Prisma|TypeORM|Sequelize|Drizzle)/gi,
        confidence: 0.9
      },
      {
        type: 'api',
        regex: /(?:API|endpoints):\s*(REST|GraphQL|tRPC|gRPC)/gi,
        confidence: 0.85
      },
      {
        type: 'styling',
        regex: /(?:styling|CSS):\s*(Tailwind|CSS Modules|Styled Components)/gi,
        confidence: 0.8
      },
      {
        type: 'authentication',
        regex: /(?:auth|authentication):\s*(NextAuth|Auth0|Clerk|Supabase)/gi,
        confidence: 0.9
      },
      {
        type: 'architecture',
        regex: /(?:architecture|pattern):\s*(monorepo|microservices|serverless|monolith)/gi,
        confidence: 0.85
      }
    ];
  }

  private async storeDecision(projectId: string, decision: Decision): Promise<void> {
    await this.db.query(`
      INSERT INTO decisions (
        project_id, type, decision, reasoning,
        made_by, made_by_id, impact_level, timestamp
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
    `, [
      projectId,
      decision.type,
      decision.decision,
      decision.reasoning,
      'autocoder',
      'autocoder-agent',
      this.determineImpact(decision.type),
    ]);
  }

  private determineImpact(type: string): string {
    const criticalTypes = ['database', 'architecture', 'authentication'];
    const highTypes = ['framework', 'api'];
    
    if (criticalTypes.includes(type)) return 'critical';
    if (highTypes.includes(type)) return 'high';
    return 'medium';
  }

  private extractReasoning(output: string, decisionIndex: number): string {
    // Extract surrounding context as reasoning
    const start = Math.max(0, decisionIndex - 200);
    const end = Math.min(output.length, decisionIndex + 200);
    return output.substring(start, end).trim();
  }
}
```

**Acceptance Criteria:**
- Decisions extracted from AutoCoder output
- Decisions stored in database
- Decision types categorized correctly
- Impact levels assigned

---

## Week 2: Decision Map UI

### 2.1 Visual Decision Map

**Tasks:**
- [x] Create Decision Map component
- [x] Implement graph visualization (React Flow)
- [x] Add interactive node exploration
- [x] Link to source files

**Deliverables:**

**Decision Map Component:**
```typescript
// app/projects/[id]/decisions/page.tsx
'use client';

import ReactFlow, {
  Node,
  Edge,
  Background,
  Controls,
  MiniMap
} from 'reactflow';
import 'reactflow/dist/style.css';

export default function DecisionMapPage({ params }: { params: { id: string } }) {
  const { decisions, isLoading } = useDecisions(params.id);
  const { nodes, edges } = useDecisionGraph(decisions);

  return (
    <div className="h-screen">
      <div className="p-4 border-b">
        <h1 className="text-2xl font-bold">Decision Map</h1>
        <p className="text-muted-foreground">
          Visual representation of all architecture decisions
        </p>
      </div>

      <div className="h-[calc(100vh-80px)]">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          fitView
          nodeTypes={nodeTypes}
        >
          <Background />
          <Controls />
          <MiniMap />
        </ReactFlow>
      </div>

      <DecisionPanel />
    </div>
  );
}

// Custom node types
const nodeTypes = {
  database: DatabaseNode,
  api: APINode,
  framework: FrameworkNode,
  architecture: ArchitectureNode
};

function DatabaseNode({ data }: { data: any }) {
  return (
    <div className="px-4 py-2 shadow-lg rounded-md bg-blue-50 border-2 border-blue-500">
      <div className="flex items-center gap-2">
        <Database className="w-4 h-4" />
        <div className="font-bold">{data.label}</div>
      </div>
      <div className="text-xs text-muted-foreground mt-1">
        {data.decision}
      </div>
    </div>
  );
}

// Generate graph from decisions
function useDecisionGraph(decisions: Decision[]) {
  const nodes: Node[] = decisions.map((decision, index) => ({
    id: decision.id,
    type: decision.type,
    position: calculatePosition(decision, index),
    data: {
      label: decision.type.toUpperCase(),
      decision: decision.decision,
      reasoning: decision.reasoning
    }
  }));

  const edges: Edge[] = [];
  
  // Create edges based on relationships
  decisions.forEach((decision, index) => {
    if (decision.related_decisions) {
      decision.related_decisions.forEach(relatedId => {
        edges.push({
          id: `${decision.id}-${relatedId}`,
          source: decision.id,
          target: relatedId,
          animated: true
        });
      });
    }
  });

  return { nodes, edges };
}
```

**Decision Panel:**
```typescript
// components/DecisionPanel.tsx
export function DecisionPanel() {
  const [selectedDecision, setSelectedDecision] = useState<Decision | null>(null);

  return (
    <div className="fixed right-0 top-0 h-screen w-96 bg-background border-l p-6 overflow-y-auto">
      {selectedDecision ? (
        <>
          <h2 className="text-xl font-bold mb-4">Decision Details</h2>
          
          <div className="space-y-4">
            <div>
              <Label>Type</Label>
              <Badge>{selectedDecision.type}</Badge>
            </div>

            <div>
              <Label>Decision</Label>
              <p className="text-sm">{selectedDecision.decision}</p>
            </div>

            <div>
              <Label>Reasoning</Label>
              <p className="text-sm text-muted-foreground">
                {selectedDecision.reasoning}
              </p>
            </div>

            <div>
              <Label>Impact</Label>
              <Badge variant={getImpactVariant(selectedDecision.impact_level)}>
                {selectedDecision.impact_level}
              </Badge>
            </div>

            <div>
              <Label>Made By</Label>
              <p className="text-sm">{selectedDecision.made_by}</p>
            </div>

            <div>
              <Label>Timestamp</Label>
              <p className="text-sm">
                {formatDistanceToNow(selectedDecision.timestamp)} ago
              </p>
            </div>

            {selectedDecision.related_files && (
              <div>
                <Label>Related Files</Label>
                <ul className="text-sm space-y-1">
                  {selectedDecision.related_files.map(file => (
                    <li key={file}>
                      <a href={`/files/${file}`} className="text-blue-500 hover:underline">
                        {file}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="text-center text-muted-foreground">
          Select a decision node to view details
        </div>
      )}
    </div>
  );
}
```

**Acceptance Criteria:**
- Decision Map visualizing all decisions
- Interactive nodes with details
- Relationships between decisions shown
- Links to related files working

---

## Week 3: Multi-Agent Integration

### 3.1 AutoCoder + Multi-Agent Collaboration

**Tasks:**
- [x] Integrate AutoCoder with agent orchestrator
- [x] Enable agents to provide context to AutoCoder
- [x] Allow AutoCoder to request agent assistance
- [x] Synchronize AutoCoder features with agent tasks

**Deliverables:**

**Integrated Workflow:**
```typescript
// services/orchestrator/src/AutoCoderIntegration.ts
export class AutoCoderIntegration {
  private autocoderManager: AutoCoderManager;
  private orchestrator: AgentOrchestrator;
  private messageBus: MessageBus;

  async buildFeatureWithAgents(
    feature: Feature,
    project: Project
  ): Promise<BuildResult> {
    // 1. Agents prepare context
    const agentContext = await this.orchestrator.prepareContext(feature, project);

    // 2. Start AutoCoder with agent-provided context
    await this.autocoderManager.startAutoCoderSession(
      project.id,
      feature,
      agentContext
    );

    // 3. Monitor AutoCoder progress
    const autocoderResult = await this.monitorAutoCoderProgress(project.id, feature.id);

    // 4. Agents validate and enhance
    const validation = await this.orchestrator.validateAndEnhance(autocoderResult);

    // 5. Integrate everything
    const integrated = await this.orchestrator.integrate([
      autocoderResult,
      ...validation.enhancements
    ]);

    return integrated;
  }

  private async monitorAutoCoderProgress(
    projectId: string,
    featureId: string
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      // Listen for AutoCoder completion
      this.autocoderManager.on('autocoder:completed', (result) => {
        if (result.projectId === projectId && result.featureId === featureId) {
          resolve(result);
        }
      });

      // Listen for AutoCoder requests for help
      this.autocoderManager.on('autocoder:request_help', async (request) => {
        if (request.projectId === projectId) {
          // Route to appropriate agent
          const response = await this.routeToAgent(request);
          
          // Send response back to AutoCoder
          await this.autocoderManager.provideContext(projectId, response);
        }
      });

      // Timeout after 1 hour
      setTimeout(() => reject(new Error('AutoCoder timeout')), 3600000);
    });
  }

  private async routeToAgent(request: any): Promise<any> {
    // Determine which agent can help
    const agentType = this.determineAgentType(request.type);
    
    // Send message to agent
    const response = await this.messageBus.sendAndWait({
      toAgentId: `${agentType}-agent`,
      messageType: 'request',
      subject: 'AutoCoder needs help',
      body: request.question,
      attachments: request.context
    });

    return response;
  }
}
```

**Acceptance Criteria:**
- AutoCoder receiving context from agents
- Agents validating AutoCoder output
- Bidirectional communication working
- Features synchronized

---

## Week 4: Intelligent Git Management

### 4.1 Git MCP (Root Level)

**Tasks:**
- [ ] Create Git MCP server
- [ ] Implement smart branching
- [ ] Add AI-generated commit messages
- [ ] Build PR automation
- [ ] Add conflict detection

**Deliverables:**

**Git MCP Server:**
```typescript
// mcp-servers/git-manager/index.ts
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import simpleGit, { SimpleGit } from 'simple-git';
import { ClaudeClient } from './claude-client.js';

const server = new Server({
  name: 'git-manager',
  version: '1.0.0'
}, {
  capabilities: { tools: {} }
});

const claude = new ClaudeClient();

server.setRequestHandler('tools/list', async () => ({
  tools: [
    {
      name: 'smart_branch',
      description: 'Create branch with team naming conventions',
      inputSchema: {
        type: 'object',
        properties: {
          featureName: { type: 'string' },
          projectId: { type: 'string' }
        },
        required: ['featureName', 'projectId']
      }
    },
    {
      name: 'smart_commit',
      description: 'AI-generated commit message from changes',
      inputSchema: {
        type: 'object',
        properties: {
          projectPath: { type: 'string' }
        },
        required: ['projectPath']
      }
    },
    {
      name: 'smart_pr',
      description: 'Create PR with AI-generated description',
      inputSchema: {
        type: 'object',
        properties: {
          projectPath: { type: 'string' },
          targetBranch: { type: 'string' }
        },
        required: ['projectPath', 'targetBranch']
      }
    },
    {
      name: 'detect_conflicts',
      description: 'Detect and suggest resolutions for merge conflicts',
      inputSchema: {
        type: 'object',
        properties: {
          projectPath: { type: 'string' },
          sourceBranch: { type: 'string' },
          targetBranch: { type: 'string' }
        },
        required: ['projectPath', 'sourceBranch', 'targetBranch']
      }
    }
  ]
}));

server.setRequestHandler('tools/call', async (request) => {
  const { name, arguments: args } = request.params;

  switch (name) {
    case 'smart_branch':
      return await smartBranch(args.featureName, args.projectId);
    
    case 'smart_commit':
      return await smartCommit(args.projectPath);
    
    case 'smart_pr':
      return await smartPR(args.projectPath, args.targetBranch);
    
    case 'detect_conflicts':
      return await detectConflicts(
        args.projectPath,
        args.sourceBranch,
        args.targetBranch
      );
    
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
});

async function smartBranch(featureName: string, projectId: string) {
  // Get team's branch naming pattern from database
  const pattern = await getTeamBranchPattern(projectId);
  
  // Generate branch name
  const branchName = pattern
    .replace('{type}', 'feat')
    .replace('{name}', featureName.toLowerCase().replace(/\s+/g, '-'));
  
  // Create branch
  const git: SimpleGit = simpleGit(getProjectPath(projectId));
  await git.checkoutLocalBranch(branchName);
  
  return {
    success: true,
    branchName,
    message: `Created branch: ${branchName}`
  };
}

async function smartCommit(projectPath: string) {
  const git: SimpleGit = simpleGit(projectPath);
  
  // Get diff
  const diff = await git.diff();
  
  // Generate commit message using Claude
  const message = await claude.chat({
    messages: [{
      role: 'user',
      content: `Generate a concise, conventional commit message for these changes:

${diff}

Format: <type>(<scope>): <subject>

Types: feat, fix, docs, style, refactor, test, chore`
    }]
  });
  
  // Commit
  await git.add('.');
  await git.commit(message.content);
  
  return {
    success: true,
    message: message.content
  };
}

async function smartPR(projectPath: string, targetBranch: string) {
  const git: SimpleGit = simpleGit(projectPath);
  
  // Get commits
  const log = await git.log([`${targetBranch}..HEAD`]);
  
  // Generate PR description using Claude
  const description = await claude.chat({
    messages: [{
      role: 'user',
      content: `Generate a PR description for these commits:

${log.all.map(c => `- ${c.message}`).join('\n')}

Include:
1. Summary of changes
2. Testing done
3. Breaking changes (if any)`
    }]
  });
  
  return {
    success: true,
    title: log.latest?.message || 'Update',
    description: description.content
  };
}

async function detectConflicts(
  projectPath: string,
  sourceBranch: string,
  targetBranch: string
) {
  const git: SimpleGit = simpleGit(projectPath);
  
  // Try merge (dry run)
  try {
    await git.merge([sourceBranch, '--no-commit', '--no-ff']);
    await git.merge(['--abort']); // Abort the merge
    
    return {
      hasConflicts: false,
      message: 'No conflicts detected'
    };
  } catch (error) {
    // Get conflict files
    const status = await git.status();
    const conflicts = status.conflicted;
    
    // Suggest resolutions using Claude
    const suggestions = await claude.chat({
      messages: [{
        role: 'user',
        content: `Suggest resolutions for merge conflicts in these files:

${conflicts.join('\n')}

Provide specific guidance for each file.`
      }]
    });
    
    return {
      hasConflicts: true,
      conflicts,
      suggestions: suggestions.content
    };
  }
}
```

**Acceptance Criteria:**
- Smart branching with team conventions
- AI-generated commit messages
- PR automation working
- Conflict detection functional

---

## Deliverables Summary

- ✅ AutoCoder wrapped and integrated
- ✅ Decision logger extracting decisions
- ✅ Decision Map UI visualizing architecture
- ✅ Multi-agent collaboration with AutoCoder
- ✅ Intelligent Git management (MCP)
- ✅ Feature management synchronized

---

## Success Metrics

- [ ] AutoCoder successfully wrapped (not forked)
- [ ] 90%+ of decisions automatically logged
- [ ] Decision Map showing complete architecture
- [ ] Agents and AutoCoder collaborating smoothly
- [ ] Git operations automated with AI
- [ ] Zero conflicts in team workflow

---

## Next Phase

Once Phase 3 is complete, proceed to [Phase 4: Letta & Knowledge Systems](./ocean4.md)

---

**Phase Owner:** [Name]  
**Start Date:** [Date]  
**Target Completion:** [Date + 4 weeks]  
**Status:** Not Started
