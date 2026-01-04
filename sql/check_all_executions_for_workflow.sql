-- Check ALL executions for this workflow to see if they exist
-- Without the deployment_date filter first

-- Check if executions exist at all for this workflow
SELECT 
    COUNT(*) as total_executions_in_table,
    COUNT(*) FILTER (WHERE status = 'success') as successful_executions_in_table,
    MIN(started_at) as earliest_execution,
    MAX(started_at) as latest_execution
FROM public.n8n_executions
WHERE workflow_id = 'xMBSSM6kORfbsPFg'
  AND client_id = '03acd728-2a3a-47ce-8e14-2d9d112b348e';

-- Show some sample executions
SELECT 
    execution_id,
    workflow_id,
    client_id,
    status,
    started_at,
    started_at::DATE as started_date
FROM public.n8n_executions
WHERE workflow_id = 'xMBSSM6kORfbsPFg'
  AND client_id = '03acd728-2a3a-47ce-8e14-2d9d112b348e'
ORDER BY started_at DESC
LIMIT 20;

-- Also check if workflow_id might have case sensitivity issues
SELECT DISTINCT workflow_id 
FROM public.n8n_executions
WHERE client_id = '03acd728-2a3a-47ce-8e14-2d9d112b348e'
  AND workflow_id ILIKE '%xMBSSM6kORfbsPFg%';

