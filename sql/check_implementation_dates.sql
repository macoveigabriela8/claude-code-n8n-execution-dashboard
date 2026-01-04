-- Check implementation dates vs implementation_cost_applied logic
SELECT 
    workflow_id,
    workflow_name,
    implementation_cost,
    implementation_date,
    implementation_cost_applied,
    deployment_date,
    CURRENT_DATE as today,
    CASE 
        WHEN implementation_date IS NOT NULL AND implementation_date <= CURRENT_DATE THEN 'SHOULD APPLY'
        WHEN implementation_date IS NOT NULL AND implementation_date > CURRENT_DATE THEN 'FUTURE DATE'
        WHEN implementation_date IS NULL THEN 'NO DATE'
        ELSE 'UNKNOWN'
    END as should_apply_status
FROM public.vw_workflow_roi_calculated
WHERE client_id = '03acd728-2a3a-47ce-8e14-2d9d112b348e'
ORDER BY workflow_name;

