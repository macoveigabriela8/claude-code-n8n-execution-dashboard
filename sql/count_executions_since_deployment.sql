-- Count executions since deployment_date for "Generate Letter from Heidi"
-- Check if executions are being filtered correctly

SELECT 
    r.workflow_id,
    w.workflow_name,
    r.deployment_date,
    -- Count all executions for this workflow
    COUNT(*) as total_executions_all_time,
    COUNT(*) FILTER (WHERE e.started_at >= r.deployment_date) as executions_since_deployment_date,
    COUNT(*) FILTER (WHERE e.status = 'success' AND e.started_at >= r.deployment_date) as successful_executions_since_deployment_date,
    -- Show date range of executions
    MIN(e.started_at) as earliest_execution,
    MAX(e.started_at) as latest_execution,
    MIN(e.started_at) FILTER (WHERE e.started_at >= r.deployment_date) as first_execution_since_deployment,
    MAX(e.started_at) FILTER (WHERE e.started_at >= r.deployment_date) as last_execution_since_deployment
FROM public.n8n_workflow_roi r
LEFT JOIN public.n8n_workflows w ON r.workflow_id = w.workflow_id AND r.client_id = w.client_id
LEFT JOIN public.n8n_executions e ON r.workflow_id = e.workflow_id AND r.client_id = e.client_id
WHERE r.workflow_id = 'xMBSSM6kORfbsPFg'
  AND r.client_id = '03acd728-2a3a-47ce-8e14-2d9d112b348e'
GROUP BY r.workflow_id, w.workflow_name, r.deployment_date;

-- Also check what the view is actually showing
SELECT 
    workflow_id,
    workflow_name,
    deployment_date,
    successful_executions,
    days_since_deployment,
    labor_cost_saved
FROM public.vw_workflow_roi_calculated
WHERE workflow_id = 'xMBSSM6kORfbsPFg'
  AND client_id = '03acd728-2a3a-47ce-8e14-2d9d112b348e';

