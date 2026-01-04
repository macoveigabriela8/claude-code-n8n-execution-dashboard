-- Update vw_recent_executions view to remove date filter
-- This allows the application to handle date filtering flexibly (24h, 2d, 3d, 5d)
-- The composite indexes will ensure fast queries regardless of date range

-- First, check current view definition
SELECT pg_get_viewdef('vw_recent_executions', true);

-- Update view to remove date filter (if it exists)
-- This view should just join tables and expose columns
-- Date filtering will be handled in application code using the 'days' parameter
--
-- Using DROP/CREATE instead of CREATE OR REPLACE to avoid column name conflicts
-- If you get errors about dependencies, you may need to temporarily drop dependent views first

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
-- NO date filter here - application code handles date filtering via getRecentExecutions(clientId, { days: X })
-- This provides maximum flexibility for 24h, 2d, 3d, 5d, or any future time periods
ORDER BY e.started_at DESC;

-- Verify the view was updated
SELECT pg_get_viewdef('vw_recent_executions', true);

-- Note: The ORDER BY in the view definition is optional since application code
-- will add its own ORDER BY. However, it doesn't hurt to have it here for consistency.

