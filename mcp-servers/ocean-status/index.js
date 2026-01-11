#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: 5432,
  database: 'ocean_db',
  user: 'ocean_user',
  password: process.env.POSTGRES_PASSWORD || 'OceanSecure2026!DB'
});

const server = new Server(
  {
    name: 'ocean-status',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
      resources: {},
    },
  }
);

// Define tools
server.setRequestHandler('tools/list', async () => ({
  tools: [
    {
      name: 'get_ocean_status',
      description: 'Get current OCEAN platform status including phase progress, services, and recent activity',
      inputSchema: {
        type: 'object',
        properties: {},
      },
    },
    {
      name: 'get_phase_progress',
      description: 'Get detailed progress for a specific phase',
      inputSchema: {
        type: 'object',
        properties: {
          phase_number: {
            type: 'number',
            description: 'Phase number (1-6)',
          },
        },
        required: ['phase_number'],
      },
    },
    {
      name: 'log_decision',
      description: 'Log an architecture or technical decision',
      inputSchema: {
        type: 'object',
        properties: {
          type: {
            type: 'string',
            description: 'Decision type (architecture, database, framework, api, etc.)',
          },
          decision: {
            type: 'string',
            description: 'The decision made',
          },
          reasoning: {
            type: 'string',
            description: 'Why this decision was made',
          },
          impact: {
            type: 'string',
            enum: ['low', 'medium', 'high', 'critical'],
            description: 'Impact level of this decision',
          },
        },
        required: ['type', 'decision', 'reasoning', 'impact'],
      },
    },
    {
      name: 'get_decisions',
      description: 'Get all logged decisions, optionally filtered by type',
      inputSchema: {
        type: 'object',
        properties: {
          type: {
            type: 'string',
            description: 'Filter by decision type',
          },
          limit: {
            type: 'number',
            description: 'Number of decisions to return',
            default: 10,
          },
        },
      },
    },
    {
      name: 'mark_task_complete',
      description: 'Mark a PRD task as complete',
      inputSchema: {
        type: 'object',
        properties: {
          task_id: {
            type: 'number',
            description: 'Task ID to mark complete',
          },
        },
        required: ['task_id'],
      },
    },
    {
      name: 'get_docker_status',
      description: 'Get status of all Docker containers',
      inputSchema: {
        type: 'object',
        properties: {},
      },
    },
  ],
}));

// Tool handlers
server.setRequestHandler('tools/call', async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'get_ocean_status':
        return await getOceanStatus();
      
      case 'get_phase_progress':
        return await getPhaseProgress(args.phase_number);
      
      case 'log_decision':
        return await logDecision(args);
      
      case 'get_decisions':
        return await getDecisions(args.type, args.limit || 10);
      
      case 'mark_task_complete':
        return await markTaskComplete(args.task_id);
      
      case 'get_docker_status':
        return await getDockerStatus();
      
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
});

// Resource handlers
server.setRequestHandler('resources/list', async () => ({
  resources: [
    {
      uri: 'ocean://status',
      name: 'OCEAN Platform Status',
      description: 'Current status of OCEAN platform',
      mimeType: 'application/json',
    },
    {
      uri: 'ocean://decisions',
      name: 'Architecture Decisions',
      description: 'All logged architecture decisions',
      mimeType: 'application/json',
    },
  ],
}));

server.setRequestHandler('resources/read', async (request) => {
  const { uri } = request.params;

  if (uri === 'ocean://status') {
    const status = await getOceanStatus();
    return {
      contents: [
        {
          uri,
          mimeType: 'application/json',
          text: JSON.stringify(status, null, 2),
        },
      ],
    };
  }

  if (uri === 'ocean://decisions') {
    const decisions = await getDecisions(null, 50);
    return {
      contents: [
        {
          uri,
          mimeType: 'application/json',
          text: JSON.stringify(decisions, null, 2),
        },
      ],
    };
  }

  throw new Error(`Unknown resource: ${uri}`);
});

