-- Verify SuccessRateGauge Percentage Calculations
-- Check if vw_workflow_stats view includes ALL executions (1344) without limits

-- Replace with actual client_id when running
-- SET client_id = '03acd728-2a3a-47ce-8e14-2d9d112b348e';

-- 1. Check vw_workflow_stats view definition
SELECT 
  'VIEW DEFINITION' as check_type,
  pg_get_viewdef('vw_workflow_stats'::regclass, true) as view_definition;

-- 2. Sum executions_24h from vw_workflow_stats (should equal 1344 from Execution History)
SELECT 
  'WORKFLOW STATS SUM' as check_type,
  SUM(executions_24h) as total_executions_from_view,
  1344 as expected_total_from_execution_history,
  CASE 
    WHEN SUM(executions_24h) = 1344 THEN 'MATCH ✓'
    ELSE 'MISMATCH ✗'
  END as status,
  SUM(executions_24h) - 1344 as difference
FROM vw_workflow_stats
WHERE client_id = '03acd728-2a3a-47ce-8e14-2d9d112b348e';

-- 3. Count executions directly from n8n_executions table for last 24 hours
SELECT 
  'DIRECT COUNT FROM TABLE' as check_type,
  COUNT(*) as total_executions_direct,
  1344 as expected_total_from_execution_history,
  CASE 
    WHEN COUNT(*) = 1344 THEN 'MATCH ✓'
    ELSE 'MISMATCH ✗'
  END as status,
  COUNT(*) - 1344 as difference
FROM n8n_executions e
INNER JOIN n8n_workflows w ON e.workflow_id = w.workflow_id
WHERE w.client_id = '03acd728-2a3a-47ce-8e14-2d9d112b348e'
  AND e.started_at >= NOW() - INTERVAL '24 hours'
  AND e.mode = 'production';

-- 4. Compare individual workflow execution counts: View vs Direct Query
WITH view_counts AS (
  SELECT 
    workflow_id,
    workflow_name,
    executions_24h as view_count
  FROM vw_workflow_stats
  WHERE client_id = '03acd728-2a3a-47ce-8e14-2d9d112b348e'
    AND executions_24h > 0
),
direct_counts AS (
  SELECT 
    e.workflow_id,
    w.workflow_name,
    COUNT(*) as direct_count
  FROM n8n_executions e
  INNER JOIN n8n_workflows w ON e.workflow_id = w.workflow_id
  WHERE w.client_id = '03acd728-2a3a-47ce-8e14-2d9d112b348e'
    AND e.started_at >= NOW() - INTERVAL '24 hours'
    AND e.mode = 'production'
  GROUP BY e.workflow_id, w.workflow_name
)
SELECT 
  COALESCE(v.workflow_id, d.workflow_id) as workflow_id,
  COALESCE(v.workflow_name, d.workflow_name) as workflow_name,
  COALESCE(v.view_count, 0) as view_count,
  COALESCE(d.direct_count, 0) as direct_count,
  CASE 
    WHEN COALESCE(v.view_count, 0) = COALESCE(d.direct_count, 0) THEN 'MATCH ✓'
    ELSE 'MISMATCH ✗'
  END as status,
  COALESCE(v.view_count, 0) - COALESCE(d.direct_count, 0) as difference
FROM view_counts v
FULL OUTER JOIN direct_counts d ON v.workflow_id = d.workflow_id
ORDER BY COALESCE(v.workflow_id, d.workflow_id);

-- 5. Verify percentage calculations (matching SuccessRateGauge component logic)
WITH workflow_counts AS (
  SELECT 
    workflow_id,
    workflow_name,
    executions_24h
  FROM vw_workflow_stats
  WHERE client_id = '03acd728-2a3a-47ce-8e14-2d9d112b348e'
    AND executions_24h > 0
),
total_executions AS (
  SELECT SUM(executions_24h) as total FROM workflow_counts
)
SELECT 
  wc.workflow_name,
  wc.executions_24h,
  te.total as total_executions,
  ROUND((wc.executions_24h::numeric / te.total::numeric * 100)::numeric, 1) as calculated_percentage,
  CASE 
    WHEN te.total = 1344 THEN 'Total matches Execution History ✓'
    ELSE 'Total does NOT match Execution History ✗'
  END as total_verification
FROM workflow_counts wc
CROSS JOIN total_executions te
ORDER BY wc.executions_24h DESC;

-- 6. Check if view has any LIMIT clauses (by examining view definition text)
SELECT 
  'VIEW LIMIT CHECK' as check_type,
  CASE 
    WHEN pg_get_viewdef('vw_workflow_stats'::regclass, true) ILIKE '%LIMIT%' THEN 'LIMIT FOUND ✗'
    ELSE 'NO LIMIT ✓'
  END as limit_status,
  CASE 
    WHEN pg_get_viewdef('vw_workflow_stats'::regclass, true) ILIKE '%TOP%' THEN 'TOP FOUND ✗'
    ELSE 'NO TOP ✓'
  END as top_status;

