-- Create n8n_tool_costs table to replace JSONB storage
-- Run this in Supabase SQL Editor

-- 1. Create the tool_costs table
CREATE TABLE IF NOT EXISTS public.n8n_tool_costs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES public.n8n_clients(id) ON DELETE CASCADE,
    tool TEXT NOT NULL,
    cost DECIMAL(10,2) NOT NULL DEFAULT 0,
    recurring BOOLEAN NOT NULL DEFAULT true,
    period TEXT CHECK (period IS NULL OR period IN ('monthly', 'quarterly', 'yearly', '24months')),
    end_date DATE,
    currency_code TEXT,
    enabled BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(client_id, tool),
    CONSTRAINT n8n_tool_costs_recurring_consistency_check
        CHECK (
            (recurring = true AND end_date IS NULL) OR
            (recurring = false AND end_date IS NOT NULL)
        )
);

-- 2. Create indexes
CREATE INDEX IF NOT EXISTS idx_tool_costs_client ON public.n8n_tool_costs(client_id);
CREATE INDEX IF NOT EXISTS idx_tool_costs_enabled ON public.n8n_tool_costs(client_id, enabled) WHERE enabled = true;

-- 3. Add comment
COMMENT ON TABLE public.n8n_tool_costs IS 'Stores tool costs for each client. Replaces JSONB storage in n8n_clients.tool_costs column.';

