# 🎯 Using OCEAN Status MCP in Windsurf

## Quick Start

The OCEAN Status MCP server is now running and ready to use!

---

## 🔧 Configure in Windsurf (OCEAN Window)

### Step 1: Open Windsurf Settings
1. Press `Cmd+,` (Settings)
2. Search for "MCP" or navigate to Extensions → MCP Servers

### Step 2: Add OCEAN Status Server

Add this configuration:

```json
{
  "ocean-status": {
    "command": "node",
    "args": ["/opt/ocean/mcp-servers/ocean-status/index.js"],
    "env": {
      "POSTGRES_HOST": "localhost",
      "POSTGRES_PASSWORD": "OceanSecure2026!DB"
    }
  }
}
```

### Step 3: Reload Windsurf
- Press `Cmd+Shift+P`
- Type: "Developer: Reload Window"

---

## 💬 Using the MCP with Cascade

Once configured, you can use natural language commands:

### Check Platform Status
```
@ocean-status get current platform status
```

### View Phase Progress
```
@ocean-status show progress for phase 1
```

### Log a Decision
```
@ocean-status log decision: We chose Docker Compose for service orchestration because it's simple, well-documented, and perfect for our multi-service setup. Impact: high
```

### View Decisions
```
@ocean-status show all architecture decisions
```

### Mark Task Complete
```
@ocean-status mark task 5 as complete
```

### Check Docker Status
```
@ocean-status check docker containers
```

---

## 📊 Example Workflow

### 1. Start Your Day
```
@ocean-status get current platform status
```

See what phase you're on and what's left to do.

### 2. Make a Technical Decision
```
@ocean-status log decision: Using Neo4j for knowledge graph because it's purpose-built for graph data and has excellent Cypher query language. Impact: critical
```

### 3. Complete Tasks
```
@ocean-status mark task 12 as complete
```

### 4. Check Progress
```
@ocean-status show progress for phase 1
```

### 5. Review Decisions
```
@ocean-status show all decisions
```

---

## 🗺️ Decision Map Integration

All decisions logged via MCP are stored in the database and will be visualized in the Decision Map UI (Phase 3).

**Decision Types:**
- `architecture` - System design decisions
- `database` - Database choices
- `framework` - Framework selections
- `api` - API design decisions
- `security` - Security implementations
- `deployment` - Deployment strategies
- `infrastructure` - Infrastructure choices

**Impact Levels:**
- `low` - Minor impact, easily reversible
- `medium` - Moderate impact, some effort to change
- `high` - Significant impact, requires planning to change
- `critical` - Foundational decision, very difficult to change

---

## 🔍 Direct Testing (Without Windsurf)

Test the MCP server directly from terminal:

```bash
cd /opt/ocean/mcp-servers/ocean-status

# Get status
echo '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"get_ocean_status","arguments":{}}}' | node index.js

# Log decision
echo '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"log_decision","arguments":{"type":"infrastructure","decision":"Docker Compose for services","reasoning":"Simple, well-documented, perfect for multi-service setup","impact":"high"}}}' | node index.js

# Get decisions
echo '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"get_decisions","arguments":{"limit":5}}}' | node index.js
```

---

## 📈 Monitoring from Old Server

You can also monitor OCEAN from your old Hetzner server:

```bash
# SSH into OCEAN server and check status
ssh ocean "cd /opt/ocean && PGPASSWORD='OceanSecure2026!DB' psql -h localhost -U ocean_user -d ocean_db -c 'SELECT * FROM prd_progress;'"

# Check Docker containers
ssh ocean "cd /opt/ocean && docker-compose ps"

# View recent decisions
ssh ocean "cd /opt/ocean && PGPASSWORD='OceanSecure2026!DB' psql -h localhost -U ocean_user -d ocean_db -c 'SELECT * FROM decisions ORDER BY created_at DESC LIMIT 5;'"
```

---

## 🎯 Best Practices

### Log Decisions Immediately
When you make a technical decision, log it right away:
```
@ocean-status log decision: [what] because [why]. Impact: [level]
```

### Review Progress Daily
Start each session by checking status:
```
@ocean-status get current platform status
```

### Document Impact
Always specify impact level to help future engineers understand importance.

### Use Descriptive Types
Use consistent decision types for better filtering and visualization.

---

## 🆘 Troubleshooting

### MCP Not Showing Up
1. Check Windsurf MCP settings
2. Verify Node.js is installed: `node --version`
3. Check MCP server logs in Windsurf console
4. Reload Windsurf window

### Database Connection Errors
```bash
# Test database connection
PGPASSWORD='OceanSecure2026!DB' psql -h localhost -U ocean_user -d ocean_db -c "SELECT 1"
```

### MCP Server Not Responding
```bash
# Restart MCP server (Windsurf will auto-restart)
# Or test manually:
cd /opt/ocean/mcp-servers/ocean-status
node index.js
```

---

## 📚 Next Steps

1. **Configure MCP in Windsurf** (follow steps above)
2. **Test with a simple command**: `@ocean-status get current platform status`
3. **Log your first decision** about the MCP server itself!
4. **Continue Phase 1 development** with MCP tracking

---

**The MCP server is your AI assistant for tracking OCEAN development!** 🌊
