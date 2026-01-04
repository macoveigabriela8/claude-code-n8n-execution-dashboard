# Dashboard Number Audit Report

## Summary of Issues Found

### CRITICAL ISSUE #1: Automation Cost Mismatch

**Location**: 
- KPI Cards (`components/KPICards.tsx` line 374)
- ROI Breakdown Formula (`components/KPICardsBreakdown.tsx` line 471)

**Problem**:
- **KPI Cards** calculate `totalAutomationCost` client-side using:
  - Workflow implementation costs from `vw_workflow_roi_calculated`
  - Tool costs from NEW `n8n_tool_costs` table (via `getClientTools`)
  - This shows correctly (e.g., 6.4K)

- **ROI Breakdown Formula** uses `summaryData.total_automation_cost` from:
  - `vw_client_roi_summary` view
  - This view uses the OLD JSONB `tool_costs` column from `n8n_clients` table
  - This shows £0 (because the JSONB column is empty or outdated)

**Root Cause**:
The `vw_client_roi_summary` view (`sql/recreate_client_summary_view.sql` line 46) still uses:
```sql
CROSS JOIN LATERAL jsonb_array_elements(COALESCE(c.tool_costs, '[]'::jsonb)) as tool
```

But the frontend has migrated to using the new `n8n_tool_costs` table.

**Impact**: 
- Automation cost shows 6.4K in cards but £0 in ROI breakdown formula
- Net ROI calculation in breakdown is incorrect
- Formula shows: `= (£221 + £23) - £0` instead of `= (£221 + £23) - £6,400`

**Solution Required**:
1. Update `vw_client_roi_summary` to use `n8n_tool_costs` table instead of JSONB column
2. OR make `KPICardsBreakdown` calculate automation cost the same way as `KPICards` (client-side)
3. Ensure both use the same data source for consistency

---

## Numbers to Verify (Run SQL Script)

Run `sql/verify_all_dashboard_numbers.sql` to check:

1. **KPI Cards Values** (from `vw_client_roi_summary`):
   - `total_labor_cost_saved`
   - `total_value_created`
   - `total_implementation_costs`
   - `total_tool_costs` ← **ISSUE: Uses OLD JSONB column**
   - `total_automation_cost` ← **ISSUE: Calculated from OLD tool_costs**
   - `net_roi` ← **ISSUE: Calculated from OLD tool_costs**
   - `total_hours_saved`
   - `workflows_with_roi`

2. **ROI Breakdown Values**:
   - Individual workflow values from `vw_workflow_roi_calculated`
   - Sum of workflows should match summary view

3. **Tool Costs**:
   - Compare NEW table (`n8n_tool_costs`) vs OLD JSONB column
   - Verify which one has the correct/current data

4. **Consistency Checks**:
   - Summary values vs sum of individual workflows
   - Automation cost breakdown: implementation + tools
   - Net ROI calculation consistency

---

## Other Components to Verify

### Execution Success Rate
- Source: Views that calculate success rates
- Verify: Success rate percentages match execution counts

### Execution Trend Chart
- Source: `vw_recent_executions` or similar
- Verify: Counts match execution table data

### Execution History Table
- Source: `vw_recent_executions`
- Verify: Execution counts, durations, statuses are correct

---

## Recommended Actions

1. **IMMEDIATE**: Fix automation cost mismatch
   - Update `vw_client_roi_summary` to use `n8n_tool_costs` table
   - OR standardize on client-side calculation in both components

2. **VERIFY**: Run the SQL verification script with your client_id
   - Replace `'03acd728-2a3a-47ce-8e14-2d9d112b348e'` with your actual client_id
   - Review all comparison results
   - Identify any other mismatches

3. **TEST**: After fixing, verify:
   - Automation cost matches in cards and breakdown
   - Net ROI matches in cards and breakdown formula
   - All numbers are consistent across dashboard

