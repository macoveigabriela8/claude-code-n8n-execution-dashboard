-- Add frequency and value_per_frequency support for new_capability workflows
-- This allows new_capability workflows to calculate value per time period (daily/weekly/monthly/quarterly)
-- instead of just per execution

-- Add value_per_frequency column to n8n_workflow_roi table
ALTER TABLE public.n8n_workflow_roi
ADD COLUMN IF NOT EXISTS value_per_frequency DECIMAL(10,2);

-- Note: frequency column already exists and is nullable, so it can be used for both
-- recurring_task and new_capability workflows. No constraint changes needed.

-- Add comment to document the new field
COMMENT ON COLUMN public.n8n_workflow_roi.value_per_frequency IS 'Value per frequency period for new_capability workflows (e.g., 350 for £350 per month). Used when frequency is set for new_capability type.';

