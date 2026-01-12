# 🌊 OCEAN Phase 4: Letta & Knowledge Systems

**Duration:** 5 weeks  
**Status:** Not Started  
**Dependencies:** Phase 1 (Foundation), Phase 2 (Core Agent System), Phase 3 (AutoCoder Integration)

---

## Overview

Phase 4 integrates Letta (MemGPT) for memory-first AI agents and builds the knowledge graph system that enables collective intelligence and predictive context loading.

**Goal:** Create a platform where agents and teams have persistent memory, learn from every project, and automatically suggest optimal solutions based on past successes.

---

## Objectives

1. ✅ Install and configure Letta
2. ✅ Integrate Letta with all agents
3. ✅ Build team memory system
4. ✅ Create knowledge graph (Neo4j)
5. ✅ Implement pattern extraction engine
6. ✅ Build predictive context loading
7. ✅ Create collective memory UI

---

## Week 1: Letta Installation & Agent Integration

### 1.1 Letta Setup

**Tasks:**
- [x] Install Letta on new Hetzner server
- [x] Configure Letta database
- [x] Set up Letta API server
- [x] Create Letta client library

**Installation:**
```bash
# Install Letta
cd /opt/ocean
git clone https://github.com/letta-ai/letta.git
cd letta
pip install -e .

# Configure Letta
letta configure

# Start Letta server
letta server --host 0.0.0.0 --port 8283
```

**Letta Configuration:**
```yaml
# ~/.letta/config.yaml
model: claude-3-5-sonnet-20241022
model_endpoint: http://localhost:3001/api/claude  # Our proxy
model_endpoint_type: anthropic

# Database
archival_storage_type: postgres
archival_storage_uri: postgresql://ocean_user:${POSTGRES_PASSWORD}@localhost:5432/ocean_db

# Memory configuration
default_preset: ocean_agent
context_window: 200000
```

**Deliverables:**

**Letta Client Library:**
```typescript
// lib/letta/LettaClient.ts
import axios from 'axios';

export class LettaClient {
  private baseUrl: string;
  private apiKey: string;

  constructor(baseUrl = 'http://localhost:8283', apiKey?: string) {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey || process.env.LETTA_API_KEY;
  }

  async createAgent(config: LettaAgentConfig): Promise<LettaAgent> {
    const response = await axios.post(`${this.baseUrl}/agents`, {
      name: config.name,
      preset: config.preset || 'ocean_agent',
      human: config.human || 'OCEAN Developer',
      persona: config.persona,
      model: config.model || 'claude-3-5-sonnet-20241022',
      context_window: config.contextWindow || 200000
    }, {
      headers: { 'Authorization': `Bearer ${this.apiKey}` }
    });

    return response.data;
  }

  async sendMessage(agentId: string, message: string, role: string = 'user'): Promise<LettaResponse> {
    const response = await axios.post(`${this.baseUrl}/agents/${agentId}/messages`, {
      message,
      role,
      stream: false
    }, {
      headers: { 'Authorization': `Bearer ${this.apiKey}` }
    });

    return response.data;
  }

  async loadMemory(agentId: string, query?: string): Promise<LettaMemory> {
    const response = await axios.get(`${this.baseUrl}/agents/${agentId}/memory`, {
      params: { query },
      headers: { 'Authorization': `Bearer ${this.apiKey}` }
    });

    return response.data;
  }

  async saveMemory(agentId: string, memory: Partial<LettaMemory>): Promise<void> {
    await axios.put(`${this.baseUrl}/agents/${agentId}/memory`, memory, {
      headers: { 'Authorization': `Bearer ${this.apiKey}` }
    });
  }

  async archiveMemory(agentId: string, content: string, metadata?: any): Promise<void> {
    await axios.post(`${this.baseUrl}/agents/${agentId}/archival`, {
      content,
      metadata
    }, {
      headers: { 'Authorization': `Bearer ${this.apiKey}` }
    });
  }

  async searchArchival(agentId: string, query: string, limit: number = 10): Promise<ArchivalMemory[]> {
    const response = await axios.get(`${this.baseUrl}/agents/${agentId}/archival/search`, {
      params: { query, limit },
      headers: { 'Authorization': `Bearer ${this.apiKey}` }
    });

    return response.data;
  }

  async getConversationHistory(agentId: string, limit: number = 50): Promise<Message[]> {
    const response = await axios.get(`${this.baseUrl}/agents/${agentId}/messages`, {
      params: { limit },
      headers: { 'Authorization': `Bearer ${this.apiKey}` }
    });

    return response.data;
  }
}
```

