// Neo4j Knowledge Graph Setup for OCEAN Platform
// Run date: 2026-01-11

// Create constraints for uniqueness
CREATE CONSTRAINT technology_name IF NOT EXISTS
FOR (t:Technology) REQUIRE t.name IS UNIQUE;

CREATE CONSTRAINT pattern_name IF NOT EXISTS
FOR (p:Pattern) REQUIRE p.name IS UNIQUE;

CREATE CONSTRAINT developer_id IF NOT EXISTS
FOR (d:Developer) REQUIRE d.id IS UNIQUE;

CREATE CONSTRAINT project_id IF NOT EXISTS
FOR (pr:Project) REQUIRE pr.id IS UNIQUE;

// Create indexes for performance
CREATE INDEX technology_category IF NOT EXISTS
FOR (t:Technology) ON (t.category);

CREATE INDEX pattern_category IF NOT EXISTS
FOR (p:Pattern) ON (p.category);

CREATE INDEX developer_name IF NOT EXISTS
FOR (d:Developer) ON (d.name);

CREATE INDEX project_name IF NOT EXISTS
FOR (pr:Project) ON (pr.name);

// Initial technology nodes - Frontend
CREATE (react:Technology {
  name: 'React',
  category: 'frontend',
  description: 'JavaScript library for building user interfaces',
  popularity: 0.95,
  created_at: datetime()
});

CREATE (nextjs:Technology {
  name: 'Next.js',
  category: 'framework',
  description: 'React framework for production',
  popularity: 0.90,
  created_at: datetime()
});

CREATE (tailwind:Technology {
  name: 'TailwindCSS',
  category: 'styling',
  description: 'Utility-first CSS framework',
  popularity: 0.88,
  created_at: datetime()
});

CREATE (shadcn:Technology {
  name: 'shadcn/ui',
  category: 'components',
  description: 'Re-usable components built with Radix UI and Tailwind',
  popularity: 0.85,
  created_at: datetime()
});

// Backend technologies
CREATE (nodejs:Technology {
  name: 'Node.js',
  category: 'runtime',
  description: 'JavaScript runtime built on Chrome V8',
  popularity: 0.92,
  created_at: datetime()
});

CREATE (fastapi:Technology {
  name: 'FastAPI',
  category: 'framework',
  description: 'Modern Python web framework for building APIs',
  popularity: 0.87,
  created_at: datetime()
});

CREATE (express:Technology {
  name: 'Express',
  category: 'framework',
  description: 'Fast, unopinionated web framework for Node.js',
  popularity: 0.90,
  created_at: datetime()
});

// Database technologies
CREATE (postgres:Technology {
  name: 'PostgreSQL',
  category: 'database',
  description: 'Advanced open source relational database',
  popularity: 0.93,
  created_at: datetime()
});

CREATE (neo4j:Technology {
  name: 'Neo4j',
  category: 'database',
  description: 'Graph database for connected data',
  popularity: 0.82,
  created_at: datetime()
});

CREATE (qdrant:Technology {
  name: 'Qdrant',
  category: 'database',
  description: 'Vector database for AI applications',
  popularity: 0.78,
  created_at: datetime()
});

CREATE (redis:Technology {
  name: 'Redis',
  category: 'database',
  description: 'In-memory data structure store',
  popularity: 0.91,
  created_at: datetime()
});

// AI/ML technologies
CREATE (claude:Technology {
  name: 'Claude',
  category: 'ai',
  description: 'Anthropic AI assistant',
  popularity: 0.89,
  created_at: datetime()
});

CREATE (letta:Technology {
  name: 'Letta',
  category: 'ai',
  description: 'Memory-first AI agent framework',
  popularity: 0.75,
  created_at: datetime()
});

CREATE (autocoder:Technology {
  name: 'AutoCoder',
  category: 'ai',
  description: 'Autonomous code generation system',
  popularity: 0.72,
  created_at: datetime()
});

// Create relationships between technologies
MATCH (nextjs:Technology {name: 'Next.js'})
MATCH (react:Technology {name: 'React'})
CREATE (nextjs)-[:USES]->(react);

MATCH (nextjs:Technology {name: 'Next.js'})
MATCH (nodejs:Technology {name: 'Node.js'})
CREATE (nextjs)-[:RUNS_ON]->(nodejs);

MATCH (nextjs:Technology {name: 'Next.js'})
MATCH (tailwind:Technology {name: 'TailwindCSS'})
CREATE (nextjs)-[:WORKS_WITH]->(tailwind);

MATCH (shadcn:Technology {name: 'shadcn/ui'})
MATCH (react:Technology {name: 'React'})
CREATE (shadcn)-[:BUILT_WITH]->(react);

MATCH (shadcn:Technology {name: 'shadcn/ui'})
MATCH (tailwind:Technology {name: 'TailwindCSS'})
CREATE (shadcn)-[:STYLED_WITH]->(tailwind);

MATCH (express:Technology {name: 'Express'})
MATCH (nodejs:Technology {name: 'Node.js'})
CREATE (express)-[:RUNS_ON]->(nodejs);

MATCH (fastapi:Technology {name: 'FastAPI'})
MATCH (postgres:Technology {name: 'PostgreSQL'})
CREATE (fastapi)-[:WORKS_WITH]->(postgres);

// Create common development patterns
CREATE (apiProxy:Pattern {
  name: 'API Proxy Pattern',
  category: 'architecture',
  description: 'Proxy layer to hide API keys and track usage',
  use_cases: ['billing_abstraction', 'rate_limiting', 'usage_tracking'],
  created_at: datetime()
});

CREATE (multiAgent:Pattern {
  name: 'Multi-Agent System',
  category: 'ai',
  description: 'Multiple specialized AI agents working together',
  use_cases: ['task_delegation', 'specialized_expertise', 'parallel_processing'],
  created_at: datetime()
});

CREATE (knowledgeGraph:Pattern {
  name: 'Knowledge Graph',
  category: 'data',
  description: 'Graph-based knowledge representation',
  use_cases: ['relationship_mapping', 'pattern_recognition', 'team_learning'],
  created_at: datetime()
});

CREATE (rbac:Pattern {
  name: 'Role-Based Access Control',
  category: 'security',
  description: 'Access control based on user roles',
  use_cases: ['authorization', 'permission_management', 'security'],
  created_at: datetime()
});

// Link patterns to technologies
MATCH (apiProxy:Pattern {name: 'API Proxy Pattern'})
MATCH (express:Technology {name: 'Express'})
CREATE (apiProxy)-[:IMPLEMENTED_WITH]->(express);

MATCH (multiAgent:Pattern {name: 'Multi-Agent System'})
MATCH (letta:Technology {name: 'Letta'})
CREATE (multiAgent)-[:USES]->(letta);

MATCH (knowledgeGraph:Pattern {name: 'Knowledge Graph'})
MATCH (neo4j:Technology {name: 'Neo4j'})
CREATE (knowledgeGraph)-[:STORED_IN]->(neo4j);

MATCH (rbac:Pattern {name: 'Role-Based Access Control'})
MATCH (nextjs:Technology {name: 'Next.js'})
CREATE (rbac)-[:IMPLEMENTED_IN]->(nextjs);
