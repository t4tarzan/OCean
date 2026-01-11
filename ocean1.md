# 🌊 OCEAN Phase 1: Foundation & Infrastructure

**Duration:** 4 weeks  
**Status:** Not Started  
**Dependencies:** None (First phase)

---

## Overview

Phase 1 establishes the foundational infrastructure for the OCEAN platform. This includes server provisioning, database setup, admin panel, and core authentication/authorization systems.

**Goal:** Create a solid, secure foundation that all subsequent phases will build upon.

---

## Objectives

1. ✅ Provision and configure new Hetzner server
2. ✅ Set up all database systems (PostgreSQL, Neo4j, Qdrant, Redis)
3. ✅ Create admin panel for user/API management
4. ✅ Implement API proxy layer to hide billing
5. ✅ Build authentication system
6. ✅ Establish monitoring and logging

---

## Week 1: Server Provisioning & Database Setup

### 1.1 Hetzner Server Setup

**Tasks:**
- [ ] Provision Hetzner server (8 vCPU, 32GB RAM, 240GB SSD)
- [ ] Configure Ubuntu 22.04 LTS
- [ ] Set up SSH access with key-based authentication
- [ ] Configure firewall (UFW)
  - Allow: 22 (SSH), 80 (HTTP), 443 (HTTPS), 3000 (App), 5432 (PostgreSQL - restricted)
  - Deny: All other incoming
- [ ] Install essential packages (git, curl, wget, build-essential)
- [ ] Set up automatic security updates

**Deliverables:**
```bash
# Server access
ssh root@<new-hetzner-ip>

# Firewall rules
sudo ufw status
```

**Acceptance Criteria:**
- Server accessible via SSH
- Firewall configured correctly
- Security updates enabled

---

### 1.2 Docker & Container Setup

**Tasks:**
- [ ] Install Docker Engine
- [ ] Install Docker Compose
- [ ] Configure Docker daemon
- [ ] Set up Docker networks
- [ ] Create docker-compose.yml for all services

**Deliverables:**
```yaml
# docker-compose.yml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    container_name: ocean-postgres
    environment:
      POSTGRES_DB: ocean_db
      POSTGRES_USER: ocean_user
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./database/schema.sql:/docker-entrypoint-initdb.d/01-schema.sql
      - ./database/seed-data.sql:/docker-entrypoint-initdb.d/02-seed.sql
    ports:
      - "5432:5432"
    networks:
      - ocean-network
    restart: unless-stopped

  neo4j:
    image: neo4j:5-community
    container_name: ocean-neo4j
    environment:
      NEO4J_AUTH: neo4j/${NEO4J_PASSWORD}
      NEO4J_PLUGINS: '["apoc", "graph-data-science"]'
    volumes:
      - neo4j_data:/data
      - neo4j_logs:/logs
    ports:
      - "7474:7474"  # HTTP
      - "7687:7687"  # Bolt
    networks:
      - ocean-network
    restart: unless-stopped

  qdrant:
    image: qdrant/qdrant:latest
    container_name: ocean-qdrant
    volumes:
      - qdrant_data:/qdrant/storage
    ports:
      - "6333:6333"  # HTTP API
      - "6334:6334"  # gRPC
    networks:
      - ocean-network
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    container_name: ocean-redis
    command: redis-server --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    ports:
      - "6379:6379"
    networks:
      - ocean-network
    restart: unless-stopped

  minio:
    image: minio/minio:latest
    container_name: ocean-minio
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: ${MINIO_ROOT_USER}
      MINIO_ROOT_PASSWORD: ${MINIO_ROOT_PASSWORD}
    volumes:
      - minio_data:/data
    ports:
      - "9000:9000"  # API
      - "9001:9001"  # Console
    networks:
      - ocean-network
    restart: unless-stopped

volumes:
  postgres_data:
  neo4j_data:
  neo4j_logs:
  qdrant_data:
  redis_data:
  minio_data:

networks:
  ocean-network:
    driver: bridge
```

**Acceptance Criteria:**
- All containers running
- Databases accessible
- Data persisted across restarts

---

### 1.3 PostgreSQL Database Schema

**Tasks:**
- [ ] Create complete database schema (from previous design)
- [ ] Set up indexes for performance
- [ ] Create database migrations system
- [ ] Add seed data for testing
- [ ] Configure connection pooling

