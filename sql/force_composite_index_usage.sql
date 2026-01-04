-- Debug: Why isn't the composite index being used?
-- Run these queries to understand the query planner's decision

-- 1. Check the selectivity of client_id vs date filter
SELECT 
    COUNT(*) as total_rows,
    COUNT(DISTINCT client_id) as distinct_clients,
    COUNT(*) FILTER (WHERE started_at >= NOW() - INTERVAL '5 days') as rows_last_5_days,
    COUNT(*) FILTER (WHERE client_id = '03acd728-2a3a-47ce-8e14-2d9d112b348e') as rows_for_client,
    COUNT(*) FILTER (WHERE client_id = '03acd728-2a3a-47ce-8e14-2d9d112b348e' 
                     AND started_at >= NOW() - INTERVAL '5 days') as rows_for_client_last_5_days
FROM n8n_executions;

-- 2. Check index statistics
SELECT 
    indexrelname as index_name,
    idx_scan as scans,
    idx_tup_read as tuples_read,
    idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes
WHERE relname = 'n8n_executions'
  AND (indexrelname = 'idx_exec_started' 
       OR indexrelname = 'idx_executions_client_started_at')
ORDER BY idx_scan DESC;

-- 3. Force the composite index by disabling the single-column index temporarily
-- (Only for testing - re-enable after!)
-- ALTER INDEX idx_exec_started DISABLE;  -- This won't work, indexes can't be disabled in PostgreSQL

-- 4. Alternative: Check if the composite index would be used with a different query pattern
EXPLAIN ANALYZE
SELECT *
FROM n8n_executions
WHERE client_id = '03acd728-2a3a-47ce-8e14-2d9d112b348e'
  AND started_at >= NOW() - INTERVAL '5 days'
ORDER BY started_at DESC
LIMIT 100;

-- Note: PostgreSQL's query planner is usually correct, but if you want to ensure
-- the composite index is used, you might need to drop idx_exec_started (after verifying
-- the composite index works well). However, the current performance (0.128ms) is excellent!

