# ROI Dashboard System - Implementation Complete

## Summary

The ROI Dashboard System has been successfully implemented according to the plan. All phases are complete:

✅ **Phase 1: Database Foundation**
- Created `n8n_workflow_roi` table schema
- Added `tool_costs` column to `n8n_clients` table
- Created ROI calculation views (`vw_workflow_roi_calculated`, `vw_client_roi_summary`)

✅ **Phase 2: TypeScript Types**
- Added ROI type definitions to `types/supabase.ts`

✅ **Phase 3: ROI Dashboard Components**
- Created `ROISummary.tsx` component
- Created `WorkflowROIBreakdown.tsx` component
- Restructured dashboard to prioritize ROI metrics
- Made technical details collapsible

✅ **Phase 4: Admin UI**
- Created admin page (`/admin`)
- Created `ROIWorkflowList.tsx` component
- Created `ROIWorkflowForm.tsx` component
- Created `ROIConfigEditor.tsx` component

✅ **Phase 5: Utility Functions**
- Added currency formatting functions
- Added hours formatting functions
- Added ROI calculation helper functions

## Next Steps

### 1. Install Dependencies

Run the following command to install the new dependencies:

```bash
npm install
```

New dependencies added:
- `@radix-ui/react-collapsible`
- `@radix-ui/react-label`

### 2. Run Database Migration

Execute the SQL schema file in your Supabase SQL Editor:

1. Go to your Supabase dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `sql/roi_schema.sql`
4. Run the SQL

**Important Notes:**
- The schema assumes you have an `n8n_workflows` table with columns: `workflow_id`, `client_id`, `workflow_name`, `is_active`, `display_order`
- If your table structure differs, adjust the SQL accordingly
- The `getClientWorkflows` function in `lib/supabase.ts` queries `n8n_workflows` - adjust if needed

### 3. Configure Client Tool Costs

For each client, you need to set up tool costs in the `n8n_clients.tool_costs` JSONB column:

```sql
UPDATE n8n_clients 
SET tool_costs = '[
  {"tool": "n8n", "cost": 20.00, "period": "monthly", "start_date": "2024-01-01", "currency_code": "GBP"},
  {"tool": "supabase", "cost": 25.00, "period": "monthly", "start_date": "2024-01-01", "currency_code": "GBP"}
]'::jsonb
WHERE id = 'your-client-id';
```

### 4. Configure ROI for Workflows

1. Navigate to `/admin?clientId=your-client-id`
2. For each workflow, click "Configure ROI"
3. Fill in the appropriate fields based on the ROI type:
   - **Per Execution**: Minutes saved per run, hourly rate
   - **Recurring Task**: Frequency, occurrences, minutes saved, hourly rate
   - **New Capability**: Value per execution OR aggregate/report pattern

### 5. View Dashboard

Once ROI is configured:
1. Navigate to `/dashboard?clientId=your-client-id`
2. ROI metrics will appear at the top
3. Technical details (execution logs, workflow stats) are in a collapsible section

## File Structure

```
/
├── sql/
│   └── roi_schema.sql                    # Database schema migration
├── app/
│   ├── admin/
│   │   └── page.tsx                      # Admin UI page
│   └── dashboard/
│       └── page.tsx                      # Updated dashboard (ROI-first)
├── components/
│   ├── admin/
│   │   ├── ROIWorkflowList.tsx          # List workflows with ROI status
│   │   ├── ROIWorkflowForm.tsx          # Form to configure ROI
│   │   └── ROIConfigEditor.tsx          # Edit existing ROI config
│   ├── ROISummary.tsx                   # Hero ROI metrics
│   ├── WorkflowROIBreakdown.tsx         # Per-workflow ROI cards
│   └── ui/
│       ├── collapsible.tsx              # Collapsible component
│       ├── label.tsx                    # Label component
│       └── textarea.tsx                 # Textarea component
├── lib/
│   ├── supabase.ts                      # Added ROI query functions
│   └── utils.ts                         # Added ROI utility functions
└── types/
    └── supabase.ts                      # Added ROI type definitions
```

## Key Features

### Dashboard (Client View)
- **ROI Summary**: Prominent display of hours saved, net ROI, value created
- **Workflow ROI Breakdown**: Individual workflow value metrics
- **Technical Details**: Collapsible section with execution logs and stats (collapsed by default)

### Admin UI
- **Workflow List**: Shows which workflows have ROI configured
- **Configuration Form**: Step-by-step form for each ROI type
- **Edit/Delete**: Manage existing ROI configurations

### ROI Calculation Types

1. **Per Execution**: Each successful workflow run saves time/money
   - Example: Letter generation saves 15 minutes per letter

2. **Recurring Task**: Replaces a manual task done at regular intervals
   - Supports: daily, weekly, monthly, quarterly frequencies
   - Example: Daily morning check replaced by automated workflow

3. **New Capability**: Value created from new processes
   - Supports simple value per execution
   - Supports aggregate/report patterns (e.g., client reactivation reports)

### Cost Structure

- **Implementation Cost**: Per-workflow, one-time cost
- **Tool Costs**: Client-level, shared across all workflows (n8n, supabase subscriptions)

## Testing Checklist

- [ ] Run database migration successfully
- [ ] Configure tool costs for a client
- [ ] Configure ROI for at least one workflow of each type
- [ ] View dashboard and verify ROI metrics display correctly
- [ ] Test collapsible technical details section
- [ ] Test admin UI: create, edit, delete ROI configs
- [ ] Verify calculations match expected values

## Troubleshooting

### Database Errors
- Check that `n8n_workflows` table exists and has required columns
- Verify foreign key constraints are correct
- Check RLS policies allow access to ROI tables

### Missing Data
- Ensure ROI configurations are saved with valid deployment dates
- Check that tool costs are properly formatted JSONB
- Verify execution data exists for workflows with ROI config

### UI Issues
- Ensure all dependencies are installed (`npm install`)
- Check browser console for errors
- Verify Supabase environment variables are set


