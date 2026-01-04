-- ROI Dashboard System - Database Schema
-- Run this in Supabase SQL Editor

-- 1. Create n8n_workflow_roi table
CREATE TABLE IF NOT EXISTS public.n8n_workflow_roi (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id TEXT NOT NULL,
    client_id UUID NOT NULL REFERENCES public.n8n_clients(id) ON DELETE CASCADE,
    
    -- ROI Calculation Type
    roi_type TEXT NOT NULL CHECK (roi_type IN (
        'per_execution',      -- Each successful run = time saved (e.g., letter generation)
        'recurring_task',     -- Replaces recurring manual task (daily/weekly/monthly/quarterly)
        'new_capability'      -- New value created (revenue/opportunity)
    )),
    
    -- Deployment tracking
    deployment_date DATE,  -- When ROI calculation starts (optional, but required for ROI calculation)
    
    -- Currency (inherits from client, but can be overridden per workflow)
    currency_code TEXT DEFAULT 'GBP',  -- ISO 4217 code: GBP, USD, EUR, etc.
    
    -- Work week configuration (5 or 6 days) - for recurring_task calculations
    work_days_per_week INTEGER CHECK (work_days_per_week IN (5, 6)) DEFAULT 5,
    
    -- For per_execution and recurring_task
    manual_minutes_saved INTEGER,
    hourly_rate DECIMAL(10,2),  -- Hourly rate in the specified currency
    
    -- Automation cost (workflow-specific)
    implementation_cost DECIMAL(10,2) DEFAULT 0,  -- One-time fixed implementation cost FOR THIS WORKFLOW
    implementation_date DATE,  -- When implementation was completed (for one-time cost)
    
    -- Note: Tool costs (n8n, supabase subscriptions) are CLIENT-LEVEL, stored separately
    -- See n8n_clients.tool_costs column
    
    -- For recurring_task only
    frequency TEXT CHECK (frequency IN ('daily', 'weekly', 'monthly', 'quarterly')),
    occurrences_per_frequency INTEGER DEFAULT 1,  -- Times per frequency period (e.g., 3 for "3 times per week")
    
    -- For new_capability only
    -- Option 1: Simple value per execution
    value_per_execution DECIMAL(10,2),
    
    -- Option 2: For conversion-based value patterns (reports, scrapers, lead generation, etc.)
    clients_per_report INTEGER,  -- Average number of items generated per execution (leads, clients, opportunities, etc.)
    reactivation_rate_percent DECIMAL(5,2),  -- Percentage that will convert (e.g., 2.0 for 2%)
    value_per_client DECIMAL(10,2),  -- Value per converted item/client/lead
    
    value_description TEXT,
    
    -- Metadata
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(workflow_id, client_id)
);

-- 2. Add tool_costs and initial_setup_fee columns to n8n_clients table
ALTER TABLE public.n8n_clients 
ADD COLUMN IF NOT EXISTS tool_costs JSONB DEFAULT '[]';

ALTER TABLE public.n8n_clients 
ADD COLUMN IF NOT EXISTS initial_setup_fee DECIMAL(10,2) DEFAULT 0;

-- Example tool_costs structure:
-- [{"tool": "n8n", "cost": 20.00, "period": "monthly", "start_date": "2024-01-01", "currency_code": "GBP"}, 
--  {"tool": "supabase", "cost": 25.00, "period": "monthly", "start_date": "2024-01-01", "currency_code": "GBP"}]

-- 3. Create indexes
CREATE INDEX IF NOT EXISTS idx_roi_workflow_client ON public.n8n_workflow_roi(workflow_id, client_id);
CREATE INDEX IF NOT EXISTS idx_roi_client ON public.n8n_workflow_roi(client_id);
CREATE INDEX IF NOT EXISTS idx_roi_deployment_date ON public.n8n_workflow_roi(deployment_date);

