-- Analyze Existing Indexes vs Recommended Indexes
-- This script helps determine which indexes you need to add

-- 1. Check what columns the existing indexes cover
SELECT 
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'n8n_executions'
ORDER BY indexname;

-- 2. Check if you already have composite indexes for date filtering
-- Look for indexes that include both client_id and started_at
SELECT 
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'n8n_executions'
  AND (
    indexdef LIKE '%client_id%' AND indexdef LIKE '%started_at%'
    OR indexdef LIKE '%started_at%' AND indexdef LIKE '%client_id%'
  );

-- 3. Check index usage to see which indexes are actually being used
SELECT 
    schemaname,
    relname as tablename,
    indexrelname as indexname,
    idx_scan as index_scans,
    idx_tup_read as tuples_read,
    idx_tup_fetch as tuples_fetched,
    pg_size_pretty(pg_relation_size(indexrelid)) as index_size
FROM pg_stat_user_indexes
WHERE relname = 'n8n_executions'
ORDER BY idx_scan DESC;

-- Analysis:
-- If you have:
--   - idx_exec_started (started_at only) - Good for date filtering but not optimal with client_id filter
--   - idx_exec_client (client_id only) - Good for client filtering but needs to combine with date
--   
-- Recommended composite indexes (from create_execution_indexes.sql):
--   - idx_executions_client_started_at (client_id, started_at DESC) - MOST IMPORTANT
--   - idx_executions_client_workflow_started_at (client_id, workflow_id, started_at DESC) - If workflow filtering
--   - idx_executions_client_status_started_at (client_id, status, started_at DESC) - If status filtering
--
-- The composite index (client_id, started_at) will be MORE efficient than using
-- separate indexes on client_id and started_at because PostgreSQL can use a single
-- index scan instead of combining multiple indexes.