**Acceptance Criteria:**
- Letta server running
- API accessible
- Client library functional
- Database connected

---

### 1.2 Integrate Letta with Agents

**Tasks:**
- [x] Create Letta agent for each OCEAN agent
- [x] Configure agent personas
- [x] Set up memory persistence
- [x] Test agent memory recall

**Deliverables:**

**Enhanced Agent with Letta:**
```typescript
// services/agents/src/base/LettaEnhancedAgent.ts
export abstract class LettaEnhancedAgent {
  protected id: string;
  protected type: string;
  protected letta: LettaClient;
  protected lettaAgentId: string;

  constructor(config: AgentConfig) {
    this.id = config.id;
    this.type = config.type;
    this.letta = new LettaClient();
    
    this.initializeLettaAgent();
  }

  private async initializeLettaAgent(): Promise<void> {
    // Create Letta agent with specific persona
    const lettaAgent = await this.letta.createAgent({
      name: `${this.type}-${this.id}`,
      persona: this.getPersona(),
      human: 'OCEAN Development Team'
    });

    this.lettaAgentId = lettaAgent.id;

    // Store Letta agent ID in database
    await db.query(`
      UPDATE agents SET letta_agent_id = $1 WHERE id = $2
    `, [this.lettaAgentId, this.id]);
  }

  protected abstract getPersona(): string;

  protected async executeWithMemory(task: any, context: any): Promise<any> {
    // 1. Load relevant memory
    const memory = await this.loadRelevantMemory(task);

    // 2. Execute task with memory context
    const result = await this.execute(task, { ...context, memory });

    // 3. Save new learnings to memory
    await this.saveToMemory(task, result);

    return result;
  }

  private async loadRelevantMemory(task: any): Promise<any> {
    // Search archival memory for relevant past experiences
    const relevantMemories = await this.letta.searchArchival(
      this.lettaAgentId,
      `${task.type}: ${task.description}`,
      5
    );

    // Get core memory (agent's persistent knowledge)
    const coreMemory = await this.letta.loadMemory(this.lettaAgentId);

    return {
      core: coreMemory,
      archival: relevantMemories,
      recall: await this.letta.getConversationHistory(this.lettaAgentId, 10)
    };
  }

  private async saveToMemory(task: any, result: any): Promise<void> {
    // Archive the experience
    await this.letta.archiveMemory(this.lettaAgentId, JSON.stringify({
      task: task.description,
      approach: result.approach,
      outcome: result.success ? 'success' : 'failure',
      learnings: result.learnings,
      timestamp: new Date()
    }), {
      taskType: task.type,
      success: result.success
    });

    // Update core memory if significant learning
    if (result.significantLearning) {
      const currentMemory = await this.letta.loadMemory(this.lettaAgentId);
      await this.letta.saveMemory(this.lettaAgentId, {
        ...currentMemory,
        persona: this.updatePersona(currentMemory.persona, result.learnings)
      });
    }
  }

  protected abstract execute(task: any, context: any): Promise<any>;
  protected abstract updatePersona(currentPersona: string, learnings: any): string;
}
```

**Architect Agent with Letta:**
```typescript
// services/agents/src/ArchitectAgent.ts
export class ArchitectAgent extends LettaEnhancedAgent {
  protected getPersona(): string {
    return `You are a senior software architect specializing in modern web applications.

