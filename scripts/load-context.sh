#!/bin/bash

# OCEAN Context Loader - Database-First Approach
# Always run this before making decisions or taking actions

echo "🌊 OCEAN Context Loader - Database-First Approach"
echo "=================================================="
echo ""

PGPASSWORD=OceanSecure2026!DB psql -U ocean_user -d ocean_db << 'EOF'

-- Current Phase Status
\echo '📊 CURRENT PHASE STATUS:'
SELECT 
    phase_number,
    phase_name,
    status,
    completion_percentage || '%' as progress,
    COALESCE(started_at::text, 'Not started') as started,
    COALESCE(completed_at::text, 'In progress') as completed
FROM prd_progress 
WHERE status IN ('in_progress', 'completed')
ORDER BY phase_number;

\echo ''
\echo '🎯 ACTIVE TASKS:'
SELECT phase_number, phase_name, total_tasks, completed_tasks, 
       (completed_tasks::float / NULLIF(total_tasks, 0) * 100)::int || '%' as task_progress
FROM prd_progress 
WHERE status = 'in_progress';

\echo ''
\echo '🤖 REGISTERED AGENTS:'
SELECT type, COUNT(*) as count, 
       COUNT(*) FILTER (WHERE status = 'idle') as idle,
       COUNT(*) FILTER (WHERE status = 'busy') as busy
FROM agents 
GROUP BY type
ORDER BY type;

\echo ''
\echo '📝 RECENT DECISIONS (Last 5):'
SELECT 
    type,
    LEFT(decision, 60) || '...' as decision_summary,
    impact,
    created_at::date as date
FROM decisions 
ORDER BY created_at DESC 
LIMIT 5;

\echo ''
\echo '✅ NEXT ACTIONS:'
SELECT phase_name, status, completion_percentage 
FROM prd_progress 
WHERE status = 'in_progress' 
ORDER BY phase_number 
LIMIT 1;

EOF

echo ""
echo "=================================================="
echo "Context loaded. Proceed with database-aligned actions."
