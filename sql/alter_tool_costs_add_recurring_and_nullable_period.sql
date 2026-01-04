-- Add recurring boolean column and make period nullable for one-time fees
-- Run this in Supabase SQL Editor

-- 1. Add recurring column with default true
ALTER TABLE public.n8n_tool_costs 
ADD COLUMN IF NOT EXISTS recurring BOOLEAN NOT NULL DEFAULT true;

-- 2. Update existing records: set recurring = false for one-time fees (end_date IS NOT NULL)
UPDATE public.n8n_tool_costs
SET recurring = false
WHERE end_date IS NOT NULL;

-- 3. Make period nullable
ALTER TABLE public.n8n_tool_costs
ALTER COLUMN period DROP NOT NULL;

-- 4. Set period to NULL for one-time fees
UPDATE public.n8n_tool_costs
SET period = NULL
WHERE recurring = false;

-- 5. Drop existing CHECK constraint on period (if it exists)
ALTER TABLE public.n8n_tool_costs
DROP CONSTRAINT IF EXISTS n8n_tool_costs_period_check;

-- 6. Add new CHECK constraint for period (allows NULL)
ALTER TABLE public.n8n_tool_costs
ADD CONSTRAINT n8n_tool_costs_period_check 
CHECK (period IS NULL OR period IN ('monthly', 'quarterly', 'yearly', '24months'));

-- 7. Add CHECK constraint to ensure data consistency:
--    - If recurring = true, then end_date must be NULL and period must NOT be NULL
--    - If recurring = false, then end_date must NOT be NULL and period should be NULL (recommended but not enforced)
ALTER TABLE public.n8n_tool_costs
DROP CONSTRAINT IF EXISTS n8n_tool_costs_recurring_consistency_check;

ALTER TABLE public.n8n_tool_costs
ADD CONSTRAINT n8n_tool_costs_recurring_consistency_check
CHECK (
    (recurring = true AND end_date IS NULL) OR
    (recurring = false AND end_date IS NOT NULL)
);

