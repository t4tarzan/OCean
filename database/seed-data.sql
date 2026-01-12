-- Seed Data for OCEAN Platform Testing
-- Run date: 2026-01-11

-- Insert test teams
INSERT INTO teams (name, description, created_at) VALUES
('Alpha Team', 'Primary development team', NOW()),
('Beta Team', 'QA and testing team', NOW()),
('Gamma Team', 'DevOps and infrastructure team', NOW())
ON CONFLICT DO NOTHING;

-- Insert test users
INSERT INTO platform_users (email, name, role, password_hash, status, created_at) VALUES
('admin@ocean.dev', 'Admin User', 'admin', '$2b$10$YourHashedPasswordHere', 'active', NOW()),
('dev1@ocean.dev', 'Developer One', 'developer', '$2b$10$YourHashedPasswordHere', 'active', NOW()),
('dev2@ocean.dev', 'Developer Two', 'developer', '$2b$10$YourHashedPasswordHere', 'active', NOW()),
('lead@ocean.dev', 'Team Lead', 'lead', '$2b$10$YourHashedPasswordHere', 'active', NOW())
ON CONFLICT (email) DO NOTHING;

-- Insert test projects
INSERT INTO projects (name, description, team_id, status, created_at) VALUES
('OCEAN Platform', 'Main OCEAN development project', 1, 'active', NOW()),
('Test Project', 'Testing and QA project', 2, 'active', NOW())
ON CONFLICT DO NOTHING;

-- Insert test features
INSERT INTO features (project_id, title, description, status, assigned_to, created_at) VALUES
(1, 'User Authentication', 'Implement NextAuth.js authentication system', 'in_progress', 2, NOW()),
(1, 'API Proxy', 'Create API proxy for Claude/Gemini/OpenAI', 'pending', 3, NOW()),
(1, 'Admin Panel', 'Build admin dashboard for user management', 'in_progress', 4, NOW())
ON CONFLICT DO NOTHING;

-- Insert test agents
INSERT INTO agents (name, type, description, status, capabilities, created_at) VALUES
('Architect Agent', 'architect', 'System architecture and design decisions', 'active', '["system_design", "architecture_patterns", "scalability"]', NOW()),
('Database Agent', 'database', 'Database schema design and optimization', 'active', '["schema_design", "query_optimization", "migrations"]', NOW()),
('Frontend Agent', 'frontend', 'UI/UX development and React components', 'active', '["react", "nextjs", "tailwind", "ui_components"]', NOW()),
('API Agent', 'api', 'API endpoint design and implementation', 'active', '["rest_api", "graphql", "authentication", "validation"]', NOW())
ON CONFLICT DO NOTHING;

-- Log seed data application
INSERT INTO schema_migrations (version, description) 
VALUES ('004', 'Seed data for testing')
ON CONFLICT (version) DO NOTHING;
