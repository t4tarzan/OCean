# 🌊 OCEAN Status MCP Server

Model Context Protocol server for monitoring OCEAN platform status and logging decisions.

## Installation

Already installed at `/opt/ocean/mcp-servers/ocean-status`

## Configuration

### For Windsurf

Add to your Windsurf MCP settings:

```json
{
  "mcpServers": {
    "ocean-status": {
      "command": "node",
      "args": ["/opt/ocean/mcp-servers/ocean-status/index.js"],
      "env": {
        "POSTGRES_HOST": "localhost",
        "POSTGRES_PASSWORD": "OceanSecure2026!DB"
      }
    }
  }
}
```

### For Claude Desktop

Add to `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "ocean-status": {
      "command": "ssh",
      "args": [
        "ocean",
        "node",
        "/opt/ocean/mcp-servers/ocean-status/index.js"
      ]
    }
  }
}
```

## Available Tools

### get_ocean_status
Get current OCEAN platform status including phase progress, services, and recent activity.

**Usage:**
```
Use the ocean-status MCP to get current platform status
```

**Returns:**
- Current phase and progress
- Overall completion percentage
- All phases status
- Task counts

### get_phase_progress
Get detailed progress for a specific phase.

**Parameters:**
- `phase_number` (number): Phase number 1-6

**Usage:**
```
Get progress for phase 1 using ocean-status MCP
```

### log_decision
Log an architecture or technical decision.

**Parameters:**
- `type` (string): Decision type (architecture, database, framework, api, etc.)
- `decision` (string): The decision made
- `reasoning` (string): Why this decision was made
- `impact` (string): Impact level (low, medium, high, critical)

**Usage:**
```
Log a decision: We chose PostgreSQL as primary database because of ACID compliance and excellent tooling. Impact: critical
```

### get_decisions
Get all logged decisions, optionally filtered by type.

**Parameters:**
- `type` (string, optional): Filter by decision type
- `limit` (number, optional): Number of decisions to return (default: 10)

**Usage:**
```
Get all architecture decisions using ocean-status MCP
```

### mark_task_complete
Mark a PRD task as complete.

**Parameters:**
- `task_id` (number): Task ID to mark complete

**Usage:**
```
Mark task 5 as complete using ocean-status MCP
```

### get_docker_status
Get status of all Docker containers.

**Usage:**
```
Check Docker container status using ocean-status MCP
```

## Resources

### ocean://status
Current status of OCEAN platform (JSON)

### ocean://decisions
All logged architecture decisions (JSON)

## Testing

Test the MCP server locally:

```bash
cd /opt/ocean/mcp-servers/ocean-status
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | node index.js
```

## Examples

### Check Platform Status
```bash
# Via MCP
echo '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"get_ocean_status","arguments":{}}}' | node index.js
```

### Log a Decision
```bash
# Via MCP
echo '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"log_decision","arguments":{"type":"database","decision":"Use PostgreSQL as primary database","reasoning":"ACID compliance, excellent tooling, team expertise","impact":"critical"}}}' | node index.js
```

### Get Decisions
```bash
# Via MCP
echo '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"get_decisions","arguments":{"limit":5}}}' | node index.js
```

## Database Schema

The MCP server uses these tables:
- `prd_phases` - Phase tracking
- `prd_weeks` - Week tracking
- `prd_tasks` - Task tracking
- `decisions` - Decision log (created automatically)

## Troubleshooting

### Connection Issues
```bash
# Test database connection
PGPASSWORD='OceanSecure2026!DB' psql -h localhost -U ocean_user -d ocean_db -c "SELECT 1"
```

### MCP Not Loading
1. Check Node.js version: `node --version` (should be 18+)
2. Check dependencies: `npm list` in mcp-servers/ocean-status
3. Check logs in Windsurf console

## Development

To modify the MCP server:

1. Edit `index.js`
2. Restart Windsurf or reload MCP servers
3. Test changes

## Integration with Decision Map

Decisions logged via this MCP will be available for visualization in the Decision Map UI (Phase 3).

