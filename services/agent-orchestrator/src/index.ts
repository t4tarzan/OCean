import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import messageBus from './messaging/redis-bus';
import db from './utils/database';
import { getOrchestrator } from './orchestrator/orchestrator';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3002;

app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'agent-orchestrator' });
});

// Agent registry endpoints
app.get('/api/agents', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM agents ORDER BY created_at DESC');
    res.json({ agents: result.rows });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/agents/:id', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM agents WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Agent not found' });
    }
    res.json({ agent: result.rows[0] });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/agents/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    await db.query(
      'UPDATE agents SET status = $1, updated_at = NOW() WHERE id = $2',
      [status, req.params.id]
    );
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Agent tasks endpoints
app.get('/api/tasks', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM agent_tasks ORDER BY created_at DESC LIMIT 50');
    res.json({ tasks: result.rows });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/tasks', async (req, res) => {
  try {
    const { task_type, description, requirements, priority } = req.body;
    const result = await db.query(
      `INSERT INTO agent_tasks (task_type, description, requirements, priority)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [task_type, description, JSON.stringify(requirements), priority || 5]
    );
    res.json({ task: result.rows[0] });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Agent messages endpoints
app.get('/api/messages', async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM agent_messages ORDER BY created_at DESC LIMIT 100'
    );
    res.json({ messages: result.rows });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Orchestrator endpoints
app.post('/api/orchestrator/build', async (req, res) => {
  try {
    const { featureDescription, requirements } = req.body;
    const orchestrator = await getOrchestrator();
    const result = await orchestrator.buildFeature(featureDescription, requirements);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/orchestrator/status', async (req, res) => {
  try {
    const orchestrator = await getOrchestrator();
    const agents = await orchestrator.getAgentStatus();
    const activeTasks = await orchestrator.getActiveTasks();
    res.json({ agents, activeTasks });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// AutoCoder integration endpoints
app.post('/api/agents/request', async (req, res) => {
  try {
    const { agent_type, task, context, project_id } = req.body;
    const orchestrator = await getOrchestrator();
    
    // Route request to appropriate agent
    const result = await orchestrator.delegateTask(agent_type, {
      description: task,
      context,
      projectId: project_id,
      source: 'autocoder'
    });
    
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/features/start', async (req, res) => {
  try {
    const { feature_id, feature_name, project_id } = req.body;
    
    await pool.query(`
      INSERT INTO agent_tasks (agent_id, type, description, status, project_id, metadata)
      VALUES (
        (SELECT id FROM agents WHERE name = 'AutoCoder' LIMIT 1),
        'feature',
        $1,
        'in_progress',
        $2,
        $3
      )
    `, [feature_name, project_id, JSON.stringify({ feature_id })]);
    
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/features/complete', async (req, res) => {
  try {
    const { feature_id, success, project_id } = req.body;
    
    await pool.query(`
      UPDATE agent_tasks
      SET status = $1, completed_at = NOW()
      WHERE metadata->>'feature_id' = $2
      AND project_id = $3
    `, [success ? 'completed' : 'failed', feature_id.toString(), project_id]);
    
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

async function startServer() {
  try {
    // Connect to Redis message bus
    await messageBus.connect();
    console.log('✅ Redis message bus connected');

    // Start Express server
    app.listen(PORT, () => {
      console.log(`🚀 Agent Orchestrator running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
