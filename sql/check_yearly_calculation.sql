-- Check yearly calculation logic
-- Hosting: £76.71/year, deployed 2025-12-11
-- Today's date
SELECT CURRENT_DATE as today;

-- Calculate months since deployment
WITH earliest_deployment_dates AS (
    SELECT 
        '03acd728-2a3a-47ce-8e14-2d9d112b348e'::uuid as client_id,
        '2025-12-11'::date as earliest_deployment_date
)
SELECT 
    ed.earliest_deployment_date,
    CURRENT_DATE as today,
    EXTRACT(YEAR FROM AGE(CURRENT_DATE, ed.earliest_deployment_date))::INTEGER as years_diff,
    EXTRACT(MONTH FROM AGE(CURRENT_DATE, ed.earliest_deployment_date))::INTEGER as months_diff,
    CASE 
        WHEN EXTRACT(MONTH FROM AGE(CURRENT_DATE, ed.earliest_deployment_date))::INTEGER >= 0 THEN 1 ELSE 0 
    END as add_one,
    EXTRACT(YEAR FROM AGE(CURRENT_DATE, ed.earliest_deployment_date))::INTEGER + 
        CASE WHEN EXTRACT(MONTH FROM AGE(CURRENT_DATE, ed.earliest_deployment_date))::INTEGER >= 0 THEN 1 ELSE 0 END as years_calculation,
    76.71 * GREATEST(0,
        EXTRACT(YEAR FROM AGE(CURRENT_DATE, ed.earliest_deployment_date))::INTEGER + 
        CASE WHEN EXTRACT(MONTH FROM AGE(CURRENT_DATE, ed.earliest_deployment_date))::INTEGER >= 0 THEN 1 ELSE 0 END
    ) as calculated_cost
FROM earliest_deployment_dates ed;

