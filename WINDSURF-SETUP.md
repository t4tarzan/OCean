# 🌊 OCEAN Windsurf Workspace Setup Guide

**Created:** January 11, 2026  
**Purpose:** Set up separate Windsurf workspace for OCEAN development

---

## ✅ Step 1: Local Setup (COMPLETED)

- ✅ Created `~/Projects/OCEAN` folder
- ✅ Cloned repository from GitHub
- ✅ Added SSH config for `ocean` host
- ✅ Tested SSH connection

---

## 🚀 Step 2: Open in Windsurf

### Option A: Open New Window (Recommended)

1. **Keep your current Windsurf window open** (education-platform)
2. Open a **new Windsurf window**:
   - Menu: File → New Window
   - Or: `Cmd+Shift+N`
3. In the new window:
   - File → Open Folder
   - Navigate to: `~/Projects/OCEAN`
   - Click "Open"

### Option B: Open in Current Window (If you want to switch)

1. File → Open Folder
2. Select `~/Projects/OCEAN`
3. Click "Open"

---

## 🔌 Step 3: Connect to Remote Server

In your OCEAN Windsurf window:

1. Press `Cmd+Shift+P` (Command Palette)
2. Type: "Remote-SSH: Connect to Host"
3. Select: **ocean** (from the list)
4. Wait for connection to establish
5. When prompted, select: "Open Folder"
6. Enter path: `/opt/ocean`
7. Click "OK"

**You're now connected to the new OCEAN server!**

---

## 🔧 Step 4: Set Up Port Forwarding

Forward these ports to access services locally:

1. Press `Cmd+Shift+P`
2. Type: "Forward a Port"
3. Add each port:

| Port | Service | URL |
|------|---------|-----|
| 5432 | PostgreSQL | localhost:5432 |
| 6379 | Redis | localhost:6379 |
| 7474 | Neo4j Browser | http://localhost:7474 |
| 7687 | Neo4j Bolt | bolt://localhost:7687 |
| 6333 | Qdrant API | http://localhost:6333 |
| 9001 | MinIO Console | http://localhost:9001 |
| 3000 | Frontend (future) | http://localhost:3000 |
| 3001 | API Proxy (future) | http://localhost:3001 |

---

## ✅ Step 5: Verify Setup

In the Windsurf terminal (connected to OCEAN server):

```bash
# Check you're on the right server
hostname
# Should show: ubuntu-32gb-hel1-1

# Check you're in the right folder
pwd
# Should show: /opt/ocean

# List files
ls -la

# Check Docker containers
docker-compose ps

# Check database
PGPASSWORD='OceanSecure2026!DB' psql -h localhost -U ocean_user -d ocean_db -c "SELECT * FROM prd_progress;"
```

---

## 🎯 Workspace Isolation Confirmed

| Aspect | Old Workspace | New OCEAN Workspace |
|--------|---------------|---------------------|
| **Server** | 65.109.9.212 (hetzner-dev) | 77.42.44.61 (ocean) |
| **SSH Alias** | `hetzner-dev` | `ocean` |
| **Local Folder** | `/opt/education-platform` | `~/Projects/OCEAN` |
| **Remote Folder** | `/opt/education-platform` | `/opt/ocean` |
| **Git Repo** | education-platform | OCean |
| **Database** | education_db | ocean_db |
| **Windsurf Window** | Window 1 | Window 2 |

**No conflicts!** Everything is completely separate.

---

## 💡 Daily Workflow

### Switching Between Projects

**Method 1: Multiple Windows**
- Keep both Windsurf windows open
- Use `Cmd+~` to switch between them
- Or use Mission Control/Spaces

**Method 2: Reconnect**
- Close and reopen as needed
- Use SSH aliases: `ssh hetzner-dev` or `ssh ocean`

### Git Workflow in OCEAN

```bash
# On OCEAN server (/opt/ocean)
git pull                    # Get latest changes
git add .                   # Stage changes
git commit -m "message"     # Commit with description
git push origin main        # Push to GitHub
```

### Database Commands

```bash
# View progress
PGPASSWORD='OceanSecure2026!DB' psql -h localhost -U ocean_user -d ocean_db -c "SELECT * FROM prd_progress;"

# Mark task complete
PGPASSWORD='OceanSecure2026!DB' psql -h localhost -U ocean_user -d ocean_db -c "UPDATE prd_tasks SET completed = true WHERE id = <task_id>;"
```

### Docker Commands

```bash
# View containers
docker-compose ps

# View logs
docker-compose logs -f neo4j

# Restart service
docker-compose restart neo4j

# Stop all
docker-compose down

# Start all
docker-compose up -d
```

---

## 🔍 Quick Access URLs (After Port Forwarding)

Once ports are forwarded, access services from your Mac:

- **Neo4j Browser:** http://localhost:7474
  - Username: `neo4j`
  - Password: `OceanNeo4j2026!`

- **Qdrant API:** http://localhost:6333/collections

- **MinIO Console:** http://localhost:9001
  - Username: `oceanadmin`
  - Password: `OceanMinio2026!`

---

## 📚 Documentation Quick Links

In `/opt/ocean`:
- `README.md` - Overview and current status
- `STATUS.md` - Quick reference guide
- `IMPLEMENTATION_LOG.md` - Detailed progress
- `ocean1.md` - Phase 1 PRD (current)
- `ocean2.md` through `ocean6.md` - Future phases

---

## 🆘 Troubleshooting

### Can't connect via SSH
```bash
# Test connection
ssh ocean

# If password prompt, add SSH key
ssh-copy-id ocean
```

### Wrong server/folder
```bash
# Check hostname
hostname

# Check path
pwd

# Should be: ubuntu-32gb-hel1-1 and /opt/ocean
```

### Port forwarding not working
1. Check ports aren't already in use
2. Restart Windsurf
3. Reconnect to remote server
4. Re-add port forwards

### Git push fails
```bash
# Check remote
git remote -v

# Should show: https://ghp_...@github.com/t4tarzan/OCean.git
```

---

## ✅ Setup Complete Checklist

- [ ] New Windsurf window opened
- [ ] Connected to `ocean` server
- [ ] Opened `/opt/ocean` folder
- [ ] Port forwarding configured
- [ ] Verified hostname and path
- [ ] Tested database connection
- [ ] Checked Docker containers
- [ ] Accessed Neo4j browser
- [ ] Read current documentation

---

## 🎉 You're Ready!

Your OCEAN workspace is now completely set up and isolated from your education platform work.

**Next Steps:**
1. Review `STATUS.md` for current progress
2. Check `IMPLEMENTATION_LOG.md` for details
3. Continue with Phase 1 Week 1 remaining tasks
4. Start building! 🌊

---

**Questions?** Check the documentation in `/opt/ocean` or review commit history on GitHub.
