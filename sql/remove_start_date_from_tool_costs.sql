-- Remove start_date from n8n_tool_costs table
-- Tool costs are allocated from workflow deployment_date, not tool start_date
-- Run this in Supabase SQL Editor

-- Step 1: Make start_date nullable (if it's NOT NULL)
ALTER TABLE public.n8n_tool_costs 
ALTER COLUMN start_date DROP NOT NULL;

-- Step 2: Drop the start_date column entirely
-- Note: This will remove all start_date data, which is fine since we don't use it
ALTER TABLE public.n8n_tool_costs 
DROP COLUMN IF EXISTS start_date;

