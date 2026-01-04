-- Restore both views: vw_workflow_roi_calculated and vw_client_roi_summary
-- Run this if the views were accidentally dropped

-- First, recreate vw_workflow_roi_calculated
DROP VIEW IF EXISTS public.vw_workflow_roi_calculated CASCADE;

CREATE VIEW public.vw_workflow_roi_calculated AS
WITH total_workflows AS (
    SELECT 
        client_id,
        COUNT(*) as total_workflows
    FROM public.n8n_workflows
    WHERE is_active = true
    GROUP BY client_id
),
workflow_counts AS (
    SELECT 
        client_id,
        COUNT(*) as total_workflows_with_roi
    FROM public.n8n_workflow_roi
    WHERE deployment_date IS NOT NULL
    GROUP BY client_id
),
execution_stats AS (
    SELECT 
        e.client_id,
        e.workflow_id,
        COUNT(*) FILTER (WHERE e.status = 'success' AND e.started_at >= r.deployment_date) as successful_executions,
        COUNT(*) FILTER (WHERE e.started_at >= r.deployment_date) as total_executions,
        (CURRENT_DATE - r.deployment_date)::INTEGER as days_since_deployment
    FROM public.n8n_workflow_roi r
    LEFT JOIN public.n8n_executions e ON r.workflow_id = e.workflow_id AND r.client_id = e.client_id
    WHERE r.deployment_date IS NOT NULL
    GROUP BY e.client_id, e.workflow_id, r.deployment_date
)
SELECT 
    r.id,
    r.client_id,
    r.workflow_id,
    w.workflow_name,
    r.roi_type,
    r.currency_code,
    r.deployment_date,
    r.implementation_cost,
    r.implementation_date,
    es.days_since_deployment,
    es.successful_executions,
    es.total_executions,
    
    -- Calculate time saved and value based on ROI type
    CASE r.roi_type
        WHEN 'per_execution' THEN
            es.successful_executions * COALESCE(r.manual_minutes_saved, 0)
        WHEN 'recurring_task' THEN
            CASE r.frequency
                WHEN 'daily' THEN
                    es.days_since_deployment * r.occurrences_per_frequency * COALESCE(r.manual_minutes_saved, 0)
                WHEN 'weekly' THEN
                    (es.days_since_deployment / 7.0) * r.occurrences_per_frequency * COALESCE(r.manual_minutes_saved, 0)
                WHEN 'monthly' THEN
                    FLOOR(es.days_since_deployment / 30.44) * r.occurrences_per_frequency * COALESCE(r.manual_minutes_saved, 0)
                WHEN 'quarterly' THEN
                    FLOOR(es.days_since_deployment / 91.25) * r.occurrences_per_frequency * COALESCE(r.manual_minutes_saved, 0)
                ELSE 0
            END
        ELSE NULL
    END as minutes_saved,
    
    -- Calculate labor cost saved (for per_execution and recurring_task)
    CASE 
        WHEN r.roi_type IN ('per_execution', 'recurring_task') THEN
            (CASE r.roi_type
                WHEN 'per_execution' THEN
                    es.successful_executions * COALESCE(r.manual_minutes_saved, 0)
                WHEN 'recurring_task' THEN
                    CASE r.frequency
                        WHEN 'daily' THEN
                            es.days_since_deployment * r.occurrences_per_frequency * COALESCE(r.manual_minutes_saved, 0)
                        WHEN 'weekly' THEN
                            (es.days_since_deployment / 7.0) * r.occurrences_per_frequency * COALESCE(r.manual_minutes_saved, 0)
                        WHEN 'monthly' THEN
                            FLOOR(es.days_since_deployment / 30.44) * r.occurrences_per_frequency * COALESCE(r.manual_minutes_saved, 0)
                        WHEN 'quarterly' THEN
                            FLOOR(es.days_since_deployment / 91.25) * r.occurrences_per_frequency * COALESCE(r.manual_minutes_saved, 0)
                        ELSE 0
                    END
                ELSE 0
            END / 60.0) * COALESCE(r.hourly_rate, 0)
        ELSE NULL
    END as labor_cost_saved,
    
    -- Calculate value created (for new_capability)
    -- CRITICAL: Frequency-based calculation MUST be checked FIRST to take priority
    CASE r.roi_type
        WHEN 'new_capability' THEN
            CASE 
                -- Frequency-based calculation (PRIORITY - checked first)
                WHEN r.frequency IS NOT NULL AND r.value_per_frequency IS NOT NULL THEN
                    CASE r.frequency
                        WHEN 'daily' THEN
                            es.days_since_deployment * COALESCE(r.value_per_frequency, 0)
                        WHEN 'weekly' THEN
                            (es.days_since_deployment / 7.0) * COALESCE(r.value_per_frequency, 0)
                        WHEN 'monthly' THEN
                            (es.days_since_deployment / 30.44) * COALESCE(r.value_per_frequency, 0)
                        WHEN 'quarterly' THEN
                            (es.days_since_deployment / 91.25) * COALESCE(r.value_per_frequency, 0)
                        ELSE 0
                    END
                -- Execution-based calculation (backward compatibility - only if frequency/value_per_frequency NOT set)
                WHEN r.clients_per_report IS NOT NULL AND r.reactivation_rate_percent IS NOT NULL AND r.value_per_client IS NOT NULL THEN
                    -- Aggregate/report pattern
                    es.successful_executions * r.clients_per_report * (r.reactivation_rate_percent / 100.0) * r.value_per_client
                WHEN r.value_per_execution IS NOT NULL THEN
                    -- Simple value per execution
                    es.successful_executions * r.value_per_execution
                ELSE 0
            END
        ELSE NULL
    END as value_created,
    
    -- Workflow-specific implementation cost (one-time, if implementation_date is set and passed)
    CASE 
        WHEN r.implementation_date IS NOT NULL AND r.implementation_date <= CURRENT_DATE THEN
            COALESCE(r.implementation_cost, 0)
        ELSE 0
    END as workflow_implementation_cost,
    
    -- Allocated setup fee (set to 0 if column doesn't exist)
    0 as allocated_setup_fee,
    
    -- Total implementation cost (workflow-specific only, since setup fee column may not exist)
    CASE 
        WHEN r.implementation_date IS NOT NULL AND r.implementation_date <= CURRENT_DATE THEN
            COALESCE(r.implementation_cost, 0)
        ELSE 0
    END as implementation_cost_applied,
    
    r.value_description,
    r.notes
    
FROM public.n8n_workflow_roi r
LEFT JOIN public.n8n_workflows w ON r.workflow_id = w.workflow_id AND r.client_id = w.client_id
LEFT JOIN public.n8n_clients c ON r.client_id = c.id
LEFT JOIN total_workflows tw ON r.client_id = tw.client_id
LEFT JOIN workflow_counts wc ON r.client_id = wc.client_id
LEFT JOIN execution_stats es ON r.workflow_id = es.workflow_id AND r.client_id = es.client_id
WHERE r.deployment_date IS NOT NULL;

-- Now recreate vw_client_roi_summary (which depends on vw_workflow_roi_calculated)
DROP VIEW IF EXISTS public.vw_client_roi_summary CASCADE;

CREATE VIEW public.vw_client_roi_summary AS
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
        c.id as client_id,
        SUM(
            CASE 
                -- Exclude one-time fees (tools with end_date) - they should be handled separately
                WHEN tool->>'end_date' IS NOT NULL THEN
                    0
                -- Handle NULL or missing start_date, or future dates
                WHEN tool->>'start_date' IS NULL OR (tool->>'start_date')::DATE > CURRENT_DATE THEN
                    0
                WHEN tool->>'period' = 'monthly' THEN
                    (tool->>'cost')::DECIMAL * 
                    GREATEST(0, EXTRACT(YEAR FROM AGE(CURRENT_DATE, (tool->>'start_date')::DATE))::INTEGER * 12 + EXTRACT(MONTH FROM AGE(CURRENT_DATE, (tool->>'start_date')::DATE))::INTEGER)
                WHEN tool->>'period' = 'quarterly' THEN
                    (tool->>'cost')::DECIMAL * 
                    GREATEST(0, FLOOR((EXTRACT(YEAR FROM AGE(CURRENT_DATE, (tool->>'start_date')::DATE))::INTEGER * 12 + EXTRACT(MONTH FROM AGE(CURRENT_DATE, (tool->>'start_date')::DATE))::INTEGER) / 3.0))
                WHEN tool->>'period' = 'yearly' THEN
                    (tool->>'cost')::DECIMAL * 
                    GREATEST(0, EXTRACT(YEAR FROM AGE(CURRENT_DATE, (tool->>'start_date')::DATE))::INTEGER)
                WHEN tool->>'period' = '24months' THEN
                    (tool->>'cost')::DECIMAL * 
                    GREATEST(0, FLOOR((EXTRACT(YEAR FROM AGE(CURRENT_DATE, (tool->>'start_date')::DATE))::INTEGER * 12 + EXTRACT(MONTH FROM AGE(CURRENT_DATE, (tool->>'start_date')::DATE))::INTEGER) / 24.0))
                ELSE 0
            END
        ) as total_tool_costs
    FROM public.n8n_clients c
    CROSS JOIN LATERAL jsonb_array_elements(COALESCE(c.tool_costs, '[]'::jsonb)) as tool
    GROUP BY c.id
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

SELECT 'Views vw_workflow_roi_calculated and vw_client_roi_summary restored successfully' as status;

