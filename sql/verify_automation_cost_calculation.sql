-- Verify automation cost calculation
-- Breakdown table shows: £6,363
-- Formula shows: £6,427
-- Difference: £64

-- Check what the view currently calculates
SELECT 
    client_id,
    total_implementation_costs,
    total_tool_costs,
    total_automation_cost,
    (total_implementation_costs + total_tool_costs) as calculated_total
FROM public.vw_client_roi_summary
WHERE client_id = '03acd728-2a3a-47ce-8e14-2d9d112b348e';

-- Check breakdown components
-- DEVELOPMENT should be: workflow implementation costs + one-time fees
-- TOOLS should be: recurring tools only

-- 1. Workflow implementation costs (should use implementation_cost as fallback)
SELECT 
    'Workflow Implementation Costs' as source,
    SUM(
        CASE 
            WHEN implementation_cost_applied > 0 THEN implementation_cost_applied
            ELSE COALESCE(implementation_cost, 0)
        END
    ) as total_workflow_impl_cost
FROM public.vw_workflow_roi_calculated
WHERE client_id = '03acd728-2a3a-47ce-8e14-2d9d112b348e';

-- 2. One-time fees (recurring = false)
SELECT 
    'One-time Fees' as source,
    SUM(cost) as total_one_time_fees
FROM public.n8n_tool_costs
WHERE client_id = '03acd728-2a3a-47ce-8e14-2d9d112b348e'
  AND recurring = false
  AND enabled = true
  AND end_date IS NOT NULL
  AND end_date <= CURRENT_DATE;

-- 3. Recurring tools only
WITH earliest_deployment_dates AS (
    SELECT 
        client_id,
        MIN(deployment_date) as earliest_deployment_date
    FROM public.vw_workflow_roi_calculated
    WHERE client_id = '03acd728-2a3a-47ce-8e14-2d9d112b348e'
    GROUP BY client_id
)
SELECT 
    'Recurring Tools' as source,
    SUM(
        CASE 
            WHEN tc.period = 'monthly' THEN
                tc.cost * GREATEST(0, 
                    EXTRACT(YEAR FROM AGE(CURRENT_DATE, ed.earliest_deployment_date))::INTEGER * 12 + 
                    EXTRACT(MONTH FROM AGE(CURRENT_DATE, ed.earliest_deployment_date))::INTEGER + 1
                )
            WHEN tc.period = 'quarterly' THEN
                tc.cost * GREATEST(0, 
                    FLOOR((EXTRACT(YEAR FROM AGE(CURRENT_DATE, ed.earliest_deployment_date))::INTEGER * 12 + 
                    EXTRACT(MONTH FROM AGE(CURRENT_DATE, ed.earliest_deployment_date))::INTEGER + 1) / 3.0)
                )
            WHEN tc.period = 'yearly' THEN
                tc.cost * GREATEST(0, 
                    EXTRACT(YEAR FROM AGE(CURRENT_DATE, ed.earliest_deployment_date))::INTEGER + 
                    CASE WHEN EXTRACT(MONTH FROM AGE(CURRENT_DATE, ed.earliest_deployment_date))::INTEGER >= 0 THEN 1 ELSE 0 END
                )
            WHEN tc.period = '24months' THEN
                tc.cost * GREATEST(0, 
                    FLOOR((EXTRACT(YEAR FROM AGE(CURRENT_DATE, ed.earliest_deployment_date))::INTEGER * 12 + 
                    EXTRACT(MONTH FROM AGE(CURRENT_DATE, ed.earliest_deployment_date))::INTEGER + 1) / 24.0)
                )
            ELSE 0
        END
    ) as total_recurring_tools
FROM public.n8n_tool_costs tc
LEFT JOIN earliest_deployment_dates ed ON tc.client_id = ed.client_id
WHERE tc.client_id = '03acd728-2a3a-47ce-8e14-2d9d112b348e'
  AND tc.recurring = true
  AND tc.enabled = true;

