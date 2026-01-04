-- Find workflow_id for a workflow by name
-- Replace 'Generate Letter from Heidi' with the workflow name you're looking for

SELECT 
    r.workflow_id,
    w.workflow_name,
    r.deployment_date,
    r.roi_type,
    r.updated_at
FROM public.n8n_workflow_roi r
LEFT JOIN public.n8n_workflows w ON r.workflow_id = w.workflow_id AND r.client_id = w.client_id
WHERE w.workflow_name ILIKE '%Generate Letter from Heidi%'
  AND r.client_id = '03acd728-2a3a-47ce-8e14-2d9d112b348e';

