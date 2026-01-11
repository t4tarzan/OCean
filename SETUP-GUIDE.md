# 🌊 OCEAN Platform - Server Setup Guide

**Server:** oc  
**IP:** 77.42.44.61  
**User:** root  
**Initial Password:** 7PnkiNraufEP7skKnskx

---

## Step 1: First Login & Password Change

The server requires a password change on first login. Follow these steps:

### From Your Local Machine:

```bash
ssh root@77.42.44.61
```

When prompted:
1. Enter initial password: `7PnkiNraufEP7skKnskx`
2. Enter new password (recommended): `OceanPlatform2026!Secure`
3. Confirm new password

---

## Step 2: Run Automated Setup Script

Once logged in to the new server, run:

```bash
# Download and run setup script
curl -o setup.sh https://raw.githubusercontent.com/t4tarzan/OCean/main/setup-new-server.sh
chmod +x setup.sh
./setup.sh
```

This script will:
- ✅ Update system packages
- ✅ Install PostgreSQL, Redis, Docker, Node.js
- ✅ Configure firewall (UFW)
- ✅ Clone OCEAN repository from GitHub
- ✅ Create `ocean_db` database
- ✅ Load complete database schema
- ✅ Load PRD tracking data
- ✅ Create environment configuration

**Duration:** ~10-15 minutes

---

## Step 3: Verify Installation

After the script completes, verify everything is working:

```bash
# Check PostgreSQL
sudo systemctl status postgresql

# Check Redis
sudo systemctl status redis-server

# Check Docker
docker --version

# View PRD progress
PGPASSWORD='OceanSecure2026!DB' psql -U ocean_user -d ocean_db -c "SELECT * FROM prd_progress;"
```

Expected output:
```
phase_number | phase_name                  | status      | total_tasks | completed_tasks | completion_percentage
-------------+-----------------------------+-------------+-------------+-----------------+----------------------
1            | Foundation & Infrastructure | not_started | 45          | 0               | 0.00
2            | Core Agent System           | not_started | 38          | 0               | 0.00
3            | AutoCoder Integration       | not_started | 28          | 0               | 0.00
4            | Letta & Knowledge Systems   | not_started | 35          | 0               | 0.00
5            | Collaboration & Social      | not_started | 32          | 0               | 0.00
6            | Advanced Features & Polish  | not_started | 30          | 0               | 0.00
```

---

## Step 4: Start Phase 1

```bash
cd /opt/ocean
cat ocean1.md
```

### Phase 1, Week 1 Tasks:

1. **Server Provisioning** ✅ (Already done!)
2. **Docker Setup**
   ```bash
   cd /opt/ocean
   # Create docker-compose.yml (see ocean1.md for details)
   docker-compose up -d
   ```

3. **Database Configuration** ✅ (Already done!)

4. **Neo4j Setup**
   ```bash
   docker run -d \
     --name neo4j \
     -p 7474:7474 -p 7687:7687 \
     -e NEO4J_AUTH=neo4j/OceanNeo4j2026! \
     neo4j:latest
   ```

5. **Qdrant Setup**
   ```bash
   docker run -d \
     --name qdrant \
     -p 6333:6333 \
     qdrant/qdrant
   ```

---

## Manual Setup (Alternative)

If you prefer manual setup instead of the automated script:

### 1. Update System
```bash
apt-get update && apt-get upgrade -y
```

### 2. Install PostgreSQL
```bash
apt-get install -y postgresql postgresql-contrib

# Create database
sudo -u postgres psql <<EOF
CREATE DATABASE ocean_db;
CREATE USER ocean_user WITH PASSWORD 'OceanSecure2026!DB';
GRANT ALL PRIVILEGES ON DATABASE ocean_db TO ocean_user;
\c ocean_db
GRANT ALL ON SCHEMA public TO ocean_user;
\q
EOF
```

### 3. Clone Repository
```bash
cd /opt
git clone https://github.com/t4tarzan/OCean.git ocean
cd ocean
```

### 4. Load Schema
```bash
PGPASSWORD='OceanSecure2026!DB' psql -U ocean_user -d ocean_db -f database/schema.sql
```

### 5. Load PRD Tracking
```bash
cd scripts
npm install pg
export OCEAN_DB_PASSWORD='OceanSecure2026!DB'
npx tsx load-prd-to-db.ts
```

---

## Database Credentials

**Database:** ocean_db  
**User:** ocean_user  
**Password:** OceanSecure2026!DB  
**Host:** localhost  
**Port:** 5432

**Connection String:**
```
postgresql://ocean_user:OceanSecure2026!DB@localhost:5432/ocean_db
```

---

## Useful Commands

### View Progress
```bash
# Overall progress
PGPASSWORD='OceanSecure2026!DB' psql -U ocean_user -d ocean_db -c "SELECT * FROM prd_progress;"

# Current week tasks
PGPASSWORD='OceanSecure2026!DB' psql -U ocean_user -d ocean_db -c "SELECT * FROM prd_current_week;"

# Mark task complete
PGPASSWORD='OceanSecure2026!DB' psql -U ocean_user -d ocean_db -c "UPDATE prd_tasks SET completed = true WHERE id = 1;"
```

### Update Phase Status
```bash
# Start Phase 1
PGPASSWORD='OceanSecure2026!DB' psql -U ocean_user -d ocean_db -c "UPDATE prd_phases SET status = 'in_progress', start_date = CURRENT_DATE WHERE phase_number = 1;"
```

### Git Operations
```bash
cd /opt/ocean
git pull  # Get latest updates
git log   # View commit history
```

---

## Firewall Configuration

The setup script configures UFW with these rules:

```bash
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw allow 3000/tcp  # Frontend
ufw allow 3001/tcp  # API Proxy
```

---

## Next Steps After Setup

1. ✅ **Read Phase 1 Details:** `/opt/ocean/ocean1.md`
2. ✅ **Set up Docker containers** (PostgreSQL, Neo4j, Qdrant, Redis)
3. ✅ **Configure Admin Panel** (port 3100)
4. ✅ **Build API Proxy** (port 3001)
5. ✅ **Implement Authentication** (NextAuth.js)

---

## Troubleshooting

### PostgreSQL Connection Issues
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Restart PostgreSQL
sudo systemctl restart postgresql

# Check logs
sudo tail -f /var/log/postgresql/postgresql-*.log
```

### Permission Issues
```bash
# Grant permissions
sudo -u postgres psql -d ocean_db -c "GRANT ALL ON SCHEMA public TO ocean_user;"
```

### Port Already in Use
```bash
# Check what's using a port
sudo lsof -i :3000

# Kill process
sudo kill -9 <PID>
```

---

## Support

- **GitHub Repository:** https://github.com/t4tarzan/OCean
- **Documentation:** `/opt/ocean/README.md`
- **Phase Details:** `/opt/ocean/ocean1.md` through `ocean6.md`

---

**Ready to build OCEAN! 🌊**
