-- Check if executions exist at all and what workflow_ids are in the executions table

-- First, check if there are ANY executions for this client
SELECT 
    COUNT(*) as total_executions_for_client,
    COUNT(DISTINCT workflow_id) as unique_workflows
FROM public.n8n_executions
WHERE client_id = '03acd728-2a3a-47ce-8e14-2d9d112b348e';

-- List all workflow_ids that have executions
SELECT DISTINCT 
    workflow_id,
    COUNT(*) as execution_count
FROM public.n8n_executions
WHERE client_id = '03acd728-2a3a-47ce-8e14-2d9d112b348e'
GROUP BY workflow_id
ORDER BY execution_count DESC
LIMIT 20;

-- Check if the workflow_id exists but with different case or extra characters
SELECT DISTINCT workflow_id 
FROM public.n8n_executions
WHERE client_id = '03acd728-2a3a-47ce-8e14-2d9d112b348e'
  AND (workflow_id LIKE '%xMBSSM6kORfbsPFg%' OR workflow_id ILIKE '%generate%heidi%')
ORDER BY workflow_id;

