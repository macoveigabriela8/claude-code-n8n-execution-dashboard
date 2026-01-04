-- List all workflows with their deployment dates to see which ones were recently updated

SELECT 
    r.workflow_id,
    w.workflow_name,
    r.deployment_date,
    r.roi_type,
    r.updated_at,
    (CURRENT_DATE - r.deployment_date)::INTEGER as days_since_deployment
FROM public.n8n_workflow_roi r
LEFT JOIN public.n8n_workflows w ON r.workflow_id = w.workflow_id AND r.client_id = w.client_id
WHERE r.client_id = '03acd728-2a3a-47ce-8e14-2d9d112b348e'
ORDER BY r.updated_at DESC;

