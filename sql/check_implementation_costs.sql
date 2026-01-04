-- Check implementation costs from workflows
SELECT 
    workflow_id,
    workflow_name,
    implementation_cost,
    implementation_date,
    implementation_cost_applied,
    deployment_date
FROM public.vw_workflow_roi_calculated
WHERE client_id = '03acd728-2a3a-47ce-8e14-2d9d112b348e'
ORDER BY workflow_name;

-- Sum implementation costs
SELECT 
    'Implementation Costs Sum' as source,
    SUM(implementation_cost_applied) as total_implementation_costs,
    SUM(implementation_cost) as total_implementation_cost_raw,
    COUNT(*) FILTER (WHERE implementation_cost_applied > 0) as workflows_with_implementation_cost
FROM public.vw_workflow_roi_calculated
WHERE client_id = '03acd728-2a3a-47ce-8e14-2d9d112b348e';

