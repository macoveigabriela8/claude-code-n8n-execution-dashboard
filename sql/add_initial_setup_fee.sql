-- Migration: Add initial setup fee to clients table and update views
-- This fee is divided across all workflows for the client

-- 1. Add initial_setup_fee column to n8n_clients table
ALTER TABLE public.n8n_clients 
ADD COLUMN IF NOT EXISTS initial_setup_fee DECIMAL(10,2) DEFAULT 0;

-- 2. Update vw_workflow_roi_calculated view to include allocated setup fee
-- Note: This view update is already included in roi_schema.sql
-- Run the updated view creation from roi_schema.sql after adding the column
