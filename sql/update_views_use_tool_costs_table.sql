-- Update views to use n8n_tool_costs table instead of JSONB
-- Run this AFTER creating the table and migrating data
-- Run this in Supabase SQL Editor

-- Update vw_client_roi_summary to use n8n_tool_costs table
CREATE OR REPLACE VIEW public.vw_client_roi_summary AS
WITH workflow_roi AS (
    SELECT 
        client_id,
        currency_code,
        SUM(COALESCE(minutes_saved, 0)) as total_minutes_saved,
        SUM(COALESCE(labor_cost_saved, 0)) as total_labor_cost_saved,
        SUM(COALESCE(value_created, 0)) as total_value_created,
        SUM(COALESCE(implementation_cost_applied, 0)) as total_implementation_costs,
        COUNT(*) as workflows_with_roi
    FROM public.vw_workflow_roi_calculated
    GROUP BY client_id, currency_code
),
tool_costs_calculated AS (
    SELECT 
        tc.client_id,
        SUM(
            CASE 
                -- Exclude one-time fees (tools with end_date) - they should be handled separately
                WHEN tc.end_date IS NOT NULL THEN
                    0
                -- Handle NULL or missing start_date, or future dates
                WHEN tc.start_date IS NULL OR tc.start_date > CURRENT_DATE THEN
                    0
                WHEN tc.period = 'monthly' THEN
                    tc.cost * 
                    GREATEST(0, EXTRACT(YEAR FROM AGE(CURRENT_DATE, tc.start_date))::INTEGER * 12 + EXTRACT(MONTH FROM AGE(CURRENT_DATE, tc.start_date))::INTEGER)
                WHEN tc.period = 'quarterly' THEN
                    tc.cost * 
                    GREATEST(0, FLOOR((EXTRACT(YEAR FROM AGE(CURRENT_DATE, tc.start_date))::INTEGER * 12 + EXTRACT(MONTH FROM AGE(CURRENT_DATE, tc.start_date))::INTEGER) / 3.0))
                WHEN tc.period = 'yearly' THEN
                    tc.cost * 
                    GREATEST(0, EXTRACT(YEAR FROM AGE(CURRENT_DATE, tc.start_date))::INTEGER)
                WHEN tc.period = '24months' THEN
                    tc.cost * 
                    GREATEST(0, FLOOR((EXTRACT(YEAR FROM AGE(CURRENT_DATE, tc.start_date))::INTEGER * 12 + EXTRACT(MONTH FROM AGE(CURRENT_DATE, tc.start_date))::INTEGER) / 24.0))
                ELSE 0
            END
        ) as total_tool_costs
    FROM public.n8n_tool_costs tc
    WHERE tc.enabled = true
    GROUP BY tc.client_id
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
    COALESCE(tc.total_tool_costs, 0) as total_tool_costs,
    COALESCE(wr.total_implementation_costs, 0) + COALESCE(tc.total_tool_costs, 0) as total_automation_cost,
    -- Net ROI = (Labor Cost Saved + Value Created) - Total Automation Cost
    (COALESCE(wr.total_labor_cost_saved, 0) + COALESCE(wr.total_value_created, 0)) - 
    (COALESCE(wr.total_implementation_costs, 0) + COALESCE(tc.total_tool_costs, 0)) as net_roi,
    COALESCE(wr.currency_code, 'GBP') as currency_code,
    COALESCE(wr.workflows_with_roi, 0) as workflows_with_roi
FROM public.n8n_clients c
LEFT JOIN workflow_roi wr ON c.id = wr.client_id
LEFT JOIN tool_costs_calculated tc ON c.id = tc.client_id;

