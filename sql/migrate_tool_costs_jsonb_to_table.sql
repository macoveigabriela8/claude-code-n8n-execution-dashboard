-- Migration script to move tool costs from JSONB to table
-- Run this AFTER creating the n8n_tool_costs table
-- Run this in Supabase SQL Editor

-- Migrate data from n8n_clients.tool_costs JSONB to n8n_tool_costs table
-- Note: start_date is no longer used (tool costs allocated from workflow deployment_date)
INSERT INTO public.n8n_tool_costs (client_id, tool, cost, period, end_date, currency_code, enabled)
SELECT 
    c.id as client_id,
    (tool->>'tool')::TEXT as tool,
    COALESCE((tool->>'cost')::DECIMAL, 0) as cost,
    COALESCE((tool->>'period')::TEXT, 'monthly') as period,
    CASE 
        WHEN tool->>'end_date' IS NOT NULL AND (tool->>'end_date')::TEXT != '' THEN
            (tool->>'end_date')::DATE
        ELSE NULL
    END as end_date,
    (tool->>'currency_code')::TEXT as currency_code,
    COALESCE((tool->>'enabled')::BOOLEAN, true) as enabled
FROM public.n8n_clients c
CROSS JOIN LATERAL jsonb_array_elements(COALESCE(c.tool_costs, '[]'::jsonb)) as tool
WHERE c.tool_costs IS NOT NULL 
  AND jsonb_array_length(COALESCE(c.tool_costs, '[]'::jsonb)) > 0
  AND tool->>'tool' IS NOT NULL
ON CONFLICT (client_id, tool) DO UPDATE
SET
    cost = EXCLUDED.cost,
    period = EXCLUDED.period,
    end_date = EXCLUDED.end_date,
    currency_code = EXCLUDED.currency_code,
    enabled = EXCLUDED.enabled,
    updated_at = NOW();

-- Verify migration (optional - check counts)
-- SELECT 
--     (SELECT COUNT(*) FROM public.n8n_tool_costs) as table_count,
--     (SELECT SUM(jsonb_array_length(COALESCE(tool_costs, '[]'::jsonb))) FROM public.n8n_clients WHERE tool_costs IS NOT NULL) as jsonb_count;

