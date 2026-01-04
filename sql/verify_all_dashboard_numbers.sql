-- Comprehensive audit of all dashboard numbers
-- This script compares values from different sources to identify inconsistencies

-- ============================================
-- 1. KPI CARDS DATA (from vw_client_roi_summary)
-- ============================================
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
WHERE client_id = '03acd728-2a3a-47ce-8e14-2d9d112b348e' -- Replace with your client_id
ORDER BY client_id;

-- ============================================
-- 2. TOOL COSTS VERIFICATION
-- ============================================
-- Check tool costs from the NEW n8n_tool_costs table
WITH tool_costs_new_table AS (
    SELECT 
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
),
-- Check tool costs from OLD JSONB column (if still exists)
tool_costs_jsonb AS (
    SELECT 
        c.id as client_id,
        tool->>'tool_name' as tool_name,
        (tool->>'cost')::DECIMAL as cost,
        tool->>'period' as period,
        (tool->>'recurring')::BOOLEAN as recurring,
        (tool->>'enabled')::BOOLEAN as enabled,
        (tool->>'start_date')::DATE as start_date,
        (tool->>'end_date')::DATE as end_date
    FROM public.n8n_clients c
    CROSS JOIN LATERAL jsonb_array_elements(COALESCE(c.tool_costs, '[]'::jsonb)) as tool
    WHERE c.id = '03acd728-2a3a-47ce-8e14-2d9d112b348e'
)
SELECT 
    'TOOL COSTS - New Table' as source,
    client_id,
    COUNT(*) as tool_count,
    SUM(CASE WHEN recurring = false THEN cost ELSE 0 END) as one_time_total,
    SUM(CASE WHEN recurring = true THEN cost ELSE 0 END) as recurring_total
FROM tool_costs_new_table
GROUP BY client_id

UNION ALL

SELECT 
    'TOOL COSTS - JSONB Column' as source,
    client_id,
    COUNT(*) as tool_count,
    SUM(CASE WHEN recurring = false THEN cost ELSE 0 END) as one_time_total,
    SUM(CASE WHEN recurring = true THEN cost ELSE 0 END) as recurring_total
FROM tool_costs_jsonb
WHERE enabled = true OR enabled IS NULL
GROUP BY client_id;

-- ============================================
-- 3. WORKFLOW ROI BREAKDOWN DATA
-- ============================================
-- Note: allocated_tool_cost may not exist in older view versions
SELECT 
    'WORKFLOW ROI - Individual Workflows' as source,
    workflow_id,
    workflow_name,
    labor_cost_saved,
    value_created,
    implementation_cost_applied
FROM public.vw_workflow_roi_calculated
WHERE client_id = '03acd728-2a3a-47ce-8e14-2d9d112b348e'
ORDER BY workflow_name;

-- ============================================
-- 4. SUM OF WORKFLOW ROI (should match summary)
-- ============================================
SELECT 
    'WORKFLOW ROI - SUM' as source,
    client_id,
    SUM(labor_cost_saved) as sum_labor_cost_saved,
    SUM(value_created) as sum_value_created,
    SUM(implementation_cost_applied) as sum_implementation_costs
FROM public.vw_workflow_roi_calculated
WHERE client_id = '03acd728-2a3a-47ce-8e14-2d9d112b348e'
GROUP BY client_id;

-- ============================================
-- 5. COMPARISON: Summary vs Sum of Workflows
-- ============================================
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

-- ============================================
-- 6. AUTOMATION COST BREAKDOWN
-- ============================================
-- This will help identify if tool costs are being calculated correctly
WITH workflow_implementation AS (
    SELECT 
        client_id,
        SUM(implementation_cost_applied) as total_impl_cost
    FROM public.vw_workflow_roi_calculated
    WHERE client_id = '03acd728-2a3a-47ce-8e14-2d9d112b348e'
    GROUP BY client_id
)
SELECT 
    'AUTOMATION COST BREAKDOWN' as source,
    s.client_id,
    s.total_implementation_costs as summary_impl_cost,
    wi.total_impl_cost as workflow_impl_cost,
    s.total_tool_costs as summary_tool_cost,
    s.total_automation_cost as summary_total_automation_cost,
    (COALESCE(wi.total_impl_cost, 0) + COALESCE(s.total_tool_costs, 0)) as calculated_total_automation_cost,
    (s.total_automation_cost - (COALESCE(wi.total_impl_cost, 0) + COALESCE(s.total_tool_costs, 0))) as difference
FROM public.vw_client_roi_summary s
LEFT JOIN workflow_implementation wi ON s.client_id = wi.client_id
WHERE s.client_id = '03acd728-2a3a-47ce-8e14-2d9d112b348e';