-- 4. Create view: vw_workflow_roi_calculated
-- This view calculates ROI per workflow since deployment
CREATE OR REPLACE VIEW public.vw_workflow_roi_calculated AS
WITH total_workflows AS (
    -- Count ALL workflows for the client (for allocation purposes)
    SELECT 
        client_id,
        COUNT(*) as total_workflows
    FROM public.n8n_workflows
    WHERE is_active = true
    GROUP BY client_id
),
workflow_counts AS (
    -- Count workflows with ROI configs (with deployment_date) per client
    SELECT 
        client_id,
        COUNT(*) as total_workflows_with_roi
    FROM public.n8n_workflow_roi
    WHERE deployment_date IS NOT NULL
    GROUP BY client_id
),
execution_stats AS (
    SELECT 
        e.client_id,
        e.workflow_id,
        COUNT(*) FILTER (WHERE e.status = 'success' AND e.started_at >= r.deployment_date) as successful_executions,
        COUNT(*) FILTER (WHERE e.started_at >= r.deployment_date) as total_executions,
        (CURRENT_DATE - r.deployment_date)::INTEGER as days_since_deployment
    FROM public.n8n_workflow_roi r
    LEFT JOIN public.n8n_executions e ON r.workflow_id = e.workflow_id AND r.client_id = e.client_id
    WHERE r.deployment_date IS NOT NULL  -- Only include workflows with deployment_date
    GROUP BY e.client_id, e.workflow_id, r.deployment_date
)
SELECT 
    r.id,
    r.client_id,
    r.workflow_id,
    w.workflow_name,
    r.roi_type,
    r.currency_code,
    r.deployment_date,
    r.implementation_cost,
    r.implementation_date,
    es.days_since_deployment,
    es.successful_executions,
    es.total_executions,
    
    -- Calculate time saved and value based on ROI type
    CASE r.roi_type
        WHEN 'per_execution' THEN
            es.successful_executions * COALESCE(r.manual_minutes_saved, 0)
        WHEN 'recurring_task' THEN
            CASE r.frequency
                WHEN 'daily' THEN
                    es.days_since_deployment * r.occurrences_per_frequency * COALESCE(r.manual_minutes_saved, 0)
                WHEN 'weekly' THEN
                    (es.days_since_deployment / 7.0) * r.occurrences_per_frequency * COALESCE(r.manual_minutes_saved, 0)
                WHEN 'monthly' THEN
                    FLOOR(es.days_since_deployment / 30.44) * r.occurrences_per_frequency * COALESCE(r.manual_minutes_saved, 0)
                WHEN 'quarterly' THEN
                    FLOOR(es.days_since_deployment / 91.25) * r.occurrences_per_frequency * COALESCE(r.manual_minutes_saved, 0)
                ELSE 0
            END
        ELSE NULL
    END as minutes_saved,
    
    -- Calculate labor cost saved (for per_execution and recurring_task)
    CASE 
        WHEN r.roi_type IN ('per_execution', 'recurring_task') THEN
            (CASE r.roi_type
                WHEN 'per_execution' THEN
                    es.successful_executions * COALESCE(r.manual_minutes_saved, 0)
                WHEN 'recurring_task' THEN
                    CASE r.frequency
                        WHEN 'daily' THEN
                            es.days_since_deployment * r.occurrences_per_frequency * COALESCE(r.manual_minutes_saved, 0)
                        WHEN 'weekly' THEN
                            (es.days_since_deployment / 7.0) * r.occurrences_per_frequency * COALESCE(r.manual_minutes_saved, 0)
                        WHEN 'monthly' THEN
                            FLOOR(es.days_since_deployment / 30.44) * r.occurrences_per_frequency * COALESCE(r.manual_minutes_saved, 0)
                        WHEN 'quarterly' THEN
                            FLOOR(es.days_since_deployment / 91.25) * r.occurrences_per_frequency * COALESCE(r.manual_minutes_saved, 0)
                        ELSE 0
                    END
                ELSE 0
            END / 60.0) * COALESCE(r.hourly_rate, 0)
        ELSE NULL
    END as labor_cost_saved,
    
    -- Calculate value created (for new_capability)
    CASE r.roi_type
        WHEN 'new_capability' THEN
            CASE 
                -- Frequency-based calculation (new): value per time period
                WHEN r.frequency IS NOT NULL AND r.value_per_frequency IS NOT NULL THEN
                    CASE r.frequency
                        WHEN 'daily' THEN
                            es.days_since_deployment * COALESCE(r.value_per_frequency, 0)
                        WHEN 'weekly' THEN
                            (es.days_since_deployment / 7.0) * COALESCE(r.value_per_frequency, 0)
                        WHEN 'monthly' THEN
                            (es.days_since_deployment / 30.44) * COALESCE(r.value_per_frequency, 0)
                        WHEN 'quarterly' THEN
                            (es.days_since_deployment / 91.25) * COALESCE(r.value_per_frequency, 0)
                        ELSE 0
                    END
                -- Execution-based calculation (backward compatibility)
                WHEN r.clients_per_report IS NOT NULL AND r.reactivation_rate_percent IS NOT NULL AND r.value_per_client IS NOT NULL THEN
                    -- Aggregate/report pattern
                    es.successful_executions * r.clients_per_report * (r.reactivation_rate_percent / 100.0) * r.value_per_client
                WHEN r.value_per_execution IS NOT NULL THEN
                    -- Simple value per execution
                    es.successful_executions * r.value_per_execution
                ELSE 0
            END
        ELSE NULL
    END as value_created,
    
    -- Workflow-specific implementation cost (one-time, if implementation_date is set and passed)
    CASE 
        WHEN r.implementation_date IS NOT NULL AND r.implementation_date <= CURRENT_DATE THEN
            COALESCE(r.implementation_cost, 0)
        ELSE 0
    END as workflow_implementation_cost,
    
    -- Allocated portion of client initial setup fee (divided by total workflows)
    CASE 
        WHEN c.initial_setup_fee IS NOT NULL AND c.initial_setup_fee > 0 AND tw.total_workflows > 0 THEN
            c.initial_setup_fee / tw.total_workflows
        ELSE 0
    END as allocated_setup_fee,
    
    -- Total implementation cost (workflow-specific + allocated setup fee)
    (CASE 
        WHEN r.implementation_date IS NOT NULL AND r.implementation_date <= CURRENT_DATE THEN
            COALESCE(r.implementation_cost, 0)
        ELSE 0
    END) + 
    (CASE 
        WHEN c.initial_setup_fee IS NOT NULL AND c.initial_setup_fee > 0 AND tw.total_workflows > 0 THEN
            c.initial_setup_fee / tw.total_workflows
        ELSE 0
    END) as implementation_cost_applied,
    
    r.value_description,
    r.notes
    
