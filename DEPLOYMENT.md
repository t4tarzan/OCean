# 🌊 OCEAN Platform - Deployment Guide

**Last Updated:** January 11, 2026  
**Phase 1 Status:** ✅ Complete

---

## Quick Start

### 1. Start All Services

```bash
# Start Docker containers (PostgreSQL, Neo4j, Qdrant, Redis, MinIO)
cd /opt/ocean
docker-compose up -d

# Start API Proxy Service (Port 3001)
cd /opt/ocean/services/api-proxy
npm run dev

# Start Admin Panel (Port 3100)
cd /opt/ocean/admin-panel
npm run dev
```

### 2. Verify Services

```bash
# Check Docker containers
docker ps

# Test API Proxy
curl http://localhost:3001/health

# Test Admin Panel
curl http://localhost:3100
```

---

## Infrastructure Overview

### Server Details
- **Provider:** Hetzner
- **IP:** 77.42.44.61
- **Specs:** 8 vCPU, 32GB RAM, 240GB SSD
- **OS:** Ubuntu 22.04 LTS

### Services Running

| Service | Port | Status | Purpose |
|---------|------|--------|---------|
| PostgreSQL | 5432 | ✅ Running | Primary database |
| Neo4j | 7474, 7687 | ✅ Running | Knowledge graph |
| Qdrant | 6333, 6334 | ✅ Running | Vector database |
| Redis | 6379 | ✅ Running | Cache |
| MinIO | 9000, 9001 | ✅ Running | Object storage |
| API Proxy | 3001 | ✅ Running | AI API gateway |
| Admin Panel | 3100 | ✅ Running | Management UI |

---

## Database Credentials

### PostgreSQL
```bash
Host: localhost
Port: 5432
Database: ocean_db
User: ocean_user
Password: OceanSecure2026!DB
```

### Neo4j
```bash
URL: http://localhost:7474
Username: neo4j
Password: OceanNeo4j2026!
```

### MinIO
```bash
Console: http://localhost:9001
Access Key: oceanadmin
Secret Key: OceanMinio2026!
```

---

## API Keys Configuration

All API keys are stored in `/opt/ocean/services/api-proxy/.env`:

```bash
# AI Provider API Keys
CLAUDE_API_KEY=***REMOVED_ANTHROPIC_KEY***
GEMINI_API_KEY=***REMOVED_GEMINI_KEY***
OPENAI_API_KEY=***REMOVED_OPENAI_KEY***
GROQ_API_KEY=***REMOVED_GROQ_KEY***
```

---

## API Proxy Endpoints

### Base URL
```
http://localhost:3001
```

### Available Endpoints

#### Claude (Anthropic)
```bash
POST /api/claude/messages
Authorization: Bearer <user_token>

{
  "model": "claude-3-sonnet-20240229",
  "messages": [{"role": "user", "content": "Hello"}],
  "max_tokens": 1024
}
```

#### OpenAI
```bash
POST /api/openai/chat/completions
Authorization: Bearer <user_token>

{
  "model": "gpt-3.5-turbo",
  "messages": [{"role": "user", "content": "Hello"}],
  "max_tokens": 1024
}
```

#### Gemini
```bash
POST /api/gemini/generate
Authorization: Bearer <user_token>

{
  "model": "gemini-2.0-flash",
  "prompt": "Hello",
  "maxOutputTokens": 1024
}
```

#### Groq
```bash
POST /api/groq/chat/completions
Authorization: Bearer <user_token>

{
  "model": "llama-3.1-70b-versatile",
  "messages": [{"role": "user", "content": "Hello"}],
  "max_tokens": 1024
}
```

---

## Database Schema

### Key Tables

**PostgreSQL:**
- `platform_users` - User accounts
- `teams` - Team management
- `projects` - Project tracking
- `features` - Feature management
- `agents` - AI agent registry
- `api_usage` - Usage tracking
- `decisions` - Architecture decisions
- `prd_phases`, `prd_weeks`, `prd_tasks` - PRD tracking

**Neo4j:**
- 14 Technology nodes (React, Next.js, PostgreSQL, etc.)
- 4 Pattern nodes (API Proxy, Multi-Agent, Knowledge Graph, RBAC)
- 11 Relationships between technologies

