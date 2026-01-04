-- Update vw_client_roi_summary to sum allocated_tool_cost from vw_workflow_roi_calculated
-- This replaces the direct tool cost calculation with summing per-workflow allocations
-- Run this AFTER running add_tool_cost_allocation_to_workflow_view.sql

CREATE OR REPLACE VIEW public.vw_client_roi_summary AS
WITH workflow_roi AS (
    SELECT 
        client_id,
        currency_code,
        SUM(COALESCE(minutes_saved, 0)) as total_minutes_saved,
        SUM(COALESCE(labor_cost_saved, 0)) as total_labor_cost_saved,
        SUM(COALESCE(value_created, 0)) as total_value_created,
        SUM(COALESCE(implementation_cost_applied, 0)) as total_implementation_costs,
        -- Sum total allocated tool costs (recurring + one-time) per workflow
        SUM(COALESCE(allocated_tool_cost, 0)) as total_tool_costs,
        COUNT(*) as workflows_with_roi
    FROM public.vw_workflow_roi_calculated
    GROUP BY client_id, currency_code
)
SELECT 
    c.id as client_id,
    c.client_name,
    c.client_code,
    COALESCE(wr.total_minutes_saved, 0) as total_minutes_saved,
    ROUND(COALESCE(wr.total_minutes_saved, 0) / 60.0, 1) as total_hours_saved,
    COALESCE(wr.total_labor_cost_saved, 0) as total_labor_cost_saved,
    COALESCE(wr.total_value_created, 0) as total_value_created,
    COALESCE(wr.total_implementation_costs, 0) as total_implementation_costs,
    COALESCE(wr.total_tool_costs, 0) as total_tool_costs,
    COALESCE(wr.total_implementation_costs, 0) + COALESCE(wr.total_tool_costs, 0) as total_automation_cost,
    -- Net ROI = (Labor Cost Saved + Value Created) - Total Automation Cost
    (COALESCE(wr.total_labor_cost_saved, 0) + COALESCE(wr.total_value_created, 0)) - 
    (COALESCE(wr.total_implementation_costs, 0) + COALESCE(wr.total_tool_costs, 0)) as net_roi,
    COALESCE(wr.currency_code, 'GBP') as currency_code,
    COALESCE(wr.workflows_with_roi, 0) as workflows_with_roi
FROM public.n8n_clients c
LEFT JOIN workflow_roi wr ON c.id = wr.client_id;

