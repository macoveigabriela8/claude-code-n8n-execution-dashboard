-- Section 3: WORKFLOW ROI BREAKDOWN DATA
-- This shows individual workflow values
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

