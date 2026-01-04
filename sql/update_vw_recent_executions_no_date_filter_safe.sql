-- SAFE Update vw_recent_executions view to remove date filter
-- 
-- STEP 1: First, check the current view definition to see its structure:
-- SELECT pg_get_viewdef('vw_recent_executions', true);
--
-- STEP 2: If the view uses e.* and you get a column rename error, 
-- you may need to DROP and CREATE the view instead of CREATE OR REPLACE.
-- This script provides both options.

-- Option A: Try CREATE OR REPLACE (preserves existing column names better)
-- Uncomment and modify based on your actual view structure:

/*
CREATE OR REPLACE VIEW vw_recent_executions AS
SELECT 
    e.execution_id,
    e.client_id,
    e.workflow_id,
    e.status,
    e.mode,
    e.started_at,
    e.stopped_at,
    e.duration_ms,
    w.workflow_name,
    c.client_name,
    c.client_code
FROM n8n_executions e
LEFT JOIN n8n_workflows w ON e.workflow_id = w.workflow_id AND e.client_id = w.client_id
LEFT JOIN n8n_clients c ON e.client_id = c.id
-- NO date filter - application handles filtering
ORDER BY e.started_at DESC;
*/

-- Option B: If CREATE OR REPLACE fails with column name errors, 
-- DROP and recreate (this will break any dependencies temporarily):
/*
DROP VIEW IF EXISTS vw_recent_executions CASCADE;

CREATE VIEW vw_recent_executions AS
SELECT 
    e.execution_id,
    e.client_id,
    e.workflow_id,
    e.status,
    e.mode,
    e.started_at,
    e.stopped_at,
    e.duration_ms,
    w.workflow_name,
    c.client_name,
    c.client_code
FROM n8n_executions e
LEFT JOIN n8n_workflows w ON e.workflow_id = w.workflow_id AND e.client_id = w.client_id
LEFT JOIN n8n_clients c ON e.client_id = c.id
ORDER BY e.started_at DESC;
*/

-- INSTRUCTIONS:
-- 1. First run: SELECT pg_get_viewdef('vw_recent_executions', true);
-- 2. Compare the column list with the SELECT above
-- 3. If they match, use Option A
-- 4. If you get column rename errors, use Option B (DROP then CREATE)
-- 5. After updating, verify: SELECT pg_get_viewdef('vw_recent_executions', true);