// Implementation functions
async function getOceanStatus() {
  const progress = await pool.query('SELECT * FROM prd_progress ORDER BY phase_number');
  
  const currentPhase = progress.rows.find(p => p.status === 'in_progress') || progress.rows[0];
  
  const totalTasks = progress.rows.reduce((sum, p) => sum + parseInt(p.total_tasks || 0), 0);
  const completedTasks = progress.rows.reduce((sum, p) => sum + parseInt(p.completed_tasks || 0), 0);
  
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify({
          platform: 'OCEAN',
          server: '77.42.44.61',
          current_phase: {
            number: currentPhase.phase_number,
            name: currentPhase.phase_name,
            status: currentPhase.status,
            progress: `${currentPhase.completion_percentage}%`,
          },
          overall_progress: {
            total_tasks: totalTasks,
            completed_tasks: completedTasks,
            percentage: ((completedTasks / totalTasks) * 100).toFixed(2) + '%',
          },
          phases: progress.rows.map(p => ({
            phase: p.phase_number,
            name: p.phase_name,
            status: p.status,
            progress: `${p.completion_percentage}%`,
            tasks: `${p.completed_tasks}/${p.total_tasks}`,
          })),
        }, null, 2),
      },
    ],
  };
}

async function getPhaseProgress(phaseNumber) {
  const phase = await pool.query(
    'SELECT * FROM prd_progress WHERE phase_number = $1',
    [phaseNumber]
  );
  
  if (phase.rows.length === 0) {
    throw new Error(`Phase ${phaseNumber} not found`);
  }
  
  const weeks = await pool.query(
    `SELECT w.*, COUNT(t.id) as total_tasks, 
     COUNT(t.id) FILTER (WHERE t.completed = true) as completed_tasks
     FROM prd_weeks w
     LEFT JOIN prd_tasks t ON t.week_id = w.id
     WHERE w.phase_id = (SELECT id FROM prd_phases WHERE phase_number = $1)
     GROUP BY w.id
     ORDER BY w.week_number`,
    [phaseNumber]
  );
  
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify({
          phase: phase.rows[0],
          weeks: weeks.rows,
        }, null, 2),
      },
    ],
  };
}

async function logDecision(decision) {
  // First, ensure decisions table exists
  await pool.query(`
    CREATE TABLE IF NOT EXISTS decisions (
      id SERIAL PRIMARY KEY,
      type VARCHAR(50) NOT NULL,
      decision TEXT NOT NULL,
      reasoning TEXT,
      impact VARCHAR(20),
      made_by VARCHAR(100) DEFAULT 'team',
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);
  
  const result = await pool.query(
    `INSERT INTO decisions (type, decision, reasoning, impact)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [decision.type, decision.decision, decision.reasoning, decision.impact]
  );
  
  return {
    content: [
      {
        type: 'text',
        text: `Decision logged successfully:\n${JSON.stringify(result.rows[0], null, 2)}`,
      },
    ],
  };
}

async function getDecisions(type, limit) {
  let query = 'SELECT * FROM decisions';
  const params = [];
  
  if (type) {
    query += ' WHERE type = $1';
    params.push(type);
  }
  
  query += ' ORDER BY created_at DESC LIMIT $' + (params.length + 1);
  params.push(limit);
  
  const result = await pool.query(query, params);
  
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(result.rows, null, 2),
      },
    ],
  };
}

async function markTaskComplete(taskId) {
  const result = await pool.query(
    `UPDATE prd_tasks 
     SET completed = true, completed_at = NOW() 
     WHERE id = $1 
     RETURNING *`,
    [taskId]
  );
  
  if (result.rows.length === 0) {
    throw new Error(`Task ${taskId} not found`);
  }
  
  return {
    content: [
      {
        type: 'text',
        text: `Task ${taskId} marked complete:\n${JSON.stringify(result.rows[0], null, 2)}`,
      },
    ],
  };
}

async function getDockerStatus() {
  const { exec } = await import('child_process');
  const { promisify } = await import('util');
  const execAsync = promisify(exec);
  
  try {
    const { stdout } = await execAsync('docker-compose ps --format json', {
      cwd: '/opt/ocean',
    });
    
    return {
      content: [
        {
          type: 'text',
          text: stdout,
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error getting Docker status: ${error.message}`,
        },
      ],
    };
  }
}

// Start server
const transport = new StdioServerTransport();
await server.connect(transport);

console.error('OCEAN Status MCP server running on stdio');
