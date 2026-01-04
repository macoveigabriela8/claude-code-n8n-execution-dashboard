-- Update Table Statistics for Optimal Index Usage
-- Run this after creating new indexes to ensure PostgreSQL query planner uses them

-- Update statistics for n8n_executions table
-- This tells PostgreSQL to analyze the table and update statistics about data distribution
ANALYZE n8n_executions;

-- Verify statistics were updated
SELECT 
    schemaname,
    tablename,
    last_analyze,
    last_autoanalyze,
    n_tup_ins as inserts,
    n_tup_upd as updates,
    n_tup_del as deletes,
    n_live_tup as live_rows,
    n_dead_tup as dead_rows
FROM pg_stat_user_tables
WHERE tablename = 'n8n_executions';

-- Now re-run your EXPLAIN ANALYZE query - it should use idx_executions_client_started_at
-- Expected: "Index Scan using idx_executions_client_started_at" instead of "idx_exec_started"

