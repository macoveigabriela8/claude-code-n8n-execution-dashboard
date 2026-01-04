-- Check tool costs to understand the discrepancy
-- Breakdown shows: £13 total for TOOLS
-- View shows: £76.71 for total_tool_costs

-- Check all tool costs
SELECT 
    tool,
    cost,
    period,
    recurring,
    enabled,
    end_date
FROM public.n8n_tool_costs
WHERE client_id = '03acd728-2a3a-47ce-8e14-2d9d112b348e'
ORDER BY recurring, tool;

-- Check earliest deployment date
SELECT 
    MIN(deployment_date) as earliest_deployment_date,
    COUNT(*) as workflow_count
FROM public.vw_workflow_roi_calculated
WHERE client_id = '03acd728-2a3a-47ce-8e14-2d9d112b348e';

-- Calculate what the view should show for recurring tools
WITH earliest_deployment_dates AS (
    SELECT 
        client_id,
        MIN(deployment_date) as earliest_deployment_date
    FROM public.vw_workflow_roi_calculated
    WHERE client_id = '03acd728-2a3a-47ce-8e14-2d9d112b348e'
    GROUP BY client_id
)
SELECT 
    tc.tool,
    tc.cost,
    tc.period,
    ed.earliest_deployment_date,
    CASE 
        WHEN tc.period = 'monthly' THEN
            tc.cost * GREATEST(0, 
                EXTRACT(YEAR FROM AGE(CURRENT_DATE, ed.earliest_deployment_date))::INTEGER * 12 + 
                EXTRACT(MONTH FROM AGE(CURRENT_DATE, ed.earliest_deployment_date))::INTEGER + 1
            )
        ELSE 0
    END as calculated_total
FROM public.n8n_tool_costs tc
LEFT JOIN earliest_deployment_dates ed ON tc.client_id = ed.client_id
WHERE tc.client_id = '03acd728-2a3a-47ce-8e14-2d9d112b348e'
  AND tc.recurring = true
  AND tc.enabled = true;