Your expertise:
- System design and architecture patterns
- Technology stack selection
- Scalability and performance optimization
- Database design
- API design

Your approach:
- Always consider team's past successes
- Prefer proven patterns over experimental ones
- Balance innovation with pragmatism
- Document decisions clearly

You learn from every project and continuously improve your recommendations based on what works for this team.`;
  }

  async designSystem(feature: Feature, project: Project): Promise<SystemDesign> {
    // Use Letta-enhanced execution
    return await this.executeWithMemory(
      {
        type: 'system_design',
        description: feature.description,
        projectType: project.type
      },
      {
        teamId: project.team_id,
        previousProjects: await this.getTeamProjects(project.team_id)
      }
    );
  }

  protected async execute(task: any, context: any): Promise<any> {
    // Send to Letta for processing with memory
    const response = await this.letta.sendMessage(
      this.lettaAgentId,
      `Design a system architecture for: ${task.description}

Project type: ${task.projectType}
Team's previous projects: ${JSON.stringify(context.previousProjects)}
Relevant past experiences: ${JSON.stringify(context.memory.archival)}

Provide a complete system design including:
1. Architecture pattern
2. Technology stack
3. Database design
4. API design
5. Scalability considerations

Format as JSON.`
    );

    return JSON.parse(response.messages[0].content);
  }

  protected updatePersona(currentPersona: string, learnings: any): string {
    return `${currentPersona}

Recent learnings:
- ${learnings.join('\n- ')}`;
  }
}
```

**Acceptance Criteria:**
- All agents have Letta integration
- Agents loading memory before tasks
- Agents saving learnings after tasks
- Memory recall working correctly

---

## Week 2: Team Memory System

### 2.1 Collective Team Memory

**Tasks:**
- [x] Create team memory aggregation
- [x] Implement cross-agent memory sharing
- [x] Build team knowledge base
- [x] Add memory search and retrieval

**Deliverables:**

**Team Memory Manager:**
```typescript
// services/memory/src/TeamMemoryManager.ts
export class TeamMemoryManager {
  private db: Pool;
  private letta: LettaClient;
  private qdrant: QdrantClient;

  async storeTeamMemory(memory: TeamMemory): Promise<void> {
    // 1. Store in PostgreSQL
    await this.db.query(`
      INSERT INTO team_memory (
        team_id, memory_type, title, description,
        context, letta_memory_id, tags
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [
      memory.teamId,
      memory.type,
      memory.title,
      memory.description,
      memory.context,
      memory.lettaMemoryId,
      memory.tags
    ]);

    // 2. Generate embeddings and store in Qdrant
    const embedding = await this.generateEmbedding(memory.description);
    await this.qdrant.upsert('team_memories', {
      id: memory.id,
      vector: embedding,
      payload: {
        teamId: memory.teamId,
        type: memory.type,
        title: memory.title,
        description: memory.description,
        tags: memory.tags
      }
    });

    // 3. Archive in Letta for all team agents
    const teamAgents = await this.getTeamAgents(memory.teamId);
    for (const agent of teamAgents) {
      await this.letta.archiveMemory(agent.letta_agent_id, JSON.stringify(memory));
    }
  }

  async searchTeamMemory(teamId: string, query: string, limit: number = 10): Promise<TeamMemory[]> {
    // 1. Generate query embedding
    const queryEmbedding = await this.generateEmbedding(query);

    // 2. Search in Qdrant
    const results = await this.qdrant.search('team_memories', {
      vector: queryEmbedding,
      filter: { teamId },
      limit
    });

    // 3. Fetch full details from PostgreSQL
    const memoryIds = results.map(r => r.id);
    const memories = await this.db.query(`
      SELECT * FROM team_memory WHERE id = ANY($1)
    `, [memoryIds]);

    return memories.rows;
  }

  async getTeamPatterns(teamId: string, category?: string): Promise<Pattern[]> {
    let sql = 'SELECT * FROM patterns WHERE team_id = $1';
    const params: any[] = [teamId];

    if (category) {
      sql += ' AND category = $2';
      params.push(category);
    }

    sql += ' ORDER BY times_used DESC, success_rate DESC';

    const result = await this.db.query(sql, params);
    return result.rows;
  }

  async shareMemoryAcrossTeam(memory: TeamMemory): Promise<void> {
    // Broadcast memory to all team members
    const teamMembers = await this.getTeamMembers(memory.teamId);

    for (const member of teamMembers) {
      // Send notification
      await this.notifyMember(member.user_id, {
        type: 'new_team_memory',
        title: `New team learning: ${memory.title}`,
        description: memory.description,
        memoryId: memory.id
      });
    }
  }

  private async generateEmbedding(text: string): Promise<number[]> {
    // Use OpenAI embeddings (or local model)
    const response = await fetch('http://localhost:3001/api/embeddings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    });

    const data = await response.json();
    return data.embedding;
  }
}
```

**Acceptance Criteria:**
- Team memory stored and searchable
- Embeddings generated for semantic search
- Memory shared across all team agents
- Notifications sent to team members

---

## Week 3: Knowledge Graph Implementation

### 3.1 Neo4j Knowledge Graph

**Tasks:**
- [ ] Design knowledge graph schema
- [ ] Implement graph population from projects
- [ ] Build relationship inference engine
- [ ] Create graph query API

**Deliverables:**

**Knowledge Graph Manager:**
```typescript
// services/knowledge-graph/src/KnowledgeGraphManager.ts
import neo4j from 'neo4j-driver';