**Deliverables:**
```sql
-- See database/schema.sql for complete schema
-- Key tables:
-- - agents (OASF-style agent registry)
-- - agent_messages (inter-agent communication)
-- - teams & team_members
-- - projects & features
-- - decisions & decision_map_nodes
-- - team_memory & patterns
-- - knowledge_nodes & knowledge_relationships
-- - git_branches & git_commits
-- - activity_feed & achievements
-- - mcp_servers & mcp_usage
-- - api_usage (billing tracking)
```

**File Structure:**
```
database/
├── schema.sql                 # Complete schema
├── migrations/
│   ├── 001_initial_schema.sql
│   ├── 002_add_indexes.sql
│   └── 003_add_constraints.sql
├── seed-data.sql              # Test data
└── functions/
    ├── agent_functions.sql    # Database functions
    └── triggers.sql           # Database triggers
```

**Acceptance Criteria:**
- All tables created
- Indexes applied
- Foreign keys enforced
- Seed data loaded

---

### 1.4 Neo4j Knowledge Graph Setup

**Tasks:**
- [ ] Install APOC and GDS plugins
- [ ] Create graph schema
- [ ] Set up constraints and indexes
- [ ] Create initial nodes (technologies, patterns)
- [ ] Test graph queries

**Deliverables:**
```cypher
// Create constraints
CREATE CONSTRAINT technology_name IF NOT EXISTS
FOR (t:Technology) REQUIRE t.name IS UNIQUE;

CREATE CONSTRAINT pattern_name IF NOT EXISTS
FOR (p:Pattern) REQUIRE p.name IS UNIQUE;

CREATE CONSTRAINT developer_id IF NOT EXISTS
FOR (d:Developer) REQUIRE d.id IS UNIQUE;

// Create indexes
CREATE INDEX technology_category IF NOT EXISTS
FOR (t:Technology) ON (t.category);

CREATE INDEX pattern_category IF NOT EXISTS
FOR (p:Pattern) ON (p.category);

// Initial technology nodes
CREATE (react:Technology {
  name: 'React',
  category: 'frontend',
  description: 'JavaScript library for building user interfaces',
  popularity: 0.95
});

CREATE (nextjs:Technology {
  name: 'Next.js',
  category: 'framework',
  description: 'React framework for production',
  popularity: 0.90
});

CREATE (prisma:Technology {
  name: 'Prisma',
  category: 'orm',
  description: 'Next-generation ORM for Node.js',
  popularity: 0.85
});

// Create relationships
MATCH (nextjs:Technology {name: 'Next.js'})
MATCH (react:Technology {name: 'React'})
CREATE (nextjs)-[:USES]->(react);

MATCH (nextjs:Technology {name: 'Next.js'})
MATCH (prisma:Technology {name: 'Prisma'})
CREATE (nextjs)-[:WORKS_WITH]->(prisma);
```

**Acceptance Criteria:**
- Neo4j accessible via browser (port 7474)
- Constraints and indexes created
- Sample graph data loaded
- Queries returning results

---

## Week 2: Admin Panel Development

### 2.1 Admin Panel Setup (Current Server - Port 3100)

**Tasks:**
- [ ] Extend existing dashboard at `/opt/education-platform/dashboard`
- [ ] Add admin routes for OCEAN management
- [ ] Create user management interface
- [ ] Create API key management interface
- [ ] Create usage monitoring dashboard

**File Structure:**
```
dashboard/
├── app/
│   ├── admin/
│   │   ├── ocean/
│   │   │   ├── users/
│   │   │   │   ├── page.tsx              # User list
│   │   │   │   └── [userId]/page.tsx     # User details
│   │   │   ├── api-keys/
│   │   │   │   └── page.tsx              # API key management
│   │   │   ├── usage/
│   │   │   │   └── page.tsx              # Usage analytics
│   │   │   ├── agents/
│   │   │   │   └── page.tsx              # Agent monitoring
│   │   │   └── projects/
│   │   │       └── page.tsx              # Project overview
│   └── api/
│       ├── ocean/
│       │   ├── users/route.ts            # User CRUD
│       │   ├── api-keys/route.ts         # API key CRUD
│       │   ├── usage/route.ts            # Usage stats
│       │   └── agents/route.ts           # Agent status
```

**Deliverables:**