---

## Security Features

### Implemented
- ✅ SSH key-based authentication
- ✅ UFW firewall configured
- ✅ fail2ban for SSH protection
- ✅ Security headers (Helmet.js)
- ✅ CORS configuration
- ✅ Rate limiting (100 req/min)
- ✅ API key encryption utilities
- ✅ Log rotation
- ✅ Automatic security updates

### Firewall Rules
```bash
sudo ufw status

Status: active
To                         Action      From
--                         ------      ----
22/tcp                     ALLOW       Anywhere
80/tcp                     ALLOW       Anywhere
443/tcp                    ALLOW       Anywhere
3000/tcp                   ALLOW       Anywhere
5432/tcp                   LIMIT       Anywhere
```

---

## Monitoring & Logs

### Log Locations
```bash
# API Proxy logs
/opt/ocean/services/api-proxy/logs/

# Admin Panel logs
/opt/ocean/admin-panel/logs/

# Docker logs
docker logs ocean-postgres
docker logs ocean-neo4j
docker logs ocean-qdrant
docker logs ocean-redis
docker logs ocean-minio
```

### Log Rotation
Configured in `/etc/logrotate.d/ocean-services`:
- Daily rotation
- 14 days retention
- Compressed archives

---

## Backup & Recovery

### Database Backups

**PostgreSQL:**
```bash
# Backup
docker exec ocean-postgres pg_dump -U ocean_user ocean_db > backup.sql

# Restore
docker exec -i ocean-postgres psql -U ocean_user ocean_db < backup.sql
```

**Neo4j:**
```bash
# Backup
docker exec ocean-neo4j neo4j-admin database dump neo4j --to-path=/backups

# Restore
docker exec ocean-neo4j neo4j-admin database load neo4j --from-path=/backups
```

---

## Testing

### Run API Tests
```bash
cd /opt/ocean/services/api-proxy
node test-apis.js
```

Expected output:
```
✅ OpenAI: SUCCESS
✅ Claude: SUCCESS
✅ Gemini: SUCCESS
✅ Groq: SUCCESS
```

### Run Unit Tests
```bash
cd /opt/ocean/services/api-proxy
npm test
```

---

## Troubleshooting

### Services Not Starting

**Check Docker:**
```bash
docker-compose ps
docker-compose logs
```

**Restart Services:**
```bash
docker-compose restart
```

### Database Connection Issues

**Check PostgreSQL:**
```bash
docker exec -it ocean-postgres psql -U ocean_user -d ocean_db
```

**Check Neo4j:**
```bash
# Browser: http://localhost:7474
# Credentials: neo4j / OceanNeo4j2026!
```

### API Proxy Errors

**Check logs:**
```bash
cd /opt/ocean/services/api-proxy
npm run dev
```

**Verify API keys:**
```bash
cat /opt/ocean/services/api-proxy/.env
```

---

## Production Deployment

### Build for Production

**API Proxy:**
```bash
cd /opt/ocean/services/api-proxy
npm run build
npm start
```

**Admin Panel:**
```bash
cd /opt/ocean/admin-panel
npm run build
npm start
```

### Process Management (PM2)

```bash
# Install PM2
npm install -g pm2

# Start services
pm2 start /opt/ocean/services/api-proxy/dist/index.js --name ocean-api-proxy
pm2 start npm --name ocean-admin-panel -- start --prefix /opt/ocean/admin-panel

# Save configuration
pm2 save
pm2 startup
```

---

## Next Steps (Phase 2)

1. Implement NextAuth.js authentication
2. Add user login/logout flows
3. Implement RBAC middleware
4. Create multi-agent orchestration framework
5. Integrate AutoCoder system

---

## Support & Documentation

- **Main README:** `/opt/ocean/README.md`
- **Phase 1 Details:** `/opt/ocean/ocean1.md`
- **PRD Overview:** `/opt/ocean/ocean-prd-overview.md`
- **MCP Usage:** `/opt/ocean/MCP-USAGE-GUIDE.md`

---

## Contact

For issues or questions, check the documentation or review the implementation details in the respective service directories.
