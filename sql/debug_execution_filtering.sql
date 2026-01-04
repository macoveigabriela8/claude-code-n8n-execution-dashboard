-- Debug why only 1 execution is being counted
-- Check actual executions and date comparisons

-- First, see all executions for this workflow
SELECT 
    e.execution_id,
    e.workflow_id,
    e.status,
    e.started_at,
    e.started_at::DATE as started_at_date,
    r.deployment_date,
    CASE 
        WHEN e.started_at >= r.deployment_date THEN 'YES - Included'
        ELSE 'NO - Excluded'
    END as should_be_included
FROM public.n8n_workflow_roi r
LEFT JOIN public.n8n_executions e ON r.workflow_id = e.workflow_id AND r.client_id = e.client_id
WHERE r.workflow_id = 'xMBSSM6kORfbsPFg'
  AND r.client_id = '03acd728-2a3a-47ce-8e14-2d9d112b348e'
ORDER BY e.started_at DESC
LIMIT 50;

-- Also check the count with explicit date casting
SELECT 
    r.workflow_id,
    r.deployment_date,
    r.deployment_date::TIMESTAMP as deployment_date_timestamp,
    COUNT(*) as total_executions,
    COUNT(*) FILTER (WHERE e.status = 'success' AND e.started_at >= r.deployment_date::TIMESTAMP) as successful_with_timestamp_cast,
    COUNT(*) FILTER (WHERE e.status = 'success' AND e.started_at::DATE >= r.deployment_date) as successful_with_date_cast
FROM public.n8n_workflow_roi r
LEFT JOIN public.n8n_executions e ON r.workflow_id = e.workflow_id AND r.client_id = e.client_id
WHERE r.workflow_id = 'xMBSSM6kORfbsPFg'
  AND r.client_id = '03acd728-2a3a-47ce-8e14-2d9d112b348e'
GROUP BY r.workflow_id, r.deployment_date;

