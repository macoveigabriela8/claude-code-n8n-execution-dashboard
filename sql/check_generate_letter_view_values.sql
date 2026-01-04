-- Check what the view is calculating for "Generate Letter from Heidi"
-- Compare with what should be calculated based on deployment_date 2025-12-11

SELECT 
    workflow_id,
    workflow_name,
    deployment_date,
    roi_type,
    successful_executions,
    days_since_deployment,
    minutes_saved,
    labor_cost_saved,
    (CURRENT_DATE - deployment_date)::INTEGER as expected_days_since_deployment
FROM public.vw_workflow_roi_calculated
WHERE workflow_id = 'xMBSSM6kORfbsPFg'
  AND client_id = '03acd728-2a3a-47ce-8e14-2d9d112b348e';

-- Also check the raw table data
SELECT 
    workflow_id,
    deployment_date,
    roi_type,
    manual_minutes_saved,
    hourly_rate,
    updated_at
FROM public.n8n_workflow_roi
WHERE workflow_id = 'xMBSSM6kORfbsPFg'
  AND client_id = '03acd728-2a3a-47ce-8e14-2d9d112b348e';