export class KnowledgeGraphManager {
  private driver: neo4j.Driver;
  private db: Pool;

  constructor() {
    this.driver = neo4j.driver(
      'bolt://localhost:7687',
      neo4j.auth.basic('neo4j', process.env.NEO4J_PASSWORD)
    );
  }

  async addTechnology(tech: Technology): Promise<void> {
    const session = this.driver.session();
    try {
      await session.run(`
        MERGE (t:Technology {name: $name})
        SET t.category = $category,
            t.description = $description,
            t.popularity = $popularity,
            t.lastUsed = datetime()
      `, {
        name: tech.name,
        category: tech.category,
        description: tech.description,
        popularity: tech.popularity || 0.5
      });
    } finally {
      await session.close();
    }
  }

  async addRelationship(from: string, to: string, type: string, strength: number = 1.0): Promise<void> {
    const session = this.driver.session();
    try {
      await session.run(`
        MATCH (a:Technology {name: $from})
        MATCH (b:Technology {name: $to})
        MERGE (a)-[r:${type}]->(b)
        SET r.strength = $strength,
            r.timesObserved = COALESCE(r.timesObserved, 0) + 1,
            r.lastObserved = datetime()
      `, { from, to, strength });
    } finally {
      await session.close();
    }
  }

  async inferRelationships(teamId: string): Promise<void> {
    // Get all team projects
    const projects = await this.db.query(`
      SELECT * FROM projects WHERE team_id = $1 AND status = 'completed'
    `, [teamId]);

    for (const project of projects.rows) {
      // Get decisions for this project
      const decisions = await this.db.query(`
        SELECT * FROM decisions WHERE project_id = $1
      `, [project.id]);

      // Extract technologies used
      const technologies = this.extractTechnologies(decisions.rows);

      // Add to graph
      for (const tech of technologies) {
        await this.addTechnology(tech);
      }

      // Infer relationships (technologies used together)
      for (let i = 0; i < technologies.length; i++) {
        for (let j = i + 1; j < technologies.length; j++) {
          await this.addRelationship(
            technologies[i].name,
            technologies[j].name,
            'WORKS_WITH',
            0.8
          );
        }
      }
    }
  }

