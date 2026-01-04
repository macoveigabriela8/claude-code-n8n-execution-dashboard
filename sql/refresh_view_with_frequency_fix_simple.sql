-- Refresh vw_workflow_roi_calculated view to include frequency-based calculation for new_capability
-- Simplified version that doesn't require initial_setup_fee column

-- Drop the view first (CASCADE to drop dependent views if any)
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

-- Verify the view was refreshed
SELECT 'View vw_workflow_roi_calculated refreshed successfully' as status;

