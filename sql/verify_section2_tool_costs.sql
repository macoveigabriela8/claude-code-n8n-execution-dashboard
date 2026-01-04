-- Section 2: TOOL COSTS VERIFICATION
-- This compares tool costs from NEW table vs OLD JSONB column
WITH tool_costs_new_table AS (
    SELECT 
        tc.client_id,
        tc.tool,
        tc.cost,
        tc.period,
        tc.recurring,
        tc.enabled,
        tc.end_date
    FROM public.n8n_tool_costs tc
    WHERE tc.client_id = '03acd728-2a3a-47ce-8e14-2d9d112b348e'
      AND tc.enabled = true
),
tool_costs_jsonb AS (
    SELECT 
        c.id as client_id,
        tool->>'tool_name' as tool_name,
        (tool->>'cost')::DECIMAL as cost,
        tool->>'period' as period,
        (tool->>'recurring')::BOOLEAN as recurring,
        (tool->>'enabled')::BOOLEAN as enabled,
        (tool->>'start_date')::DATE as start_date,
        (tool->>'end_date')::DATE as end_date
    FROM public.n8n_clients c
    CROSS JOIN LATERAL jsonb_array_elements(COALESCE(c.tool_costs, '[]'::jsonb)) as tool
    WHERE c.id = '03acd728-2a3a-47ce-8e14-2d9d112b348e'
)
SELECT 
    'TOOL COSTS - New Table' as source,
    client_id,
    COUNT(*) as tool_count,
    SUM(CASE WHEN recurring = false THEN cost ELSE 0 END) as one_time_total,
    SUM(CASE WHEN recurring = true THEN cost ELSE 0 END) as recurring_total
FROM tool_costs_new_table
GROUP BY client_id

UNION ALL

SELECT 
    'TOOL COSTS - JSONB Column' as source,
    client_id,
    COUNT(*) as tool_count,
    SUM(CASE WHEN recurring = false THEN cost ELSE 0 END) as one_time_total,
    SUM(CASE WHEN recurring = true THEN cost ELSE 0 END) as recurring_total
FROM tool_costs_jsonb
WHERE enabled = true OR enabled IS NULL
GROUP BY client_id;