  async recommendTechStack(projectType: string, teamId: string): Promise<TechStack> {
    const session = this.driver.session();
    try {
      // Find most successful tech combinations for this team
      const result = await session.run(`
        MATCH (p:Project {teamId: $teamId, type: $projectType, status: 'completed'})
        MATCH (p)-[:USES]->(t:Technology)
        WITH t, COUNT(p) as usage, AVG(p.successRating) as avgRating
        WHERE usage >= 2
        RETURN t.name as technology,
               t.category as category,
               usage,
               avgRating
        ORDER BY avgRating DESC, usage DESC
      `, { teamId, projectType });

      // Group by category
      const stack: TechStack = {
        framework: null,
        database: null,
        orm: null,
        styling: null,
        authentication: null
      };

      for (const record of result.records) {
        const category = record.get('category');
        const tech = record.get('technology');
        
        if (!stack[category]) {
          stack[category] = tech;
        }
      }

      return stack;
    } finally {
      await session.close();
    }
  }

  async visualizeKnowledgeGraph(teamId: string): Promise<GraphVisualization> {
    const session = this.driver.session();
    try {
      const result = await session.run(`
        MATCH (t:Technology)
        OPTIONAL MATCH (t)-[r]->(other:Technology)
        WHERE EXISTS((t)<-[:USES]-(:Project {teamId: $teamId}))
        RETURN t, collect({rel: r, other: other}) as relationships
      `, { teamId });

      const nodes = [];
      const edges = [];

      for (const record of result.records) {
        const tech = record.get('t').properties;
        nodes.push({
          id: tech.name,
          label: tech.name,
          category: tech.category,
          popularity: tech.popularity
        });

        const rels = record.get('relationships');
        for (const rel of rels) {
          if (rel.rel) {
            edges.push({
              from: tech.name,
              to: rel.other.properties.name,
              type: rel.rel.type,
              strength: rel.rel.properties.strength
            });
          }
        }
      }

      return { nodes, edges };
    } finally {
      await session.close();
    }
  }

  private extractTechnologies(decisions: Decision[]): Technology[] {
    const technologies: Technology[] = [];
    
    for (const decision of decisions) {
      const tech = this.parseTechnology(decision);
      if (tech) technologies.push(tech);
    }

    return technologies;
  }

  private parseTechnology(decision: Decision): Technology | null {
    // Extract technology from decision
    const techMap = {
      'Next.js': { category: 'framework', description: 'React framework' },
      'React': { category: 'framework', description: 'UI library' },
      'PostgreSQL': { category: 'database', description: 'Relational database' },
      'Prisma': { category: 'orm', description: 'TypeScript ORM' },
      'Tailwind CSS': { category: 'styling', description: 'Utility-first CSS' },
      'NextAuth.js': { category: 'authentication', description: 'Auth for Next.js' }
    };

    for (const [name, info] of Object.entries(techMap)) {
      if (decision.decision.includes(name)) {
        return { name, ...info };
      }
    }

    return null;
  }
}
```

**Acceptance Criteria:**
- Knowledge graph populated from projects
- Relationships inferred correctly
- Tech stack recommendations working
- Graph visualization available

---

## Week 4: Pattern Extraction & Predictive Context

### 4.1 Automated Pattern Extraction

**Tasks:**
- [ ] Build pattern extraction engine
- [ ] Identify successful patterns automatically
- [ ] Create pattern templates
- [ ] Enable one-click pattern application

**Deliverables:**

**Pattern Extractor:**
```typescript
// services/patterns/src/PatternExtractor.ts
export class PatternExtractor {
  private db: Pool;
  private letta: LettaClient;
  private knowledgeGraph: KnowledgeGraphManager;

  async extractPatterns(teamId: string): Promise<Pattern[]> {
    // 1. Get all successful projects
    const projects = await this.db.query(`
      SELECT * FROM projects
      WHERE team_id = $1
        AND status = 'completed'
        AND features_completed >= features_total * 0.8
      ORDER BY completed_at DESC
      LIMIT 20
    `, [teamId]);

    const patterns: Pattern[] = [];

    // 2. Analyze each project for patterns
    for (const project of projects.rows) {
      const projectPatterns = await this.analyzeProject(project);
      patterns.push(...projectPatterns);
    }

    // 3. Group similar patterns
    const groupedPatterns = this.groupSimilarPatterns(patterns);

    // 4. Store in database
    for (const pattern of groupedPatterns) {
      await this.storePattern(pattern);
    }

    return groupedPatterns;
  }