**User Management UI:**
```typescript
// app/admin/ocean/users/page.tsx
export default function OceanUsersPage() {
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">OCEAN Users</h1>
        <Button onClick={openAddUserModal}>
          <Plus className="mr-2" />
          Add User
        </Button>
      </div>

      <DataTable
        columns={[
          { key: 'email', label: 'Email' },
          { key: 'name', label: 'Name' },
          { key: 'role', label: 'Role' },
          { key: 'team', label: 'Team' },
          { key: 'status', label: 'Status' },
          { key: 'tokensUsed', label: 'Tokens Used' },
          { key: 'lastActive', label: 'Last Active' },
          { key: 'actions', label: 'Actions' }
        ]}
        data={users}
        actions={[
          { label: 'Edit', onClick: editUser },
          { label: 'Suspend', onClick: suspendUser },
          { label: 'View Usage', onClick: viewUsage },
          { label: 'Delete', onClick: deleteUser }
        ]}
      />
    </div>
  );
}
```

**API Key Management UI:**
```typescript
// app/admin/ocean/api-keys/page.tsx
export default function APIKeysPage() {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">API Key Management</h1>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader>Claude API</CardHeader>
          <CardContent>
            <Input
              type="password"
              value={claudeKey}
              onChange={(e) => setClaudeKey(e.target.value)}
            />
            <Button onClick={saveClaudeKey} className="mt-2">
              Save Key
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>Gemini API</CardHeader>
          <CardContent>
            <Input
              type="password"
              value={geminiKey}
              onChange={(e) => setGeminiKey(e.target.value)}
            />
            <Button onClick={saveGeminiKey} className="mt-2">
              Save Key
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>OpenAI API</CardHeader>
          <CardContent>
            <Input
              type="password"
              value={openaiKey}
              onChange={(e) => setOpenaiKey(e.target.value)}
            />
            <Button onClick={saveOpenaiKey} className="mt-2">
              Save Key
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>Usage Limits</CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label>Monthly Token Limit</Label>
              <Input
                type="number"
                value={monthlyLimit}
                onChange={(e) => setMonthlyLimit(e.target.value)}
              />
            </div>
            <div>
              <Label>Per-User Daily Limit</Label>
              <Input
                type="number"
                value={dailyLimit}
                onChange={(e) => setDailyLimit(e.target.value)}
              />
            </div>
            <Button onClick={saveLimits}>Save Limits</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

**Acceptance Criteria:**
- Admin can add/edit/delete users
- Admin can manage API keys (encrypted storage)
- Admin can set usage limits
- Admin can view real-time usage

---

### 2.2 Database Connection from Current Server

**Tasks:**
- [ ] Configure PostgreSQL to accept connections from current server
- [ ] Set up SSL/TLS for database connections
- [ ] Create connection pool
- [ ] Test connectivity

**Deliverables:**
```typescript
// lib/ocean-db.ts (on current server)
import { Pool } from 'pg';

