/**
 * Performance Optimization Indexes
 * =================================
 * 
 * Add indexes to improve query performance across the platform.
 * Created concurrently to avoid locking tables.
 */

-- Features table indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_features_team_status 
ON features(team_id, status);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_features_assigned_agent 
ON features(assigned_agent_id) WHERE assigned_agent_id IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_features_completed_at 
ON features(completed_at DESC) WHERE completed_at IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_features_created_at 
ON features(created_at DESC);

-- Decisions table indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_decisions_project_type 
ON decisions(project_id, type);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_decisions_created_at 
ON decisions(created_at DESC);

-- Activity feed indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_activity_team_created 
ON activity_feed(team_id, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_activity_type 
ON activity_feed(activity_type);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_activity_actor 
ON activity_feed(actor_id, actor_type);

-- Patterns table indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_patterns_category 
ON patterns(category);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_patterns_times_used 
ON patterns(times_used DESC);

-- Session recordings indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_recordings_user_created 
ON session_recordings(user_id, created_at DESC);

-- User achievements indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_achievements_user 
ON user_achievements(user_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_achievements_unlocked 
ON user_achievements(unlocked_at DESC);

-- Team members indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_team_members_team 
ON team_members(team_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_team_members_user 
ON team_members(user_id);

-- Materialized view for team statistics
CREATE MATERIALIZED VIEW IF NOT EXISTS team_stats AS
SELECT 
  team_id,
  COUNT(*) FILTER (WHERE status = 'done') as features_completed,
  AVG(EXTRACT(EPOCH FROM (completed_at - created_at))/60) as avg_time_to_ship,
  COUNT(*) FILTER (WHERE status = 'done') * 100.0 / NULLIF(COUNT(*), 0) as success_rate,
  COUNT(*) FILTER (WHERE assigned_agent_id IS NOT NULL) * 100.0 / NULLIF(COUNT(*), 0) as ai_efficiency
FROM features
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY team_id;

CREATE UNIQUE INDEX IF NOT EXISTS idx_team_stats_team ON team_stats(team_id);

-- Function to refresh team stats
CREATE OR REPLACE FUNCTION refresh_team_stats()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY team_stats;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT SELECT ON team_stats TO ocean_user;

-- Log completion
DO $$
BEGIN
  RAISE NOTICE '✅ Performance indexes created successfully';
END $$;
