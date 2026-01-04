-- Add frequency column to n8n_workflow_roi table if it doesn't exist
-- This column is used for both recurring_task and new_capability workflows

-- Add frequency column (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'n8n_workflow_roi' 
          AND column_name = 'frequency'
    ) THEN
        ALTER TABLE public.n8n_workflow_roi
        ADD COLUMN frequency TEXT CHECK (frequency IN ('daily', 'weekly', 'monthly', 'quarterly'));
        
        COMMENT ON COLUMN public.n8n_workflow_roi.frequency IS 'Frequency for recurring_task (occurrences per period) or new_capability (value generation period): daily, weekly, monthly, quarterly';
    END IF;
END $$;

-- Verify the column was added
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'n8n_workflow_roi'
  AND column_name = 'frequency';

