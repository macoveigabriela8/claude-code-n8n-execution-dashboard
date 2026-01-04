-- Section 5: COMPARISON: Summary vs Sum of Workflows
-- This compares the summary view values with the sum of individual workflows
WITH workflow_sums AS (
    SELECT 
        client_id,
        SUM(labor_cost_saved) as sum_labor_cost_saved,
        SUM(value_created) as sum_value_created,
        SUM(implementation_cost_applied) as sum_implementation_costs
    FROM public.vw_workflow_roi_calculated
    WHERE client_id = '03acd728-2a3a-47ce-8e14-2d9d112b348e'
    GROUP BY client_id
)
SELECT 
    'COMPARISON - Labor Cost Saved' as metric,
    s.total_labor_cost_saved as summary_value,
    ws.sum_labor_cost_saved as workflow_sum,
    (s.total_labor_cost_saved - ws.sum_labor_cost_saved) as difference,
    CASE WHEN ABS(s.total_labor_cost_saved - ws.sum_labor_cost_saved) > 0.01 THEN 'MISMATCH' ELSE 'MATCH' END as status
FROM public.vw_client_roi_summary s
LEFT JOIN workflow_sums ws ON s.client_id = ws.client_id
WHERE s.client_id = '03acd728-2a3a-47ce-8e14-2d9d112b348e'

UNION ALL

SELECT 
    'COMPARISON - Value Created' as metric,
    s.total_value_created as summary_value,
    ws.sum_value_created as workflow_sum,
    (s.total_value_created - ws.sum_value_created) as difference,
    CASE WHEN ABS(s.total_value_created - ws.sum_value_created) > 0.01 THEN 'MISMATCH' ELSE 'MATCH' END as status
FROM public.vw_client_roi_summary s
LEFT JOIN workflow_sums ws ON s.client_id = ws.client_id
WHERE s.client_id = '03acd728-2a3a-47ce-8e14-2d9d112b348e'

UNION ALL

SELECT 
    'COMPARISON - Implementation Costs' as metric,
    s.total_implementation_costs as summary_value,
    ws.sum_implementation_costs as workflow_sum,
    (s.total_implementation_costs - ws.sum_implementation_costs) as difference,
    CASE WHEN ABS(s.total_implementation_costs - ws.sum_implementation_costs) > 0.01 THEN 'MISMATCH' ELSE 'MATCH' END as status
FROM public.vw_client_roi_summary s
LEFT JOIN workflow_sums ws ON s.client_id = ws.client_id
WHERE s.client_id = '03acd728-2a3a-47ce-8e14-2d9d112b348e';

