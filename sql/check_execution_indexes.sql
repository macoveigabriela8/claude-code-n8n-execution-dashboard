-- Diagnostic Queries for Execution History Indexes
-- Run these in Supabase SQL Editor to analyze current index status

-- 1. Get the view definition to understand the underlying query
SELECT pg_get_viewdef('vw_recent_executions', true);

-- 2. Check all indexes on the executions table
SELECT 
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'n8n_executions'
ORDER BY indexname;

-- 3. Check index usage statistics
SELECT 
    schemaname,
    relname as tablename,
    indexrelname as indexname,
    idx_scan as index_scans,
    idx_tup_read as tuples_read,
    idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes
WHERE relname = 'n8n_executions'
ORDER BY idx_scan DESC;

-- 4. Analyze table structure
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'n8n_executions'
ORDER BY ordinal_position;

-- 5. Test query performance (replace 'your-client-id-here' with actual client_id)
EXPLAIN ANALYZE
SELECT *
FROM n8n_executions
WHERE client_id = 'your-client-id-here'
  AND started_at >= NOW() - INTERVAL '5 days'
ORDER BY started_at DESC
LIMIT 100;

-- 6. Check table size and row count
SELECT 
    pg_size_pretty(pg_total_relation_size('n8n_executions')) as total_size,
    pg_size_pretty(pg_relation_size('n8n_executions')) as table_size,
    (SELECT COUNT(*) FROM n8n_executions) as row_count;

-- 7. Check index sizes
SELECT
    indexname,
    pg_size_pretty(pg_relation_size(indexname::regclass)) as index_size
FROM pg_indexes
WHERE tablename = 'n8n_executions'
ORDER BY pg_relation_size(indexname::regclass) DESC;

