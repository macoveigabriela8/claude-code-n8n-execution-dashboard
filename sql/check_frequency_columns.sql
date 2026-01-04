-- Check if frequency and value_per_frequency columns exist in n8n_workflow_roi table
-- This script helps verify the database schema

-- Check if frequency column exists
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'n8n_workflow_roi'
  AND column_name IN ('frequency', 'value_per_frequency')
ORDER BY column_name;

-- If you want to see ALL columns in the table (for reference):
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_schema = 'public'
--   AND table_name = 'n8n_workflow_roi'
-- ORDER BY ordinal_position;

