#!/usr/bin/env node

/**
 * Load OCEAN PRD into database for tracking
 * This script creates a dashboard-ready structure in PostgreSQL
 */

import { Pool } from 'pg';
import fs from 'fs/promises';
import path from 'path';

const pool = new Pool({
  host: process.env.OCEAN_DB_HOST || 'localhost',
  port: 5432,
  database: 'ocean_db',
  user: 'ocean_user',
  password: process.env.OCEAN_DB_PASSWORD
});

interface Phase {
  number: number;
  name: string;
  duration: string;
  status: string;
  objectives: string[];
  weeks: Week[];
}

interface Week {
  number: number;
  title: string;
  tasks: Task[];
}

interface Task {
  description: string;
  completed: boolean;
  assignee?: string;
}

async function createPRDTables() {
  console.log('Creating PRD tracking tables...');

  await pool.query(`
    CREATE TABLE IF NOT EXISTS prd_phases (
      id SERIAL PRIMARY KEY,
      phase_number INT NOT NULL,
      name VARCHAR(255) NOT NULL,
      duration VARCHAR(50),
      status VARCHAR(50) DEFAULT 'not_started',
      start_date DATE,
      target_completion DATE,
      actual_completion DATE,
      objectives TEXT[],
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS prd_weeks (
      id SERIAL PRIMARY KEY,
      phase_id INT REFERENCES prd_phases(id) ON DELETE CASCADE,
      week_number INT NOT NULL,
      title VARCHAR(255),
      status VARCHAR(50) DEFAULT 'not_started',
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS prd_tasks (
      id SERIAL PRIMARY KEY,
      week_id INT REFERENCES prd_weeks(id) ON DELETE CASCADE,
      description TEXT NOT NULL,
      completed BOOLEAN DEFAULT false,
      assignee VARCHAR(255),
      completed_at TIMESTAMP,
      notes TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS prd_deliverables (
      id SERIAL PRIMARY KEY,
      week_id INT REFERENCES prd_weeks(id) ON DELETE CASCADE,
      name VARCHAR(255),
      description TEXT,
      file_path TEXT,
      completed BOOLEAN DEFAULT false,
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS prd_milestones (
      id SERIAL PRIMARY KEY,
      phase_id INT REFERENCES prd_phases(id) ON DELETE CASCADE,
      name VARCHAR(255),
      description TEXT,
      target_date DATE,
      completed BOOLEAN DEFAULT false,
      completed_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);

  console.log('✓ PRD tables created');
}

async function loadPhase1() {
  console.log('Loading Phase 1: Foundation & Infrastructure...');

  const phase = await pool.query(`
    INSERT INTO prd_phases (phase_number, name, duration, objectives)
    VALUES ($1, $2, $3, $4)
    RETURNING id
  `, [
    1,
    'Foundation & Infrastructure',
    '4 weeks',
    [
      'Provision and configure new Hetzner server',
      'Set up all database systems (PostgreSQL, Neo4j, Qdrant, Redis)',
      'Create admin panel for user/API management',
      'Implement API proxy layer to hide billing',
      'Build authentication system',
      'Establish monitoring and logging'
    ]
  ]);

  const phaseId = phase.rows[0].id;

  // Week 1
  const week1 = await pool.query(`
    INSERT INTO prd_weeks (phase_id, week_number, title)
    VALUES ($1, $2, $3)
    RETURNING id
  `, [phaseId, 1, 'Server Provisioning & Database Setup']);

  await pool.query(`
    INSERT INTO prd_tasks (week_id, description) VALUES
    ($1, 'Provision Hetzner server (8 vCPU, 32GB RAM, 240GB SSD)'),
    ($1, 'Configure Ubuntu 22.04 LTS'),
    ($1, 'Set up SSH access with key-based authentication'),
    ($1, 'Configure firewall (UFW)'),
    ($1, 'Install Docker Engine and Docker Compose'),
    ($1, 'Create docker-compose.yml for all services'),
    ($1, 'Create PostgreSQL database schema'),
    ($1, 'Set up Neo4j knowledge graph'),
    ($1, 'Configure Qdrant vector database'),
    ($1, 'Set up Redis for caching')
  `, [week1.rows[0].id]);

  // Week 2
  const week2 = await pool.query(`
    INSERT INTO prd_weeks (phase_id, week_number, title)
    VALUES ($1, $2, $3)
    RETURNING id
  `, [phaseId, 2, 'Admin Panel Development']);

  await pool.query(`
    INSERT INTO prd_tasks (week_id, description) VALUES
    ($1, 'Extend existing dashboard at port 3100'),
    ($1, 'Create user management interface'),
    ($1, 'Create API key management interface'),
    ($1, 'Create usage monitoring dashboard'),
    ($1, 'Configure PostgreSQL connection from current server'),
    ($1, 'Set up SSL/TLS for database connections'),
    ($1, 'Test connectivity and connection pooling')
  `, [week2.rows[0].id]);

  // Week 3
  const week3 = await pool.query(`
    INSERT INTO prd_weeks (phase_id, week_number, title)
    VALUES ($1, $2, $3)
    RETURNING id
  `, [phaseId, 3, 'API Proxy & Authentication']);

  await pool.query(`
    INSERT INTO prd_tasks (week_id, description) VALUES
    ($1, 'Create API proxy service'),
    ($1, 'Implement request routing for Claude/Gemini/OpenAI'),
    ($1, 'Add usage tracking and logging'),
    ($1, 'Implement rate limiting'),
    ($1, 'Implement NextAuth.js authentication'),
    ($1, 'Create login/logout flows'),
    ($1, 'Add role-based access control (RBAC)'),
    ($1, 'Implement session management')
  `, [week3.rows[0].id]);

  // Week 4
  const week4 = await pool.query(`
    INSERT INTO prd_weeks (phase_id, week_number, title)
    VALUES ($1, $2, $3)
    RETURNING id
  `, [phaseId, 4, 'Testing & Security Hardening']);

  await pool.query(`
    INSERT INTO prd_tasks (week_id, description) VALUES
    ($1, 'Write unit tests for all services'),
    ($1, 'Write integration tests for database'),
    ($1, 'Write E2E tests for admin panel'),
    ($1, 'Load testing for API proxy'),
    ($1, 'Enable SSL/TLS for all services'),
    ($1, 'Implement API key encryption'),
    ($1, 'Add security headers'),
    ($1, 'Configure log rotation')
  `, [week4.rows[0].id]);

  console.log('✓ Phase 1 loaded');
}

async function loadPhase2() {
  console.log('Loading Phase 2: Core Agent System...');

  const phase = await pool.query(`
    INSERT INTO prd_phases (phase_number, name, duration, objectives)
    VALUES ($1, $2, $3, $4)
    RETURNING id
  `, [
    2,
    'Core Agent System',
    '5 weeks',
    [
      'Implement OASF-style agent registry',
      'Build inter-agent messaging framework',
      'Create 7 specialized AI agents',
      'Develop orchestration layer',
      'Build agent dashboard UI',
      'Implement real-time monitoring'
    ]
  ]);

  const phaseId = phase.rows[0].id;

  // Add weeks and tasks for Phase 2
  const week1 = await pool.query(`
    INSERT INTO prd_weeks (phase_id, week_number, title)
    VALUES ($1, $2, $3)
    RETURNING id
  `, [phaseId, 1, 'Agent Registry & Messaging Bus']);

  await pool.query(`
    INSERT INTO prd_tasks (week_id, description) VALUES
    ($1, 'Create agent registration system'),
    ($1, 'Implement agent capability discovery'),
    ($1, 'Build agent health monitoring'),
    ($1, 'Implement message bus (Redis Pub/Sub)'),
    ($1, 'Create message routing'),
    ($1, 'Add message persistence (PostgreSQL)'),
    ($1, 'Build conversation tracking')
  `, [week1.rows[0].id]);

  console.log('✓ Phase 2 loaded');
}

async function loadPhases3to6() {
  console.log('Loading Phases 3-6...');

  // Phase 3
  await pool.query(`
    INSERT INTO prd_phases (phase_number, name, duration, objectives)
    VALUES ($1, $2, $3, $4)
  `, [
    3,
    'AutoCoder Integration',
    '4 weeks',
    [
      'Wrap AutoCoder (not fork) for integration',
      'Build decision logger to extract architecture decisions',
      'Create visual Decision Map UI',
      'Integrate AutoCoder with multi-agent system',
      'Implement intelligent Git management',
      'Build feature management system'
    ]
  ]);

  // Phase 4
  await pool.query(`
    INSERT INTO prd_phases (phase_number, name, duration, objectives)
    VALUES ($1, $2, $3, $4)
  `, [
    4,
    'Letta & Knowledge Systems',
    '5 weeks',
    [
      'Install and configure Letta',
      'Integrate Letta with all agents',
      'Build team memory system',
      'Create knowledge graph (Neo4j)',
      'Implement pattern extraction engine',
      'Build predictive context loading',
      'Create collective memory UI'
    ]
  ]);

  // Phase 5
  await pool.query(`
    INSERT INTO prd_phases (phase_number, name, duration, objectives)
    VALUES ($1, $2, $3, $4)
  `, [
    5,
    'Collaboration & Social Features',
    '4 weeks',
    [
      'Build collaborative Kanban board',
      'Implement live presence system (Figma-style)',
      'Create activity feed (CodeStream)',
      'Build time-travel replay system',
      'Develop pattern marketplace',
      'Implement achievement system & gamification',
      'Add real-time notifications'
    ]
  ]);

  // Phase 6
  await pool.query(`
    INSERT INTO prd_phases (phase_number, name, duration, objectives)
    VALUES ($1, $2, $3, $4)
  `, [
    6,
    'Advanced Features & Polish',
    '4 weeks',
    [
      'Build comprehensive MCP marketplace',
      'Implement advanced analytics & insights',
      'Optimize performance',
      'Security audit & hardening',
      'Create documentation & training materials',
      'Beta testing & feedback integration',
      'Launch preparation'
    ]
  ]);

  console.log('✓ Phases 3-6 loaded');
}

async function createDashboardViews() {
  console.log('Creating dashboard views...');

  await pool.query(`
    -- Overall progress view
    CREATE OR REPLACE VIEW prd_progress AS
    SELECT 
      p.phase_number,
      p.name as phase_name,
      p.status,
      p.duration,
      COUNT(DISTINCT w.id) as total_weeks,
      COUNT(DISTINCT t.id) as total_tasks,
      COUNT(DISTINCT t.id) FILTER (WHERE t.completed = true) as completed_tasks,
      ROUND(COUNT(DISTINCT t.id) FILTER (WHERE t.completed = true) * 100.0 / NULLIF(COUNT(DISTINCT t.id), 0), 2) as completion_percentage
    FROM prd_phases p
    LEFT JOIN prd_weeks w ON w.phase_id = p.id
    LEFT JOIN prd_tasks t ON t.week_id = w.id
    GROUP BY p.id, p.phase_number, p.name, p.status, p.duration
    ORDER BY p.phase_number;

    -- Current week view
    CREATE OR REPLACE VIEW prd_current_week AS
    SELECT 
      p.phase_number,
      p.name as phase_name,
      w.week_number,
      w.title as week_title,
      w.status as week_status,
      t.id as task_id,
      t.description as task_description,
      t.completed,
      t.assignee
    FROM prd_phases p
    JOIN prd_weeks w ON w.phase_id = p.id
    JOIN prd_tasks t ON t.week_id = w.id
    WHERE p.status = 'in_progress'
    ORDER BY t.id;

    -- Milestone tracking view
    CREATE OR REPLACE VIEW prd_milestone_status AS
    SELECT 
      p.phase_number,
      p.name as phase_name,
      m.name as milestone_name,
      m.target_date,
      m.completed,
      m.completed_at,
      CASE 
        WHEN m.completed THEN 'completed'
        WHEN m.target_date < CURRENT_DATE THEN 'overdue'
        WHEN m.target_date <= CURRENT_DATE + INTERVAL '7 days' THEN 'due_soon'
        ELSE 'on_track'
      END as status
    FROM prd_phases p
    JOIN prd_milestones m ON m.phase_id = p.id
    ORDER BY m.target_date;
  `);

  console.log('✓ Dashboard views created');
}

async function main() {
  try {
    console.log('🌊 Loading OCEAN PRD into database...\n');

    await createPRDTables();
    await loadPhase1();
    await loadPhase2();
    await loadPhases3to6();
    await createDashboardViews();

    console.log('\n✅ OCEAN PRD successfully loaded into database!');
    console.log('\nYou can now:');
    console.log('1. View progress: SELECT * FROM prd_progress;');
    console.log('2. See current tasks: SELECT * FROM prd_current_week;');
    console.log('3. Check milestones: SELECT * FROM prd_milestone_status;');
    console.log('\nNext step: Run create-dashboard.ts to build the tracking UI');

  } catch (error) {
    console.error('Error loading PRD:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
