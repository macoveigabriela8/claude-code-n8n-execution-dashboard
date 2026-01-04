-- Section 1: KPI CARDS DATA (from vw_client_roi_summary)
-- This shows what the database view returns for all KPI card values
SELECT 
    'KPI CARDS - vw_client_roi_summary' as source,
    client_id,
    total_labor_cost_saved,
    total_value_created,
    total_implementation_costs,
    total_tool_costs,
    total_automation_cost,
    net_roi,
    total_hours_saved,
    workflows_with_roi
FROM public.vw_client_roi_summary
WHERE client_id = '03acd728-2a3a-47ce-8e14-2d9d112b348e'
ORDER BY client_id;

