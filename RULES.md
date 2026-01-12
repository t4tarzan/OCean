# 🌊 OCEAN Development Rules

**Last Updated:** January 12, 2026

---

## 🎯 Core Principle: Database-First Approach

**ALWAYS load context from database before taking any action.**

### Before Every Task:
1. **Run context loader:** `/opt/ocean/scripts/load-context.sh`
2. **Check database state:**
   - Query `prd_progress` for current phase status
   - Query `decisions` for recent architectural choices
   - Query `agents` for registered agents
   - Query `agent_tasks` for active work
3. **Verify alignment:** Ensure actions match database reality, not assumptions

---

## 📋 Implementation Workflow

### Step 1: Load Context
```bash
cd /opt/ocean
./scripts/load-context.sh
```

### Step 2: Read Phase Specification
- Read the relevant `ocean[1-6].md` file completely
- Understand all tasks, deliverables, and acceptance criteria
- Note dependencies and prerequisites

### Step 3: Create Task Plan
- Use `update_plan` tool to create comprehensive task list
- Break down each section of ocean.md into actionable items
- Mark dependencies and order of execution

### Step 4: Implement
- Follow the task plan sequentially
- Implement each feature according to specification
- Write code, create files, configure services

### Step 5: Verify
- Test each implementation
- Verify against acceptance criteria
- Check database for updated state

### Step 6: Document
- Log decisions using `./scripts/log-decision.sh`
- Update ocean[X].md with completion status
- Update `prd_progress` table in database

---

## 📖 Phase-by-Phase Execution

### For Each Phase (ocean1.md through ocean6.md):

1. **Read Complete Specification**
   - Read entire ocean[X].md file
   - Understand objectives, deliverables, milestones
   - Note all tasks and acceptance criteria

2. **Create Comprehensive Task List**
   ```
   update_plan with:
   - All Week 1 tasks
   - All Week 2 tasks
   - All Week 3 tasks
   - All Week 4 tasks
   - All Week 5 tasks (if applicable)
   - Testing and verification tasks
   - Documentation tasks
   ```

3. **Execute Tasks Sequentially**
   - Complete each task in order
   - Mark as complete in update_plan
   - Verify before moving to next

4. **Update Database**
   - Update `prd_progress` table
   - Log decisions in `decisions` table
   - Update relevant entity tables

5. **Update Documentation**
   - Mark tasks complete in ocean[X].md
   - Update status indicators
   - Log completion in decisions

---

## ✅ Task Completion Checklist

For every task:
- [ ] Context loaded from database
- [ ] Specification read and understood
- [ ] Task plan created with update_plan
- [ ] Implementation complete
- [ ] Tests passing
- [ ] Acceptance criteria met
- [ ] Decision logged
- [ ] Database updated
- [ ] Documentation updated
- [ ] Verified against database state

---

## 🔄 Continuous Verification

### After Every Major Action:
1. Run `./scripts/load-context.sh`
2. Verify database state matches expectations
3. Check that phase progress is accurate
4. Ensure decisions are logged

### Before Moving to Next Phase:
1. Verify all tasks complete in database
2. Confirm all acceptance criteria met
3. Update phase status to 'completed'
4. Log phase completion decision
5. Update ocean[X].md status to ✅ Complete

---

## 📝 Decision Logging

Use `./scripts/log-decision.sh` for:
- Architecture decisions
- Technology choices
- Implementation approaches
- Phase completions
- Major milestones

**Format:**
```bash
./scripts/log-decision.sh "type" "decision" "reasoning" "impact"
```

**Types:** architecture, database, framework, api, security, deployment, infrastructure, agent, implementation, integration

**Impact:** critical, high, medium, low

### Group Related Decisions
**IMPORTANT:** Group multiple related architecture/implementation decisions together chronologically in a single decision entry. Write them as coherent paragraphs describing what was accomplished, not individual steps.