  private async analyzeProject(project: Project): Promise<Pattern[]> {
    const patterns: Pattern[] = [];

    // Get all decisions for this project
    const decisions = await this.db.query(`
      SELECT * FROM decisions WHERE project_id = $1
    `, [project.id]);

    // Get all files
    const files = await this.getProjectFiles(project.id);

    // Extract common patterns
    const authPattern = this.extractAuthPattern(decisions.rows, files);
    if (authPattern) patterns.push(authPattern);

    const apiPattern = this.extractAPIPattern(decisions.rows, files);
    if (apiPattern) patterns.push(apiPattern);

    const dbPattern = this.extractDatabasePattern(decisions.rows, files);
    if (dbPattern) patterns.push(dbPattern);

    return patterns;
  }

  private extractAuthPattern(decisions: Decision[], files: any[]): Pattern | null {
    // Find auth-related decisions
    const authDecisions = decisions.filter(d =>
      d.type === 'authentication' || d.decision.toLowerCase().includes('auth')
    );

    if (authDecisions.length === 0) return null;

    // Find auth-related files
    const authFiles = files.filter(f =>
      f.path.includes('auth') || f.path.includes('login')
    );

    return {
      name: 'Authentication Pattern',
      category: 'auth',
      description: `${authDecisions[0].decision} implementation`,
      files: authFiles.map(f => ({ path: f.path, content: f.content })),
      dependencies: this.extractDependencies(authFiles),
      mcpsUsed: ['auth-provider'],
      successRate: 0.95
    };
  }

  private groupSimilarPatterns(patterns: Pattern[]): Pattern[] {
    // Group patterns by category and similarity
    const grouped = new Map<string, Pattern[]>();

    for (const pattern of patterns) {
      const key = `${pattern.category}-${pattern.name}`;
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)!.push(pattern);
    }

    // Merge similar patterns
    const merged: Pattern[] = [];
    for (const [key, group] of grouped) {
      if (group.length === 1) {
        merged.push(group[0]);
      } else {
        merged.push(this.mergePatterns(group));
      }
    }

    return merged;
  }

  private mergePatterns(patterns: Pattern[]): Pattern {
    // Merge multiple similar patterns into one
    return {
      name: patterns[0].name,
      category: patterns[0].category,
      description: patterns[0].description,
      files: this.mergeFiles(patterns.map(p => p.files)),
      dependencies: this.mergeDependencies(patterns.map(p => p.dependencies)),
      mcpsUsed: [...new Set(patterns.flatMap(p => p.mcpsUsed))],
      timesUsed: patterns.length,
      successRate: patterns.reduce((sum, p) => sum + (p.successRate || 0), 0) / patterns.length
    };
  }

  private async storePattern(pattern: Pattern): Promise<void> {
    await this.db.query(`
      INSERT INTO patterns (
        team_id, name, category, description,
        files, dependencies, mcps_used,
        times_used, success_rate
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT (team_id, name) DO UPDATE
      SET times_used = patterns.times_used + 1,
          success_rate = (patterns.success_rate + $9) / 2
    `, [
      pattern.teamId,
      pattern.name,
      pattern.category,
      pattern.description,
      JSON.stringify(pattern.files),
      JSON.stringify(pattern.dependencies),
      pattern.mcpsUsed,
      pattern.timesUsed || 1,
      pattern.successRate || 0.5
    ]);
  }
}
```

**Acceptance Criteria:**
- Patterns extracted from successful projects
- Similar patterns grouped correctly
- Patterns stored with metadata
- One-click pattern application working

---

### 4.2 Predictive Context Loading

**Tasks:**
- [ ] Build predictive engine
- [ ] Implement context pre-loading
- [ ] Add smart suggestions
- [ ] Create context UI panel

**Deliverables:**

**Predictive Context Engine:**
```typescript
// services/context/src/PredictiveContextEngine.ts
export class PredictiveContextEngine {
  private db: Pool;
  private letta: LettaClient;
  private knowledgeGraph: KnowledgeGraphManager;
  private teamMemory: TeamMemoryManager;

