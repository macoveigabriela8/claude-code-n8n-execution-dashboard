-- Section 4: SUM OF WORKFLOW ROI (should match summary)
-- This sums up all individual workflows and should match the summary view
SELECT 
    'WORKFLOW ROI - SUM' as source,
    client_id,
    SUM(labor_cost_saved) as sum_labor_cost_saved,
    SUM(value_created) as sum_value_created,
    SUM(implementation_cost_applied) as sum_implementation_costs
FROM public.vw_workflow_roi_calculated
WHERE client_id = '03acd728-2a3a-47ce-8e14-2d9d112b348e'
GROUP BY client_id;

