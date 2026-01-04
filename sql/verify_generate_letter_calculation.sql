-- Verify the calculation for "Generate Letter from Heidi" workflow
-- Check if the view is using the correct deployment_date

SELECT 
    r.workflow_id,
    w.workflow_name,
    r.deployment_date,
    r.roi_type,
    r.manual_minutes_saved,
    r.hourly_rate,
    -- Count executions since deployment_date
    COUNT(*) FILTER (WHERE e.status = 'success' AND e.started_at >= r.deployment_date) as successful_executions_since_deployment,
    COUNT(*) FILTER (WHERE e.started_at >= r.deployment_date) as total_executions_since_deployment,
    -- Days since deployment
    (CURRENT_DATE - r.deployment_date)::INTEGER as days_since_deployment,
    -- Get values from view
    v.successful_executions as view_successful_executions,
    v.days_since_deployment as view_days_since_deployment,
    v.labor_cost_saved as view_labor_cost_saved,
    v.minutes_saved as view_minutes_saved
FROM public.n8n_workflow_roi r
LEFT JOIN public.n8n_workflows w ON r.workflow_id = w.workflow_id AND r.client_id = w.client_id
LEFT JOIN public.n8n_executions e ON r.workflow_id = e.workflow_id AND r.client_id = e.client_id
LEFT JOIN public.vw_workflow_roi_calculated v ON r.workflow_id = v.workflow_id AND r.client_id = v.client_id
WHERE r.workflow_id = 'xMBSSM6kORfbsPFg'  -- Generate Letter from Heidi (note: workflow_id in query might be case-sensitive)
  AND r.client_id = '03acd728-2a3a-47ce-8e14-2d9d112b348e'
GROUP BY r.workflow_id, w.workflow_name, r.deployment_date, r.roi_type, r.manual_minutes_saved, r.hourly_rate, 
         v.successful_executions, v.days_since_deployment, v.labor_cost_saved, v.minutes_saved;

