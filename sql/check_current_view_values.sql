-- Check what the view currently returns
SELECT 
    client_id,
    total_implementation_costs,
    total_tool_costs,
    total_automation_cost,
    net_roi
FROM public.vw_client_roi_summary
WHERE client_id = '03acd728-2a3a-47ce-8e14-2d9d112b348e';

-- Expected values:
-- total_implementation_costs: 6350 (workflow impl costs 4850 + one-time fees 1500)
-- total_tool_costs: 13 (recurring tools only)
-- total_automation_cost: 6363 (6350 + 13)
-- net_roi: -6120 (221 + 23 - 6363)

