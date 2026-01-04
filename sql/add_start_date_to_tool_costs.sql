-- Add start_date column to n8n_tool_costs table
-- This field tracks when each tool subscription started
-- Used for calculating recurring tool costs. If NULL, falls back to earliest workflow deployment date.

-- Add column if it doesn't exist (nullable by default)
ALTER TABLE public.n8n_tool_costs 
ADD COLUMN IF NOT EXISTS start_date DATE;

-- Ensure the column allows NULL (in case it was created with NOT NULL constraint)
ALTER TABLE public.n8n_tool_costs 
ALTER COLUMN start_date DROP NOT NULL;

-- Add comment explaining the field
COMMENT ON COLUMN public.n8n_tool_costs.start_date IS 
'Date when the tool subscription started. Used for calculating recurring tool costs. If NULL, falls back to earliest workflow deployment date.';

