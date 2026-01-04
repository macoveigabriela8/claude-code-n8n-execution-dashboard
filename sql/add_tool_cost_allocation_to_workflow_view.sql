-- Add tool cost allocation per workflow to vw_workflow_roi_calculated
-- Tool costs are allocated based on deployment_date and number of active workflows
-- Run this in Supabase SQL Editor

-- Drop the existing view first to avoid column name conflicts
DROP VIEW IF EXISTS public.vw_workflow_roi_calculated CASCADE;

CREATE VIEW public.vw_workflow_roi_calculated AS
WITH total_workflows AS (
    -- Count ALL workflows for the client (for allocation purposes)
    SELECT 
        client_id,
        COUNT(*) as total_workflows
    FROM public.n8n_workflows
    WHERE is_active = true
    GROUP BY client_id
),
workflow_counts AS (
    -- Count workflows with ROI configs (with deployment_date) per client
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
    WHERE r.deployment_date IS NOT NULL  -- Only include workflows with deployment_date
    GROUP BY e.client_id, e.workflow_id, r.deployment_date
),
tool_cost_workflow_counts AS (
    -- Count active workflows per client for allocation
    SELECT 
        client_id,
        COUNT(*) as total_workflows_count
    FROM public.n8n_workflow_roi
    WHERE deployment_date IS NOT NULL
    GROUP BY client_id
),
recurring_tool_costs AS (
    -- Recurring tool costs: (monthly_equivalent_cost ÷ workflows) × months_since_deployment
    SELECT 
        r.workflow_id,
        r.client_id,
        r.deployment_date,
        SUM(
            CASE tc.period
                WHEN 'monthly' THEN
                    -- Formula: (cost ÷ 1 month) ÷ workflows × months_active
                    (tc.cost / GREATEST(1, twc.total_workflows_count)) * 
                    GREATEST(0, 
                        EXTRACT(YEAR FROM AGE(CURRENT_DATE, r.deployment_date))::INTEGER * 12 + 
                        EXTRACT(MONTH FROM AGE(CURRENT_DATE, r.deployment_date))::INTEGER + 1
                    )
                WHEN 'quarterly' THEN
                    -- Formula: (cost ÷ 3 months) ÷ workflows × months_active
                    (tc.cost / 3.0 / GREATEST(1, twc.total_workflows_count)) * 
                    GREATEST(0, 
                        EXTRACT(YEAR FROM AGE(CURRENT_DATE, r.deployment_date))::INTEGER * 12 + 
                        EXTRACT(MONTH FROM AGE(CURRENT_DATE, r.deployment_date))::INTEGER + 1
                    )
                WHEN 'yearly' THEN
                    -- Formula: (cost ÷ 12 months) ÷ workflows × months_active
                    (tc.cost / 12.0 / GREATEST(1, twc.total_workflows_count)) * 
                    GREATEST(0, 
                        EXTRACT(YEAR FROM AGE(CURRENT_DATE, r.deployment_date))::INTEGER * 12 + 
                        EXTRACT(MONTH FROM AGE(CURRENT_DATE, r.deployment_date))::INTEGER + 1
                    )
                WHEN '24months' THEN
                    -- Formula: (cost ÷ 24 months) ÷ workflows × months_active
                    (tc.cost / 24.0 / GREATEST(1, twc.total_workflows_count)) * 
                    GREATEST(0, 
                        EXTRACT(YEAR FROM AGE(CURRENT_DATE, r.deployment_date))::INTEGER * 12 + 
                        EXTRACT(MONTH FROM AGE(CURRENT_DATE, r.deployment_date))::INTEGER + 1
                    )
                ELSE 0
            END
        ) as recurring_tool_cost_allocated_divided_by_workflows_times_months_active
    FROM public.n8n_workflow_roi r
    CROSS JOIN public.n8n_tool_costs tc
    INNER JOIN tool_cost_workflow_counts twc ON r.client_id = twc.client_id
        WHERE r.deployment_date IS NOT NULL
          AND tc.client_id = r.client_id
          AND tc.enabled = true
          AND tc.recurring = true  -- Only recurring costs
        GROUP BY r.workflow_id, r.client_id, r.deployment_date
),
one_time_tool_costs AS (
    -- One-time tool costs: cost ÷ number_of_workflows (no time multiplication)
    SELECT 
        r.workflow_id,
        r.client_id,
        r.deployment_date,
        SUM(
            -- Formula: cost ÷ workflows (one-time, not time-based)
            tc.cost / GREATEST(1, twc.total_workflows_count)
        ) as one_time_tool_cost_divided_by_number_of_workflows
    FROM public.n8n_workflow_roi r
    CROSS JOIN public.n8n_tool_costs tc
    INNER JOIN tool_cost_workflow_counts twc ON r.client_id = twc.client_id
        WHERE r.deployment_date IS NOT NULL
          AND tc.client_id = r.client_id
          AND tc.enabled = true
          AND tc.recurring = false  -- Only one-time fees
        GROUP BY r.workflow_id, r.client_id, r.deployment_date
),
tool_costs_allocated AS (
    -- Combine recurring and one-time tool costs
    SELECT 
        COALESCE(rtc.workflow_id, otc.workflow_id) as workflow_id,
        COALESCE(rtc.client_id, otc.client_id) as client_id,
        COALESCE(rtc.deployment_date, otc.deployment_date) as deployment_date,
        COALESCE(rtc.recurring_tool_cost_allocated_divided_by_workflows_times_months_active, 0) as recurring_tool_cost_allocated_divided_by_workflows_times_months_active,
        COALESCE(otc.one_time_tool_cost_divided_by_number_of_workflows, 0) as one_time_tool_cost_divided_by_number_of_workflows,
        COALESCE(rtc.recurring_tool_cost_allocated_divided_by_workflows_times_months_active, 0) + 
        COALESCE(otc.one_time_tool_cost_divided_by_number_of_workflows, 0) as total_tool_cost_allocated_per_workflow
    FROM recurring_tool_costs rtc
    FULL OUTER JOIN one_time_tool_costs otc 
        ON rtc.workflow_id = otc.workflow_id 
        AND rtc.client_id = otc.client_id
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
                    FLOOR(es.days_since_deployment / 7.0) * r.occurrences_per_frequency * COALESCE(r.manual_minutes_saved, 0)
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
                            FLOOR(es.days_since_deployment / 7.0) * r.occurrences_per_frequency * COALESCE(r.manual_minutes_saved, 0)
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
    CASE r.roi_type
        WHEN 'new_capability' THEN
            CASE 
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
    
    -- Allocated portion of client initial setup fee (divided by total workflows)
    -- Note: initial_setup_fee column not present in database, set to 0
    0 as allocated_setup_fee,
    
    -- Total implementation cost (workflow-specific only, since initial_setup_fee not available)
    CASE 
        WHEN r.implementation_date IS NOT NULL AND r.implementation_date <= CURRENT_DATE THEN
            COALESCE(r.implementation_cost, 0)
        ELSE 0
    END as implementation_cost_applied,
    
    -- Allocated tool cost per workflow (descriptive column names)
    COALESCE(tca.recurring_tool_cost_allocated_divided_by_workflows_times_months_active, 0) as recurring_tool_cost_allocated_divided_by_workflows_times_months_active,
    COALESCE(tca.one_time_tool_cost_divided_by_number_of_workflows, 0) as one_time_tool_cost_divided_by_number_of_workflows,
    COALESCE(tca.total_tool_cost_allocated_per_workflow, 0) as allocated_tool_cost,  -- Total: recurring + one-time
    
    r.value_description,
    r.notes
    
FROM public.n8n_workflow_roi r
LEFT JOIN public.n8n_workflows w ON r.workflow_id = w.workflow_id AND r.client_id = w.client_id
LEFT JOIN public.n8n_clients c ON r.client_id = c.id
LEFT JOIN total_workflows tw ON r.client_id = tw.client_id
LEFT JOIN workflow_counts wc ON r.client_id = wc.client_id
LEFT JOIN execution_stats es ON r.workflow_id = es.workflow_id AND r.client_id = es.client_id
LEFT JOIN tool_costs_allocated tca ON r.workflow_id = tca.workflow_id AND r.client_id = tca.client_id
WHERE r.deployment_date IS NOT NULL;  -- Only include workflows with deployment_date
