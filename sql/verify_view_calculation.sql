-- Verify which calculation is being used for a specific workflow
-- Replace 'GR31TEv3S1CWkzfX' with your workflow_id if different

SELECT 
    r.workflow_id,
    w.workflow_name,
    r.roi_type,
    r.frequency,
    r.value_per_frequency,
    r.clients_per_report,
    r.reactivation_rate_percent,
    r.value_per_client,
    r.value_per_execution,
    es.days_since_deployment,
    es.successful_executions,
    -- Show which condition matches
    CASE 
        WHEN r.frequency IS NOT NULL AND r.value_per_frequency IS NOT NULL THEN 'FREQUENCY-BASED'
        WHEN r.clients_per_report IS NOT NULL AND r.reactivation_rate_percent IS NOT NULL AND r.value_per_client IS NOT NULL THEN 'EXECUTION-BASED (aggregate)'
        WHEN r.value_per_execution IS NOT NULL THEN 'EXECUTION-BASED (simple)'
        ELSE 'NONE'
    END as calculation_type,
    -- Show the actual calculation result
    CASE r.roi_type
        WHEN 'new_capability' THEN
            CASE 
                WHEN r.frequency IS NOT NULL AND r.value_per_frequency IS NOT NULL THEN
                    CASE r.frequency
                        WHEN 'daily' THEN es.days_since_deployment * COALESCE(r.value_per_frequency, 0)
                        WHEN 'weekly' THEN (es.days_since_deployment / 7.0) * COALESCE(r.value_per_frequency, 0)
                        WHEN 'monthly' THEN (es.days_since_deployment / 30.44) * COALESCE(r.value_per_frequency, 0)
                        WHEN 'quarterly' THEN (es.days_since_deployment / 91.25) * COALESCE(r.value_per_frequency, 0)
                        ELSE 0
                    END
                WHEN r.clients_per_report IS NOT NULL AND r.reactivation_rate_percent IS NOT NULL AND r.value_per_client IS NOT NULL THEN
                    es.successful_executions * r.clients_per_report * (r.reactivation_rate_percent / 100.0) * r.value_per_client
                WHEN r.value_per_execution IS NOT NULL THEN
                    es.successful_executions * r.value_per_execution
                ELSE 0
            END
        ELSE NULL
    END as calculated_value_created,
    -- Also get the value from the view
    v.value_created as view_value_created
FROM public.n8n_workflow_roi r
LEFT JOIN public.n8n_workflows w ON r.workflow_id = w.workflow_id AND r.client_id = w.client_id
LEFT JOIN LATERAL (
    SELECT 
        COUNT(*) FILTER (WHERE e.status = 'success' AND e.started_at >= r.deployment_date) as successful_executions,
        (CURRENT_DATE - r.deployment_date)::INTEGER as days_since_deployment
    FROM public.n8n_executions e
    WHERE e.workflow_id = r.workflow_id AND e.client_id = r.client_id
) es ON true
LEFT JOIN public.vw_workflow_roi_calculated v ON r.workflow_id = v.workflow_id AND r.client_id = v.client_id
WHERE r.workflow_id = 'GR31TEv3S1CWkzfX'
  AND r.client_id = '03acd728-2a3a-47ce-8e14-2d9d112b348e';

