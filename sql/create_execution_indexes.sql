-- Create Optimal Indexes for Execution History 5-Day Filter
-- Run this in Supabase SQL Editor to create indexes for fast date range queries
--
-- Data Volume: ~14,400 executions over 5 days (6 flows × 480 executions/day)
-- Expected Query Time: < 50ms with proper indexes

-- Primary composite index for client_id + started_at (most common filter pattern)
-- This index enables fast filtering by client and date range
CREATE INDEX IF NOT EXISTS idx_executions_client_started_at 
ON n8n_executions(client_id, started_at DESC);

-- Composite index for client_id + workflow_id + started_at
-- Useful when filtering by specific workflow and date range
CREATE INDEX IF NOT EXISTS idx_executions_client_workflow_started_at 
ON n8n_executions(client_id, workflow_id, started_at DESC);

-- Composite index for client_id + status + started_at
-- Useful when filtering by status (success/error) and date range
CREATE INDEX IF NOT EXISTS idx_executions_client_status_started_at 
ON n8n_executions(client_id, status, started_at DESC);

-- Verify indexes were created
SELECT 
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'n8n_executions'
  AND indexname LIKE 'idx_executions_%'
ORDER BY indexname;

-- Update table statistics so PostgreSQL query planner recognizes the new indexes
ANALYZE n8n_executions;

-- Note: Index creation may take a few minutes on large tables
-- Monitor progress with: SELECT * FROM pg_stat_progress_create_index;