  async predictContext(
    teamId: string,
    projectType: string,
    featureDescription: string
  ): Promise<PredictedContext> {
    // 1. Query Letta for team's memory
    const teamMemory = await this.teamMemory.searchTeamMemory(
      teamId,
      `${projectType} ${featureDescription}`,
      10
    );

    // 2. Query knowledge graph for tech recommendations
    const techStack = await this.knowledgeGraph.recommendTechStack(
      projectType,
      teamId
    );

    // 3. Find similar past projects
    const similarProjects = await this.findSimilarProjects(
      teamId,
      projectType,
      featureDescription
    );

    // 4. Get relevant patterns
    const patterns = await this.db.query(`
      SELECT * FROM patterns
      WHERE team_id = $1
        AND category = ANY($2)
      ORDER BY success_rate DESC, times_used DESC
      LIMIT 5
    `, [teamId, this.inferCategories(featureDescription)]);

    // 5. Predict what they'll need
    const predictions = {
      techStack,
      patterns: patterns.rows,
      similarProjects: similarProjects.map(p => ({
        id: p.id,
        name: p.name,
        similarity: p.similarity,
        successRate: p.features_completed / p.features_total
      })),
      suggestedModules: await this.suggestReusableModules(teamId, featureDescription),
      commonPitfalls: await this.predictPitfalls(teamId, projectType),
      estimatedTime: this.estimateTime(similarProjects, featureDescription)
    };

    return predictions;
  }

  private async findSimilarProjects(
    teamId: string,
    projectType: string,
    description: string
  ): Promise<any[]> {
    // Generate embedding for description
    const embedding = await this.generateEmbedding(description);

    // Search in Qdrant
    const results = await qdrant.search('projects', {
      vector: embedding,
      filter: { teamId, type: projectType, status: 'completed' },
      limit: 5
    });

    return results;
  }

  private async suggestReusableModules(
    teamId: string,
    description: string
  ): Promise<ReusableModule[]> {
    const modules = await this.db.query(`
      SELECT * FROM reusable_modules
      WHERE team_id = $1
        AND usage_count > 0
      ORDER BY usage_count DESC
      LIMIT 10
    `, [teamId]);

    // Filter relevant modules using embeddings
    const relevant = [];
    for (const module of modules.rows) {
      const similarity = await this.calculateSimilarity(
        description,
        module.description
      );
      if (similarity > 0.7) {
        relevant.push({ ...module, similarity });
      }
    }

    return relevant;
  }

  private async predictPitfalls(
    teamId: string,
    projectType: string
  ): Promise<Pitfall[]> {
    // Query team memory for past mistakes
    const mistakes = await this.teamMemory.searchTeamMemory(
      teamId,
      `mistakes errors problems ${projectType}`,
      5
    );

    return mistakes.map(m => ({
      description: m.description,
      solution: m.context.solution,
      frequency: m.times_referenced
    }));
  }

