-- Debug automation cost calculation
-- Check what the view is calculating vs what the frontend expects

-- 1. Check tool costs in the table
SELECT 
    'Tool Costs in Table' as source,
    tc.client_id,
    tc.tool,
    tc.cost,
    tc.period,
    tc.recurring,
    tc.enabled,
    tc.end_date
FROM public.n8n_tool_costs tc
WHERE tc.client_id = '03acd728-2a3a-47ce-8e14-2d9d112b348e'
  AND tc.enabled = true
ORDER BY tc.recurring, tc.tool;

-- 2. Check earliest deployment date
SELECT 
    'Earliest Deployment Date' as source,
    client_id,
    MIN(deployment_date) as earliest_deployment_date,
    CURRENT_DATE as today,
    EXTRACT(YEAR FROM AGE(CURRENT_DATE, MIN(deployment_date)))::INTEGER * 12 + 
    EXTRACT(MONTH FROM AGE(CURRENT_DATE, MIN(deployment_date)))::INTEGER + 1 as months_since_deployment
FROM public.vw_workflow_roi_calculated
WHERE client_id = '03acd728-2a3a-47ce-8e14-2d9d112b348e'
GROUP BY client_id;

-- 3. Check what the view returns
SELECT 
    'View Results' as source,
    total_automation_cost,
    total_tool_costs,
    total_implementation_costs,
    net_roi,
    total_labor_cost_saved,
    total_value_created,
    (total_labor_cost_saved + total_value_created) as total_benefits,
    (total_labor_cost_saved + total_value_created - total_automation_cost) as calculated_net_roi
FROM public.vw_client_roi_summary
WHERE client_id = '03acd728-2a3a-47ce-8e14-2d9d112b348e';

