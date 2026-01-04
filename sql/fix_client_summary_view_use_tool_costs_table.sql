-- Fix vw_client_roi_summary to use n8n_tool_costs table instead of JSONB column
-- This matches the frontend calculation logic
-- Run this in Supabase SQL Editor

DROP VIEW IF EXISTS public.vw_client_roi_summary CASCADE;

CREATE VIEW public.vw_client_roi_summary AS
WITH earliest_deployment_dates AS (
    SELECT 
        client_id,
        MIN(deployment_date) as earliest_deployment_date
    FROM public.vw_workflow_roi_calculated
    GROUP BY client_id
),
workflow_roi AS (
    SELECT 
        client_id,
        currency_code,
        SUM(COALESCE(minutes_saved, 0)) as total_minutes_saved,
        SUM(COALESCE(labor_cost_saved, 0)) as total_labor_cost_saved,
        SUM(COALESCE(value_created, 0)) as total_value_created,
        -- Match breakdown logic: use implementation_cost_applied OR implementation_cost (fallback)
        -- JavaScript: implementation_cost_applied || implementation_cost || 0
        SUM(
            CASE 
                WHEN implementation_cost_applied > 0 THEN implementation_cost_applied
                ELSE COALESCE(implementation_cost, 0)
            END
        ) as total_implementation_costs,
        COUNT(*) as workflows_with_roi
    FROM public.vw_workflow_roi_calculated
    GROUP BY client_id, currency_code
),
tool_costs_calculated AS (
    SELECT 
        tc.client_id,
        -- One-time fees: just the cost if end_date is in the past (goes to implementation costs)
        SUM(
            CASE 
                WHEN tc.recurring = false AND tc.end_date IS NOT NULL AND tc.end_date <= CURRENT_DATE THEN tc.cost
                ELSE 0
            END
        ) as total_one_time_fees,
        -- Recurring tools: calculate based on start_date (or earliest deployment date if start_date is NULL)
        SUM(
            CASE 
                WHEN tc.recurring = true THEN
                    CASE 
                        -- Use start_date if available, otherwise fall back to earliest deployment date
                        WHEN COALESCE(tc.start_date, ed.earliest_deployment_date) IS NULL THEN 0
                        ELSE
                            CASE
                                WHEN tc.period = 'monthly' THEN
                                    -- Monthly: charge per month since start (charge only for complete months)
                                    tc.cost * GREATEST(0, 
                                        EXTRACT(YEAR FROM AGE(CURRENT_DATE, COALESCE(tc.start_date, ed.earliest_deployment_date)))::INTEGER * 12 + 
                                        EXTRACT(MONTH FROM AGE(CURRENT_DATE, COALESCE(tc.start_date, ed.earliest_deployment_date)))::INTEGER
                                    )
                                WHEN tc.period = 'quarterly' THEN
                                    -- Quarterly: charge per complete quarter
                                    tc.cost * GREATEST(0, 
                                        FLOOR((EXTRACT(YEAR FROM AGE(CURRENT_DATE, COALESCE(tc.start_date, ed.earliest_deployment_date)))::INTEGER * 12 + 
                                        EXTRACT(MONTH FROM AGE(CURRENT_DATE, COALESCE(tc.start_date, ed.earliest_deployment_date)))::INTEGER + 1) / 3.0)
                                    )
                                WHEN tc.period = 'yearly' THEN
                                    -- Yearly: charge full year immediately, then accumulate each year
                                    tc.cost * GREATEST(1, 
                                        FLOOR(
                                            (EXTRACT(YEAR FROM AGE(CURRENT_DATE, COALESCE(tc.start_date, ed.earliest_deployment_date)))::INTEGER * 12 + 
                                             EXTRACT(MONTH FROM AGE(CURRENT_DATE, COALESCE(tc.start_date, ed.earliest_deployment_date)))::INTEGER + 1) / 12.0
                                        )
                                    )
                                WHEN tc.period = '24months' THEN
                                    -- 24months: charge per complete 24-month period
                                    tc.cost * GREATEST(0, 
                                        FLOOR((EXTRACT(YEAR FROM AGE(CURRENT_DATE, COALESCE(tc.start_date, ed.earliest_deployment_date)))::INTEGER * 12 + 
                                        EXTRACT(MONTH FROM AGE(CURRENT_DATE, COALESCE(tc.start_date, ed.earliest_deployment_date)))::INTEGER + 1) / 24.0)
                                    )
                                ELSE 0
                            END
                    END
                ELSE 0
            END
        ) as total_tool_costs
    FROM public.n8n_tool_costs tc
    LEFT JOIN earliest_deployment_dates ed ON tc.client_id = ed.client_id
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
    -- Match breakdown: DEVELOPMENT = workflow implementation costs + one-time fees
    COALESCE(wr.total_implementation_costs, 0) + COALESCE(tc.total_one_time_fees, 0) as total_implementation_costs,
    -- Match breakdown: TOOLS = recurring tools only
    COALESCE(tc.total_tool_costs, 0) as total_tool_costs,
    -- Total automation cost = implementation costs + tool costs
    (COALESCE(wr.total_implementation_costs, 0) + COALESCE(tc.total_one_time_fees, 0)) + COALESCE(tc.total_tool_costs, 0) as total_automation_cost,
    -- Net ROI = (Labor Cost Saved + Value Created) - Total Automation Cost
    (COALESCE(wr.total_labor_cost_saved, 0) + COALESCE(wr.total_value_created, 0)) - 
    ((COALESCE(wr.total_implementation_costs, 0) + COALESCE(tc.total_one_time_fees, 0)) + COALESCE(tc.total_tool_costs, 0)) as net_roi,
    COALESCE(wr.currency_code, 'GBP') as currency_code,
    COALESCE(wr.workflows_with_roi, 0) as workflows_with_roi
FROM public.n8n_clients c
LEFT JOIN workflow_roi wr ON c.id = wr.client_id
LEFT JOIN tool_costs_calculated tc ON c.id = tc.client_id;

