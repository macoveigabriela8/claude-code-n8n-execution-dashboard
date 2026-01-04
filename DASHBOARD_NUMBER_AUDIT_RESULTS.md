# Dashboard Number Audit Results

## Summary

Based on the SQL verification queries, here are the issues found:

---

## ✅ CONFIRMED ISSUE #1: Automation Cost Mismatch

**Status**: CONFIRMED ✅

**Evidence from SQL Query**:
- `vw_client_roi_summary.total_automation_cost` = **£0.00**
- `vw_client_roi_summary.total_tool_costs` = **£0.00**
- `vw_client_roi_summary.total_implementation_costs` = **£0**

**But in Frontend (KPICards.tsx)**:
- Automation Cost shows: **6.4K** (calculated client-side)

**Root Cause**:
- The `vw_client_roi_summary` view uses the OLD JSONB `tool_costs` column from `n8n_clients` table
- The JSONB column is empty/outdated
- The frontend `KPICards.tsx` correctly uses the NEW `n8n_tool_costs` table (via `getClientTools`)
- The frontend `KPICardsBreakdown.tsx` incorrectly uses `summaryData.total_automation_cost` from the outdated view

**Impact**:
- ROI Breakdown formula shows: `= (£221 + £23) - £0` instead of `= (£221 + £23) - £6,400`
- Net ROI calculation in breakdown is incorrect
- Automation cost shows 6.4K in cards but £0 in breakdown formula

**Solution Required**:
1. Update `vw_client_roi_summary` to use `n8n_tool_costs` table OR sum `allocated_tool_cost` from `vw_workflow_roi_calculated`
2. OR make `KPICardsBreakdown` calculate automation cost the same way as `KPICards` (client-side from `n8n_tool_costs`)

---

## ⚠️ POTENTIAL ISSUE #2: Implementation Costs Showing Zero

**Status**: NEEDS VERIFICATION ⚠️

**Evidence**:
- `summary_impl_cost` = **0**
- `workflow_impl_cost` = **0**

**Action Required**:
- Run the workflow ROI breakdown query (section 3) to check if individual workflows have implementation costs
- Verify if implementation costs are correctly set in `n8n_workflow_roi.implementation_cost` and `implementation_date`

---

## 📋 NEXT STEPS

1. **Run all sections of the verification script** to get complete data:
   - Section 1: KPI Cards Data
   - Section 2: Tool Costs Verification (NEW table vs OLD JSONB)
   - Section 3: Workflow ROI Breakdown Data
   - Section 4: Sum of Workflow ROI
   - Section 5: Comparison Summary vs Sum of Workflows

2. **Compare the results**:
   - Check if tool costs exist in NEW `n8n_tool_costs` table
   - Check if tool costs exist in OLD JSONB column
   - Verify which source has the correct data

3. **Fix the view**:
   - Update `vw_client_roi_summary` to use the correct tool cost source
   - Ensure it matches the frontend calculation

---

## 🔍 QUESTIONS TO ANSWER

1. Does the `n8n_tool_costs` table have data for this client?
2. Does the OLD JSONB `tool_costs` column in `n8n_clients` have data?
3. Which source should be the source of truth?
4. Are implementation costs correctly stored in the database?

---

## 📊 VERIFICATION QUERIES TO RUN

Please run each section of `sql/verify_all_dashboard_numbers.sql` separately and share the results:

1. **Section 1**: KPI Cards Data (from `vw_client_roi_summary`)
2. **Section 2**: Tool Costs Verification (compare NEW table vs OLD JSONB)
3. **Section 3**: Workflow ROI Breakdown (individual workflows)
4. **Section 4**: Sum of Workflow ROI (should match summary)
5. **Section 5**: Comparison Summary vs Sum of Workflows
6. **Section 6**: Automation Cost Breakdown (already run - shows 0)