FROM public.n8n_workflow_roi r
LEFT JOIN public.n8n_workflows w ON r.workflow_id = w.workflow_id AND r.client_id = w.client_id
LEFT JOIN public.n8n_clients c ON r.client_id = c.id
LEFT JOIN total_workflows tw ON r.client_id = tw.client_id
LEFT JOIN workflow_counts wc ON r.client_id = wc.client_id
LEFT JOIN execution_stats es ON r.workflow_id = es.workflow_id AND r.client_id = es.client_id
WHERE r.deployment_date IS NOT NULL;  -- Only include workflows with deployment_date

-- 5. Create view: vw_client_roi_summary
-- This view aggregates ROI across all workflows per client
CREATE OR REPLACE VIEW public.vw_client_roi_summary AS
WITH workflow_roi AS (
    SELECT 
        client_id,
        currency_code,
        SUM(COALESCE(minutes_saved, 0)) as total_minutes_saved,
        SUM(COALESCE(labor_cost_saved, 0)) as total_labor_cost_saved,
        SUM(COALESCE(value_created, 0)) as total_value_created,
        SUM(COALESCE(implementation_cost_applied, 0)) as total_implementation_costs,
        COUNT(*) as workflows_with_roi
    FROM public.vw_workflow_roi_calculated
    GROUP BY client_id, currency_code
),
tool_costs_calculated AS (
    SELECT 
        c.id as client_id,
        SUM(
            CASE 
                -- Exclude one-time fees (tools with end_date) - they should be handled separately
                WHEN tool->>'end_date' IS NOT NULL THEN
                    0
                -- Handle NULL or missing start_date, or future dates
                WHEN tool->>'start_date' IS NULL OR (tool->>'start_date')::DATE > CURRENT_DATE THEN
                    0
                WHEN tool->>'period' = 'monthly' THEN
                    (tool->>'cost')::DECIMAL * 
                    GREATEST(0, EXTRACT(YEAR FROM AGE(CURRENT_DATE, (tool->>'start_date')::DATE))::INTEGER * 12 + EXTRACT(MONTH FROM AGE(CURRENT_DATE, (tool->>'start_date')::DATE))::INTEGER)
                WHEN tool->>'period' = 'quarterly' THEN
                    (tool->>'cost')::DECIMAL * 
                    GREATEST(0, FLOOR((EXTRACT(YEAR FROM AGE(CURRENT_DATE, (tool->>'start_date')::DATE))::INTEGER * 12 + EXTRACT(MONTH FROM AGE(CURRENT_DATE, (tool->>'start_date')::DATE))::INTEGER) / 3.0))
                WHEN tool->>'period' = 'yearly' THEN
                    (tool->>'cost')::DECIMAL * 
                    GREATEST(0, EXTRACT(YEAR FROM AGE(CURRENT_DATE, (tool->>'start_date')::DATE))::INTEGER)
                WHEN tool->>'period' = '24months' THEN
                    (tool->>'cost')::DECIMAL * 
                    GREATEST(0, FLOOR((EXTRACT(YEAR FROM AGE(CURRENT_DATE, (tool->>'start_date')::DATE))::INTEGER * 12 + EXTRACT(MONTH FROM AGE(CURRENT_DATE, (tool->>'start_date')::DATE))::INTEGER) / 24.0))
                ELSE 0
            END
        ) as total_tool_costs
    FROM public.n8n_clients c
    CROSS JOIN LATERAL jsonb_array_elements(COALESCE(c.tool_costs, '[]'::jsonb)) as tool
    GROUP BY c.id
)
SELECT 
    c.id as client_id,
    c.client_name,
    c.client_code,
    COALESCE(wr.total_minutes_saved, 0) as total_minutes_saved,
    ROUND(COALESCE(wr.total_minutes_saved, 0) / 60.0, 1) as total_hours_saved,
    COALESCE(wr.total_labor_cost_saved, 0) as total_labor_cost_saved,
    COALESCE(wr.total_value_created, 0) as total_value_created,
    COALESCE(wr.total_implementation_costs, 0) as total_implementation_costs,
    COALESCE(tc.total_tool_costs, 0) as total_tool_costs,
    COALESCE(wr.total_implementation_costs, 0) + COALESCE(tc.total_tool_costs, 0) as total_automation_cost,
    -- Net ROI = (Labor Cost Saved + Value Created) - Total Automation Cost
    (COALESCE(wr.total_labor_cost_saved, 0) + COALESCE(wr.total_value_created, 0)) - 
    (COALESCE(wr.total_implementation_costs, 0) + COALESCE(tc.total_tool_costs, 0)) as net_roi,
    COALESCE(wr.currency_code, 'GBP') as currency_code,
    COALESCE(wr.workflows_with_roi, 0) as workflows_with_roi
FROM public.n8n_clients c
LEFT JOIN workflow_roi wr ON c.id = wr.client_id
LEFT JOIN tool_costs_calculated tc ON c.id = tc.client_id;

-- Enable RLS on new table
ALTER TABLE public.n8n_workflow_roi ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all" ON public.n8n_workflow_roi FOR ALL USING (true);

