#!/bin/bash

# Log initial architecture decisions

PGPASSWORD='OceanSecure2026!DB' psql -h localhost -U ocean_user -d ocean_db << 'SQL'

-- Ensure decisions table exists
CREATE TABLE IF NOT EXISTS decisions (
  id SERIAL PRIMARY KEY,
  type VARCHAR(50) NOT NULL,
  decision TEXT NOT NULL,
  reasoning TEXT,
  impact VARCHAR(20),
  made_by VARCHAR(100) DEFAULT 'team',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Log initial decisions
INSERT INTO decisions (type, decision, reasoning, impact, made_by) VALUES
('infrastructure', 'Docker Compose for service orchestration', 'Simple, well-documented, perfect for our multi-service setup. Allows easy management of Neo4j, Qdrant, and MinIO containers with persistent volumes and network isolation.', 'high', 'team'),
('database', 'PostgreSQL as primary database', 'ACID compliance, excellent tooling, team expertise, robust ecosystem. Perfect for structured data and complex queries.', 'critical', 'team'),
('database', 'Neo4j for knowledge graph', 'Purpose-built for graph data, excellent Cypher query language, perfect for storing team patterns and technology relationships.', 'critical', 'team'),
('database', 'Qdrant for vector embeddings', 'Fast vector similarity search, easy to use, perfect for semantic search and pattern matching.', 'high', 'team'),
('infrastructure', 'MinIO for object storage', 'S3-compatible, self-hosted, perfect for storing generated code, session recordings, and media files.', 'medium', 'team'),
('architecture', 'MCP server for status monitoring', 'Enables AI-assisted monitoring and decision tracking. Integrates with Windsurf and Claude Desktop for natural language queries.', 'high', 'team'),
('deployment', 'Git-based deployment workflow', 'Every change documented, easy rollback, complete audit trail. GitHub as single source of truth.', 'critical', 'team'),
('architecture', 'Database-first approach', 'All application state in database enables easy backup/restore, clear data model, and reliable state management.', 'critical', 'team');

SELECT 'Logged ' || COUNT(*) || ' initial decisions' as result FROM decisions;

SQL

echo "✅ Initial decisions logged to database"
