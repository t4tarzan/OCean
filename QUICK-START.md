# 🚀 OCEAN Quick Start

**For Engineers: Get up and running in 5 minutes**

---

## 1️⃣ Connect to Server

```bash
ssh ocean
cd /opt/ocean
```

---

## 2️⃣ Check Status

```bash
# View current progress
cat STATUS.md

# Check Docker containers
docker-compose ps

# View database progress
PGPASSWORD='OceanSecure2026!DB' psql -h localhost -U ocean_user -d ocean_db -c "SELECT * FROM prd_progress;"
```

---

## 3️⃣ Service URLs

| Service | URL | Credentials |
|---------|-----|-------------|
| Neo4j | http://77.42.44.61:7474 | neo4j / OceanNeo4j2026! |
| Qdrant | http://77.42.44.61:6333 | No auth |
| MinIO | http://77.42.44.61:9001 | oceanadmin / OceanMinio2026! |

---

## 4️⃣ Git Workflow

```bash
git pull                      # Get latest
git add .                     # Stage changes
git commit -m "description"   # Commit
git push origin main          # Push
```

---

## 5️⃣ Current Phase

**Phase 1, Week 1** - Infrastructure Setup (75% complete)

**Next:** Complete firewall config, then start Week 2 (Admin Panel)

---

## 📚 Full Docs

- `README.md` - Overview
- `STATUS.md` - Current status
- `IMPLEMENTATION_LOG.md` - Detailed progress
- `WINDSURF-SETUP.md` - Workspace setup
- `ocean1.md` - Phase 1 PRD

---

**GitHub:** https://github.com/t4tarzan/OCean  
**Server:** 77.42.44.61 (ocean)  
**Location:** /opt/ocean
