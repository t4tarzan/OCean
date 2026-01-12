-- Migration 002: Add Performance Indexes
-- Run date: 2026-01-11

-- Indexes for platform_users
CREATE INDEX IF NOT EXISTS idx_platform_users_email ON platform_users(email);
CREATE INDEX IF NOT EXISTS idx_platform_users_status ON platform_users(status);
CREATE INDEX IF NOT EXISTS idx_platform_users_role ON platform_users(role);
CREATE INDEX IF NOT EXISTS idx_platform_users_team_id ON platform_users(team_id);

-- Indexes for teams
CREATE INDEX IF NOT EXISTS idx_teams_status ON teams(status);

-- Indexes for projects
CREATE INDEX IF NOT EXISTS idx_projects_team_id ON projects(team_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(created_at);

-- Indexes for features
CREATE INDEX IF NOT EXISTS idx_features_project_id ON features(project_id);
CREATE INDEX IF NOT EXISTS idx_features_status ON features(status);
CREATE INDEX IF NOT EXISTS idx_features_assigned_to ON features(assigned_to);

-- Indexes for agents
CREATE INDEX IF NOT EXISTS idx_agents_status ON agents(status);
CREATE INDEX IF NOT EXISTS idx_agents_type ON agents(type);

-- Indexes for PRD tracking
CREATE INDEX IF NOT EXISTS idx_prd_phases_status ON prd_phases(status);
CREATE INDEX IF NOT EXISTS idx_prd_weeks_phase_id ON prd_weeks(phase_id);
CREATE INDEX IF NOT EXISTS idx_prd_tasks_week_id ON prd_tasks(week_id);
CREATE INDEX IF NOT EXISTS idx_prd_tasks_completed ON prd_tasks(completed);

-- Indexes for decisions
CREATE INDEX IF NOT EXISTS idx_decisions_type ON decisions(type);
CREATE INDEX IF NOT EXISTS idx_decisions_impact ON decisions(impact);
CREATE INDEX IF NOT EXISTS idx_decisions_created_at ON decisions(created_at);

-- Record this migration
INSERT INTO schema_migrations (version, description) 
VALUES ('002', 'Add performance indexes')
ON CONFLICT (version) DO NOTHING;
