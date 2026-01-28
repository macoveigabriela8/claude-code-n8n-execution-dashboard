-- Add details column to vw_recent_executions view
-- This updates the view to include the details field from n8n_executions
-- NOTE: We need to DROP and recreate because we're changing column order

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
    e.details,  -- Added details column
    w.workflow_name,
    c.client_name,
    c.client_code
FROM n8n_executions e
LEFT JOIN n8n_workflows w ON e.workflow_id = w.workflow_id AND e.client_id = w.client_id
LEFT JOIN n8n_clients c ON e.client_id = c.id
ORDER BY e.started_at DESC;
