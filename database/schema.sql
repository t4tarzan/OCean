-- ============================================================================
-- OCEAN Platform - Complete Database Schema
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- USERS & TEAMS
-- ============================================================================

CREATE TABLE platform_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  password_hash TEXT NOT NULL,
  role VARCHAR(50) DEFAULT 'user', -- 'user' | 'power_user' | 'admin'
  status VARCHAR(50) DEFAULT 'active', -- 'active' | 'suspended' | 'inactive'
  
  -- Usage tracking
  tokens_used BIGINT DEFAULT 0,
  projects_created INT DEFAULT 0,
  last_active TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE team_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  user_id UUID REFERENCES platform_users(id) ON DELETE CASCADE,
  role VARCHAR(50) DEFAULT 'junior', -- 'junior' | 'senior' | 'lead' | 'admin'
  
  -- Expertise
  expertise TEXT[],
  preferred_stack JSONB,
  
  joined_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(team_id, user_id)
);

-- ============================================================================
-- OASF-STYLE AGENT REGISTRY
-- ============================================================================

CREATE TABLE agents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  type VARCHAR(100) NOT NULL, -- 'architect' | 'database' | 'api' | 'frontend' | 'qa' | 'security' | 'integrator'
  model VARCHAR(100), -- 'claude-opus' | 'claude-sonnet' | 'claude-haiku'
  status VARCHAR(50) DEFAULT 'idle', -- 'idle' | 'working' | 'waiting' | 'error'
  
  -- Capabilities
  expertise TEXT[],
  tools TEXT[],
  mcps TEXT[],
  
  -- Configuration
  config JSONB,
  
  -- Metrics
  tasks_completed INT DEFAULT 0,
  success_rate DECIMAL(3,2),
  avg_response_time INT, -- milliseconds
  
  -- Letta integration
  letta_agent_id VARCHAR(255),
  
  created_at TIMESTAMP DEFAULT NOW(),
  last_active TIMESTAMP
);

CREATE TABLE agent_capabilities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
  capability_type VARCHAR(100), -- 'tool' | 'mcp' | 'skill'
  capability_name VARCHAR(255),
  description TEXT,
  parameters JSONB,
  enabled BOOLEAN DEFAULT true
);

-- ============================================================================
-- INTER-AGENT MESSAGING
-- ============================================================================

CREATE TABLE agent_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  from_agent_id UUID REFERENCES agents(id),
  to_agent_id UUID REFERENCES agents(id),
  message_type VARCHAR(50), -- 'request' | 'response' | 'notification' | 'error'
  
  -- Message content
  subject VARCHAR(255),
  body TEXT,
  attachments JSONB,
  
  -- Context
  project_id UUID,
  feature_id UUID,
  
  -- Status
  status VARCHAR(50) DEFAULT 'sent', -- 'sent' | 'delivered' | 'read' | 'processed'
  priority INT DEFAULT 5, -- 1-10
  
  -- Timestamps
  sent_at TIMESTAMP DEFAULT NOW(),
  delivered_at TIMESTAMP,
  read_at TIMESTAMP,
  processed_at TIMESTAMP
);

CREATE TABLE agent_conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID,
  participants UUID[],
  topic VARCHAR(255),
  started_at TIMESTAMP DEFAULT NOW(),
  ended_at TIMESTAMP,
  message_count INT DEFAULT 0,
  status VARCHAR(50) DEFAULT 'active' -- 'active' | 'completed' | 'archived'
);

-- ============================================================================
-- PROJECTS & FEATURES
-- ============================================================================

CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  type VARCHAR(100), -- 'saas' | 'ecommerce' | 'analytics' | etc.
  
  -- Git integration
  git_repo TEXT,
  main_branch VARCHAR(255) DEFAULT 'main',
  
  -- AutoCoder integration
  autocoder_path TEXT,
  autocoder_project_id VARCHAR(255),
  
  -- Status
  status VARCHAR(50) DEFAULT 'active', -- 'active' | 'completed' | 'archived'
  
  -- Metrics
  features_total INT DEFAULT 0,
  features_completed INT DEFAULT 0,
  
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);

CREATE TABLE features (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  
  -- From AutoCoder
  autocoder_feature_id VARCHAR(255),
  category VARCHAR(50), -- 'functional' | 'style'
  title VARCHAR(255),
  description TEXT,
  test_steps JSONB,
  priority INT,
  
  -- Team collaboration
  assigned_to UUID REFERENCES team_members(id),
  assigned_agent_id UUID REFERENCES agents(id),
  
  -- Status
  status VARCHAR(50) DEFAULT 'pending', -- 'pending' | 'assigned' | 'in_progress' | 'review' | 'done'
  autocoder_passes BOOLEAN DEFAULT false,
  
  -- Git integration
  git_branch VARCHAR(255),
  pr_url TEXT,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  
  -- Metrics
  time_to_complete INT, -- minutes
  agent_iterations INT DEFAULT 0
);

-- ============================================================================
-- DECISION LOGGING
-- ============================================================================