**Example:**
```bash
./scripts/log-decision.sh "architecture" "Phase 2 Week 1 Infrastructure Complete" \
"Built agent registry with 5 database tables, implemented Redis message bus for inter-agent communication, created base agent class with lifecycle management, deployed Express API on port 3002 with health monitoring and task coordination endpoints. System ready for specialized agent implementation." "high"
```

**NOT:**
```bash
# Don't do this - too granular
./scripts/log-decision.sh "architecture" "Created agents table" "..." "medium"
./scripts/log-decision.sh "architecture" "Created agent_tasks table" "..." "medium"
./scripts/log-decision.sh "architecture" "Created Redis message bus" "..." "medium"
```

---

## 🚫 What NOT to Do

- ❌ Never assume phase status - always check database
- ❌ Never skip reading complete ocean.md specification
- ❌ Never implement without creating task plan first
- ❌ Never move to next task without verifying current one
- ❌ Never forget to log decisions
- ❌ Never update documentation without updating database
- ❌ Never create multiple summary documents - use decisions table
- ❌ Never work from memory - always load fresh context
- ❌ **Never create new .md documentation files during implementation**
- ❌ **Never log individual small steps as separate decisions**
- ❌ Never create PHASE-COMPLETE.md, WEEK-SUMMARY.md, or similar files

---

## ✅ What TO Do

- ✅ Always load context from database first
- ✅ Always read complete specification before starting
- ✅ Always create comprehensive task plan
- ✅ Always implement according to specification
- ✅ Always verify against acceptance criteria
- ✅ Always log decisions chronologically (grouped, not individual steps)
- ✅ Always update database to reflect reality
- ✅ Always check database state after actions
- ✅ Always follow ocean.md specifications exactly
- ✅ Always use update_plan for task tracking
- ✅ **Always push to GitHub frequently to avoid git history bloat**
- ✅ **Use dashboard logs/documentation section for updates, not new files**

---

## 🎯 Current Phase Tracking

**Check database for current phase:**
```sql
SELECT phase_number, phase_name, status, completion_percentage 
FROM prd_progress 
WHERE status = 'in_progress' 
ORDER BY phase_number LIMIT 1;
```

**This tells you:**
- Which ocean.md file to follow
- Current progress percentage
- What tasks remain

---

## 📊 Progress Tracking

### Database Tables to Monitor:
- `prd_progress` - Phase completion status
- `prd_phases` - Phase definitions
- `prd_weeks` - Weekly milestones
- `prd_tasks` - Individual tasks
- `decisions` - All decisions made
- `agents` - Registered agents
- `agent_tasks` - Active agent work

### Update Frequency:
- After each major task: Update task status
- After each week: Update week completion
- After each phase: Update phase status
- After each decision: Log in decisions table

---

## 🔍 Verification Commands

```bash
# Load context
./scripts/load-context.sh

# Check current phase
PGPASSWORD=OceanSecure2026!DB psql -U ocean_user -d ocean_db \
  -c "SELECT * FROM prd_progress WHERE status='in_progress';"

# Check recent decisions
PGPASSWORD=OceanSecure2026!DB psql -U ocean_user -d ocean_db \
  -c "SELECT type, decision, created_at FROM decisions ORDER BY created_at DESC LIMIT 10;"

# Check registered agents
PGPASSWORD=OceanSecure2026!DB psql -U ocean_user -d ocean_db \
  -c "SELECT type, COUNT(*) FROM agents GROUP BY type;"
```

---

## 🌊 OCEAN Workflow Summary

```
1. Load Context (database) 
   ↓
2. Read ocean[X].md (complete specification)
   ↓
3. Create Task Plan (update_plan tool)
   ↓
4. Implement Tasks (follow specification)
   ↓
5. Verify Implementation (test & check)
   ↓
6. Update Database (prd_progress, decisions)
   ↓
7. Update Documentation (ocean[X].md status)
   ↓
8. Load Context Again (verify state)
   ↓
9. Repeat for next task/week/phase
```

---

**Remember: The database is the source of truth. Always align with it.**