  private estimateTime(similarProjects: any[], description: string): number {
    if (similarProjects.length === 0) return 120; // Default 2 hours

    const avgTime = similarProjects.reduce((sum, p) => {
      return sum + (p.completed_at - p.created_at) / p.features_total;
    }, 0) / similarProjects.length;

    return Math.round(avgTime / 60000); // Convert to minutes
  }
}
```

**Acceptance Criteria:**
- Context predicted before starting work
- Tech stack recommendations accurate
- Patterns suggested correctly
- Time estimates reasonable

---

## Week 5: Collective Memory UI

### 5.1 Memory & Context UI Panel

**Tasks:**
- [ ] Create Letta Context panel
- [ ] Build knowledge graph visualization
- [ ] Add pattern browser
- [ ] Implement memory search

**Deliverables:**

**Letta Context Panel:**
```typescript
// components/LettaContextPanel.tsx
export function LettaContextPanel({ projectId }: { projectId: string }) {
  const { context, isLoading } = usePredictedContext(projectId);
  const { patterns } = usePatterns(context?.teamId);
  const { graph } = useKnowledgeGraph(context?.teamId);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <h3 className="text-lg font-bold">🧠 Letta Context</h3>
          <p className="text-sm text-muted-foreground">
            AI-powered suggestions based on team memory
          </p>
        </CardHeader>
        <CardContent>
          {/* Recommended Tech Stack */}
          <div className="mb-4">
            <Label>Recommended Tech Stack</Label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {Object.entries(context?.techStack || {}).map(([key, value]) => (
                <div key={key} className="flex items-center gap-2">
                  <Badge variant="outline">{key}</Badge>
                  <span className="text-sm">{value}</span>
                </div>
              ))}
            </div>
            <Button
              size="sm"
              className="mt-2"
              onClick={() => applyTechStack(context?.techStack)}
            >
              Use This Stack
            </Button>
          </div>

          {/* Suggested Patterns */}
          <div className="mb-4">
            <Label>Suggested Patterns</Label>
            <div className="space-y-2 mt-2">
              {patterns?.slice(0, 3).map(pattern => (
                <div key={pattern.id} className="border rounded p-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{pattern.name}</span>
                    <Badge>{(pattern.success_rate * 100).toFixed(0)}% success</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {pattern.description}
                  </p>
                  <div className="flex gap-2 mt-2">
                    <Button size="sm" onClick={() => applyPattern(pattern)}>
                      Apply
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => viewPattern(pattern)}>
                      View Code
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Similar Projects */}
          <div className="mb-4">
            <Label>Similar Past Projects</Label>
            <div className="space-y-2 mt-2">
              {context?.similarProjects?.map(project => (
                <div key={project.id} className="flex items-center justify-between text-sm">
                  <span>{project.name}</span>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{(project.similarity * 100).toFixed(0)}% similar</Badge>
                    <Button size="sm" variant="ghost" onClick={() => viewProject(project.id)}>
                      View
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Common Pitfalls */}
          <div>
            <Label>⚠️ Common Pitfalls to Avoid</Label>
            <ul className="list-disc list-inside text-sm space-y-1 mt-2">
              {context?.commonPitfalls?.map((pitfall, i) => (
                <li key={i} className="text-muted-foreground">
                  {pitfall.description}
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Knowledge Graph Visualization */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-bold">Knowledge Graph</h3>
        </CardHeader>
        <CardContent>
          <KnowledgeGraphViz data={graph} />
        </CardContent>
      </Card>
    </div>
  );
}
```

**Acceptance Criteria:**
- Context panel showing predictions
- Patterns browsable and applicable
- Knowledge graph visualized
- Memory search functional

---

## Deliverables Summary

- ✅ Letta installed and configured
- ✅ All agents integrated with Letta
- ✅ Team memory system operational
- ✅ Knowledge graph populated
- ✅ Pattern extraction automated
- ✅ Predictive context loading working
- ✅ Collective memory UI complete

---

## Success Metrics

- [ ] Letta storing 100% of agent interactions
- [ ] Knowledge graph with 100+ technology nodes
- [ ] 20+ patterns extracted automatically
- [ ] Context predictions 80%+ accurate
- [ ] Team memory searchable and useful
- [ ] Agents learning and improving over time

---

## Next Phase

Once Phase 4 is complete, proceed to [Phase 5: Collaboration & Social Features](./ocean5.md)

---

**Phase Owner:** [Name]  
**Start Date:** [Date]  
**Target Completion:** [Date + 5 weeks]  
**Status:** Not Started