CREATE TABLE decisions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  feature_id UUID REFERENCES features(id),
  
  -- Decision details
  type VARCHAR(50), -- 'database' | 'api' | 'framework' | 'dependency' | 'architecture'
  decision TEXT NOT NULL,
  reasoning TEXT,
  alternatives_considered JSONB,
  
  -- Who made it
  made_by VARCHAR(50), -- 'autocoder' | 'agent' | 'developer' | 'letta'
  made_by_id UUID,
  
  -- Context
  related_files TEXT[],
  related_decisions UUID[],
  
  -- Impact
  impact_level VARCHAR(50), -- 'low' | 'medium' | 'high' | 'critical'
  affected_components TEXT[],
  
  -- Validation
  validated BOOLEAN DEFAULT false,
  validation_notes TEXT,
  
  timestamp TIMESTAMP DEFAULT NOW()
);

CREATE TABLE decision_map_nodes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  decision_id UUID REFERENCES decisions(id),
  
  -- Visual representation
  node_type VARCHAR(50),
  label VARCHAR(255),
  description TEXT,
  
  -- Position
  x_position INT,
  y_position INT,
  layer INT,
  
  -- Connections
  connected_to UUID[],
  
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- LETTA & TEAM MEMORY
-- ============================================================================

CREATE TABLE team_memory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  
  -- Memory type
  memory_type VARCHAR(50), -- 'pattern' | 'insight' | 'mistake' | 'optimization'
  
  -- Content
  title VARCHAR(255),
  description TEXT,
  context JSONB,
  
  -- Letta integration
  letta_memory_id VARCHAR(255),
  
  -- Metadata
  created_by UUID REFERENCES team_members(id),
  related_projects UUID[],
  tags TEXT[],
  
  -- Usage tracking
  times_referenced INT DEFAULT 0,
  success_rate DECIMAL(3,2),
  
  created_at TIMESTAMP DEFAULT NOW(),
  last_used TIMESTAMP
);

CREATE TABLE patterns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  
  -- Pattern details
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  
  -- Pattern content
  files JSONB,
  dependencies JSONB,
  mcps_used TEXT[],
  
  -- Source
  extracted_from_project_id UUID REFERENCES projects(id),
  created_by UUID REFERENCES team_members(id),
  
  -- Metrics
  times_used INT DEFAULT 0,
  success_rate DECIMAL(3,2),
  avg_time_to_implement INT,
  
  -- Social
  reactions JSONB,
  
  created_at TIMESTAMP DEFAULT NOW(),
  last_used TIMESTAMP,
  
  UNIQUE(team_id, name)
);

CREATE TABLE pattern_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pattern_id UUID REFERENCES patterns(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  used_by UUID REFERENCES team_members(id),
  
  -- Outcome
  success BOOLEAN,
  time_to_implement INT,
  notes TEXT,
  
  used_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- KNOWLEDGE GRAPH (PostgreSQL mirror)
-- ============================================================================

CREATE TABLE knowledge_nodes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  
  -- Node details
  node_type VARCHAR(50), -- 'technology' | 'pattern' | 'developer' | 'project'
  name VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Metadata
  properties JSONB,
  
  -- Neo4j sync
  neo4j_id VARCHAR(255),
  
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE knowledge_relationships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  from_node_id UUID REFERENCES knowledge_nodes(id) ON DELETE CASCADE,
  to_node_id UUID REFERENCES knowledge_nodes(id) ON DELETE CASCADE,
  
  -- Relationship details
  relationship_type VARCHAR(100), -- 'uses' | 'works-with' | 'requires' | 'similar-to'
  strength DECIMAL(3,2),
  
  -- Metadata
  properties JSONB,
  
  -- Usage tracking
  times_observed INT DEFAULT 1,
  
  created_at TIMESTAMP DEFAULT NOW(),
  last_observed TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- GIT INTEGRATION
-- ============================================================================

CREATE TABLE git_branches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  feature_id UUID REFERENCES features(id),
  
  -- Branch details
  branch_name VARCHAR(255) NOT NULL,
  base_branch VARCHAR(255) DEFAULT 'main',
  
  -- Status
  status VARCHAR(50) DEFAULT 'active', -- 'active' | 'pr_created' | 'merged' | 'abandoned'
  
  -- PR details
  pr_number INT,
  pr_url TEXT,
  pr_status VARCHAR(50),
  
  -- Metrics
  commits_count INT DEFAULT 0,
  files_changed INT DEFAULT 0,
  lines_added INT DEFAULT 0,
  lines_deleted INT DEFAULT 0,
  
  created_at TIMESTAMP DEFAULT NOW(),
  merged_at TIMESTAMP
);

CREATE TABLE git_commits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  branch_id UUID REFERENCES git_branches(id) ON DELETE CASCADE,
  
  -- Commit details
  commit_hash VARCHAR(40),
  message TEXT,
  author_id UUID REFERENCES team_members(id),
  
  -- AI-generated metadata
  ai_summary TEXT,
  affected_features UUID[],
  decision_ids UUID[],
  
  -- Metrics
  files_changed INT,
  lines_added INT,
  lines_deleted INT,
  
  committed_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- SOCIAL FEATURES
