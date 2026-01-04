-- Migration: Add currency_code to n8n_clients table
-- Currency is set once per client, not per workflow

-- Add currency_code column to n8n_clients table
ALTER TABLE public.n8n_clients
ADD COLUMN IF NOT EXISTS currency_code TEXT DEFAULT 'GBP';

-- Update existing clients to use GBP if currency_code is NULL
UPDATE public.n8n_clients
SET currency_code = 'GBP'
WHERE currency_code IS NULL;