const oceanPool = new Pool({
  host: process.env.OCEAN_DB_HOST, // New Hetzner server IP
  port: 5432,
  database: 'ocean_db',
  user: 'ocean_user',
  password: process.env.OCEAN_DB_PASSWORD,
  ssl: {
    rejectUnauthorized: true,
    ca: fs.readFileSync('./certs/ocean-db-ca.crt').toString()
  },
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

export async function queryOcean(sql: string, params?: any[]) {
  const client = await oceanPool.connect();
  try {
    const result = await client.query(sql, params);
    return result.rows;
  } finally {
    client.release();
  }
}
```

**Acceptance Criteria:**
- Secure connection established
- Queries executing successfully
- Connection pooling working
- SSL/TLS verified

---

## Week 3: API Proxy & Authentication

### 3.1 API Proxy Layer (New Hetzner Server)

**Tasks:**
- [ ] Create API proxy service
- [ ] Implement request routing
- [ ] Add usage tracking
- [ ] Implement rate limiting
- [ ] Add error handling and retry logic

**File Structure:**
```
services/
├── api-proxy/
│   ├── src/
│   │   ├── index.ts              # Main server
│   │   ├── routes/
│   │   │   ├── claude.ts         # Claude API proxy
│   │   │   ├── gemini.ts         # Gemini API proxy
│   │   │   └── openai.ts         # OpenAI API proxy
│   │   ├── middleware/
│   │   │   ├── auth.ts           # Verify user tokens
│   │   │   ├── rateLimit.ts      # Rate limiting
│   │   │   └── usage.ts          # Track usage
│   │   ├── services/
│   │   │   ├── apiKeyManager.ts  # Manage API keys
│   │   │   └── usageTracker.ts   # Track & log usage
│   │   └── utils/
│   │       ├── encryption.ts     # Encrypt API keys
│   │       └── logger.ts         # Logging
│   ├── package.json
│   └── tsconfig.json
```

**Deliverables:**

**Claude API Proxy:**
```typescript
// services/api-proxy/src/routes/claude.ts
import express from 'express';
import { verifyAuth } from '../middleware/auth';
import { trackUsage } from '../middleware/usage';
import { rateLimit } from '../middleware/rateLimit';

const router = express.Router();

router.post('/messages',
  verifyAuth,
  rateLimit({ maxRequests: 100, windowMs: 60000 }),
  trackUsage,
  async (req, res) => {
    try {
      const { userId } = req.user;
      const { model, messages, max_tokens } = req.body;

      // Get admin's Claude API key
      const apiKey = await getClaudeAPIKey();

      // Call Claude API
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({ model, messages, max_tokens })
      });

      const data = await response.json();

      // Log usage (hidden from user)
      await logUsage({
        userId,
        service: 'claude',
        model,
        tokensIn: data.usage.input_tokens,
        tokensOut: data.usage.output_tokens,
        cost: calculateCost(data.usage, model)
      });

      // Return response to user
      res.json(data);
    } catch (error) {
      console.error('Claude API error:', error);
      res.status(500).json({ error: 'API request failed' });
    }
  }
);

export default router;
```

**Usage Tracking:**
```typescript
// services/api-proxy/src/middleware/usage.ts
export async function trackUsage(req, res, next) {
  const startTime = Date.now();

  // Intercept response
  const originalJson = res.json;
  res.json = function(data) {
    const duration = Date.now() - startTime;

    // Log to database
    logUsage({
      userId: req.user.userId,
      endpoint: req.path,
      method: req.method,
      duration,
      tokensIn: data.usage?.input_tokens || 0,
      tokensOut: data.usage?.output_tokens || 0,
      cost: calculateCost(data.usage, req.body.model),
      timestamp: new Date()
    });

    return originalJson.call(this, data);
  };

  next();
}
```

**Acceptance Criteria:**
- All AI API calls routed through proxy
- Usage tracked in database
- Rate limiting working
- Users don't see API keys or costs

---

### 3.2 Authentication System

**Tasks:**
- [ ] Implement NextAuth.js
- [ ] Create login/logout flows
- [ ] Add role-based access control (RBAC)
- [ ] Implement session management
- [ ] Add password reset flow

**Deliverables:**

**NextAuth Configuration:**
```typescript
// lib/auth.ts
import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { queryOcean } from './ocean-db';
import bcrypt from 'bcrypt';

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    CredentialsProvider({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        // Query user from OCEAN database
        const users = await queryOcean(
          'SELECT * FROM platform_users WHERE email = $1 AND status = $2',
          [credentials.email, 'active']
        );

        if (users.length === 0) return null;

        const user = users[0];

        // Verify password
        const valid = await bcrypt.compare(
          credentials.password,
          user.password_hash
        );

        if (!valid) return null;

        // Update last active
        await queryOcean(
          'UPDATE platform_users SET last_active = NOW() WHERE id = $1',
          [user.id]
        );

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role
        };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.userId = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.userId = token.userId;
      session.user.role = token.role;
      return session;
    }
  },
  pages: {
    signIn: '/login',
    error: '/error'
  }
});
```

**RBAC Middleware:**
```typescript
// middleware/rbac.ts
export function requireRole(allowedRoles: string[]) {
  return async (req, res, next) => {
    const session = await auth();

    if (!session) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!allowedRoles.includes(session.user.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    req.user = session.user;
    next();
  };
}

// Usage:
app.get('/api/admin/users',
  requireRole(['admin', 'lead']),
  async (req, res) => {
    // Only admins and leads can access
  }
);
```

**Acceptance Criteria:**
- Users can log in/out
- Sessions persist correctly
- RBAC enforced on all routes
- Password reset working

---

## Week 4: Testing & Security Hardening

### 4.1 Comprehensive Testing

**Tasks:**
- [ ] Write unit tests for all services
- [ ] Write integration tests for database
- [ ] Write E2E tests for admin panel
- [ ] Load testing for API proxy
- [ ] Security testing

**Deliverables:**
```typescript
// tests/api-proxy.test.ts
describe('API Proxy', () => {
  test('should proxy Claude API request', async () => {
    const response = await fetch('http://localhost:3001/api/claude/messages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${testToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'claude-3-sonnet-20240229',
        messages: [{ role: 'user', content: 'Hello' }],
        max_tokens: 100
      })
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.content).toBeDefined();
  });

  test('should track usage in database', async () => {
    // Make API call
    await makeAPICall();

    // Check database
    const usage = await queryOcean(
      'SELECT * FROM api_usage WHERE user_id = $1 ORDER BY timestamp DESC LIMIT 1',
      [testUserId]
    );

    expect(usage[0].tokens_in).toBeGreaterThan(0);
    expect(usage[0].cost).toBeGreaterThan(0);
  });

  test('should enforce rate limits', async () => {
    // Make 101 requests (limit is 100/min)
    const requests = Array(101).fill(null).map(() => makeAPICall());
    const responses = await Promise.all(requests);

    const rateLimited = responses.filter(r => r.status === 429);
    expect(rateLimited.length).toBeGreaterThan(0);
  });
});
```

**Acceptance Criteria:**
- All tests passing
- > 80% code coverage
- No security vulnerabilities
- Performance benchmarks met

---

### 4.2 Security Hardening

**Tasks:**
- [ ] Enable SSL/TLS for all services
- [ ] Implement API key encryption
- [ ] Add SQL injection protection
- [ ] Add XSS protection
- [ ] Implement CORS properly
- [ ] Add security headers
- [ ] Set up fail2ban
- [ ] Configure log rotation

**Deliverables:**

**SSL/TLS Setup:**
```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d ocean.yourdomain.com