-- ============================================================================

CREATE TABLE activity_feed (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  
  -- Activity details
  activity_type VARCHAR(50), -- 'feature_completed' | 'pattern_shared' | 'achievement' | 'insight'
  actor_id UUID,
  actor_type VARCHAR(50), -- 'user' | 'agent'
  
  -- Content
  title VARCHAR(255),
  description TEXT,
  metadata JSONB,
  
  -- Engagement
  reactions JSONB,
  comments_count INT DEFAULT 0,
  
  -- Replay
  replay_url TEXT,
  replay_duration INT,
  
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  icon VARCHAR(50),
  rarity VARCHAR(50), -- 'common' | 'rare' | 'epic' | 'legendary'
  
  -- Requirements
  requirements JSONB,
  
  -- Unlocks
  unlocks_mcps TEXT[],
  unlocks_features TEXT[],
  unlocks_badges TEXT[],
  
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE user_achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES platform_users(id) ON DELETE CASCADE,
  achievement_id UUID REFERENCES achievements(id) ON DELETE CASCADE,
  
  unlocked_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(user_id, achievement_id)
);

-- ============================================================================
-- MCP MARKETPLACE
-- ============================================================================

CREATE TABLE mcp_servers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- MCP details
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  category VARCHAR(100), -- 'database' | 'knowledge' | 'testing' | 'deployment'
  
  -- Configuration
  endpoint TEXT,
  tools JSONB,
  config_schema JSONB,
  
  -- Access control
  access_level VARCHAR(50), -- 'free' | 'achievement_locked' | 'admin_only'
  required_achievement_id UUID REFERENCES achievements(id),
  
  -- Metrics
  times_used INT DEFAULT 0,
  success_rate DECIMAL(3,2),
  avg_execution_time INT,
  
  -- Social
  reactions JSONB,
  
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE mcp_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mcp_id UUID REFERENCES mcp_servers(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id),
  user_id UUID REFERENCES platform_users(id),
  agent_id UUID REFERENCES agents(id),
  
  -- Usage details
  tool_name VARCHAR(255),
  parameters JSONB,
  
  -- Outcome
  success BOOLEAN,
  execution_time INT,
  error_message TEXT,
  
  used_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- API USAGE & BILLING
-- ============================================================================

CREATE TABLE api_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES platform_users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id),
  agent_id UUID REFERENCES agents(id),
  
  -- API details
  service VARCHAR(50), -- 'claude' | 'gemini' | 'openai'
  model VARCHAR(100),
  endpoint VARCHAR(255),
  
  -- Usage
  tokens_in INT,
  tokens_out INT,
  cost DECIMAL(10,6),
  
  -- Context
  feature_id UUID REFERENCES features(id),
  purpose VARCHAR(255),
  
  timestamp TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX idx_agents_status ON agents(status);
CREATE INDEX idx_agents_type ON agents(type);
CREATE INDEX idx_agent_messages_project ON agent_messages(project_id);
CREATE INDEX idx_agent_messages_status ON agent_messages(status);
CREATE INDEX idx_projects_team ON projects(team_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_features_project ON features(project_id);
CREATE INDEX idx_features_status ON features(status);
CREATE INDEX idx_features_assigned ON features(assigned_to);
CREATE INDEX idx_decisions_project ON decisions(project_id);
CREATE INDEX idx_decisions_type ON decisions(type);
CREATE INDEX idx_patterns_team ON patterns(team_id);
CREATE INDEX idx_patterns_category ON patterns(category);
CREATE INDEX idx_activity_feed_team ON activity_feed(team_id);
CREATE INDEX idx_activity_feed_created ON activity_feed(created_at DESC);
CREATE INDEX idx_api_usage_user ON api_usage(user_id, timestamp);
CREATE INDEX idx_api_usage_project ON api_usage(project_id, timestamp);

-- ============================================================================
-- MATERIALIZED VIEWS FOR ANALYTICS
-- ============================================================================

CREATE MATERIALIZED VIEW team_stats AS
SELECT 
  team_id,
  COUNT(*) FILTER (WHERE status = 'done') as features_completed,
  AVG(EXTRACT(EPOCH FROM (completed_at - started_at))/60) as avg_time_to_ship,
  COUNT(*) FILTER (WHERE autocoder_passes = true) * 100.0 / NULLIF(COUNT(*), 0) as success_rate
FROM features
GROUP BY team_id;

CREATE UNIQUE INDEX ON team_stats(team_id);

-- ============================================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_platform_users_updated_at
  BEFORE UPDATE ON platform_users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Auto-update project metrics
CREATE OR REPLACE FUNCTION update_project_metrics()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE projects
  SET features_total = (SELECT COUNT(*) FROM features WHERE project_id = NEW.project_id),
      features_completed = (SELECT COUNT(*) FROM features WHERE project_id = NEW.project_id AND status = 'done')
  WHERE id = NEW.project_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_project_metrics_trigger
  AFTER INSERT OR UPDATE ON features
  FOR EACH ROW
  EXECUTE FUNCTION update_project_metrics();