# Auto-renewal
sudo systemctl enable certbot.timer
```

**Security Headers:**
```typescript
// middleware/security.ts
import helmet from 'helmet';

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));
```

**API Key Encryption:**
```typescript
// utils/encryption.ts
import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY; // 32 bytes
const IV_LENGTH = 16;

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(
    'aes-256-cbc',
    Buffer.from(ENCRYPTION_KEY, 'hex'),
    iv
  );
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

export function decrypt(text: string): string {
  const parts = text.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const encrypted = parts[1];
  const decipher = crypto.createDecipheriv(
    'aes-256-cbc',
    Buffer.from(ENCRYPTION_KEY, 'hex'),
    iv
  );
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}
```

**Acceptance Criteria:**
- SSL/TLS enabled
- API keys encrypted at rest
- Security headers configured
- No critical vulnerabilities
- Logs properly rotated

---

## Deliverables Summary

### Infrastructure
- ✅ Hetzner server provisioned and secured
- ✅ Docker containers running (PostgreSQL, Neo4j, Qdrant, Redis, MinIO)
- ✅ All databases initialized with schema

### Admin Panel
- ✅ User management interface
- ✅ API key management interface
- ✅ Usage monitoring dashboard
- ✅ Secure connection to OCEAN database

### API Proxy
- ✅ Claude/Gemini/OpenAI proxy endpoints
- ✅ Usage tracking and logging
- ✅ Rate limiting
- ✅ Error handling

### Authentication
- ✅ NextAuth.js configured
- ✅ Login/logout flows
- ✅ RBAC middleware
- ✅ Session management

### Security
- ✅ SSL/TLS enabled
- ✅ API keys encrypted
- ✅ Security headers configured
- ✅ All tests passing

---

## Success Metrics

- [ ] All databases operational and accessible
- [ ] Admin panel functional with all features
- [ ] API proxy handling 100% of AI requests
- [ ] Authentication working for all users
- [ ] Zero critical security vulnerabilities
- [ ] All tests passing (>80% coverage)
- [ ] Documentation complete

---

## Next Phase

Once Phase 1 is complete, proceed to [Phase 2: Core Agent System](./ocean2.md)

---

**Phase Owner:** [Name]  
**Start Date:** [Date]  
**Target Completion:** [Date + 4 weeks]  
**Status:** Not Started
