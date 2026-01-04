# Complete Dashboard Number Audit Report

## Executive Summary

**Status**: ✅ **3 Critical Issues Found**

All numbers should come from the database views, but there are inconsistencies between what's in the database and what's displayed.

---

## ✅ VERIFIED: Workflow ROI Values Match

**Section 5 Comparison Results**:
- ✅ Labor Cost Saved: **MATCH** (Summary: £220.82 = Sum of Workflows: £220.82)
- ✅ Value Created: **MATCH** (Summary: £22.99 = Sum of Workflows: £22.99)
- ✅ Implementation Costs: **MATCH** (Summary: £0 = Sum of Workflows: £0)

**Conclusion**: The workflow ROI calculations are correct and consistent.

---

## 🔴 CRITICAL ISSUE #1: Tool Costs Not in Database View

**Problem**:
- **NEW `n8n_tool_costs` table** (source of truth): Has data ✅
  - 2 tools
  - One-time fees: £1,500.00
  - Recurring tools: £76.71
  - **Total: £1,576.71**

- **OLD JSONB column** (used by view): Shows £0 ❌
  - 2 tools but costs = £0

- **Database View (`vw_client_roi_summary`)**: Shows £0 ❌
  - `total_tool_costs` = £0.00
  - View is using OLD JSONB column instead of NEW table

**Impact**:
- View shows wrong tool costs
- Automation cost calculation is wrong

**Root Cause**:
The `vw_client_roi_summary` view uses the OLD JSONB `tool_costs` column from `n8n_clients` table instead of the NEW `n8n_tool_costs` table.

---

## 🔴 CRITICAL ISSUE #2: Automation Cost = £0 (Should be £1,576.71)

**Problem**:
- **Database View**: `total_automation_cost` = £0.00 ❌
- **Should be**: Implementation Costs (£0) + Tool Costs (£1,576.71) = **£1,576.71**

**Impact**:
- ROI Breakdown formula shows: `= (£221 + £23) - £0` (WRONG)
- Should show: `= (£221 + £23) - £1,576.71`

**Root Cause**:
- View calculates: `total_implementation_costs + total_tool_costs`
- Since `total_tool_costs` = £0 (Issue #1), automation cost = £0

---

## 🔴 CRITICAL ISSUE #3: Net ROI Calculation is Wrong

**Problem**:
- **Database View**: `net_roi` = £243.81 ❌
- **Current calculation**: (220.82 + 22.99) - 0 = 243.81
- **Should be**: (220.82 + 22.99) - 1,576.71 = **-£1,332.90** (negative ROI)

**Impact**:
- ROI card shows positive ROI when it should be negative
- Formula is incorrect

**Root Cause**:
- View formula: `(labor_cost_saved + value_created) - total_automation_cost`
- Since `total_automation_cost` = £0 (Issue #2), net ROI is calculated incorrectly

---

## ⚠️ DISCREPANCY: Frontend Shows 6.4K but Database Has £1,576.71

**Observation**:
- Frontend KPI Cards show: **6.4K** automation cost
- Database NEW table shows: **£1,576.71** total tool costs

**Possible Explanations**:
1. Frontend is calculating tool costs differently (months since deployment, allocation per workflow)
2. Frontend includes implementation costs that are stored elsewhere
3. Currency conversion or formatting difference
4. Frontend calculation includes additional costs not in the tool_costs table

**Action Required**:
- Investigate how frontend calculates 6.4K
- Compare frontend calculation logic with database view logic
- Ensure they match

---

## 📋 Summary of All Numbers

### From Database View (`vw_client_roi_summary`):
- Labor Cost Saved: **£220.82** ✅ (matches UI)
- Value Created: **£22.99** ✅ (matches UI)
- Implementation Costs: **£0** ✅ (matches sum of workflows)
- Tool Costs: **£0.00** ❌ (should be £1,576.71)
- Automation Cost: **£0.00** ❌ (should be £1,576.71)
- Net ROI: **£243.81** ❌ (should be -£1,332.90)
- Hours Saved: **2.4** ✅
- Workflows with ROI: **6** ✅

### From NEW Tool Costs Table (`n8n_tool_costs`):
- Tool Count: **2**
- One-time Fees: **£1,500.00**
- Recurring Tools: **£76.71**
- **Total Tool Costs: £1,576.71**

---

## ✅ RECOMMENDED FIXES

### Fix #1: Update `vw_client_roi_summary` View

The view needs to use the NEW `n8n_tool_costs` table instead of the OLD JSONB column.

**Options**:
1. **Option A**: Use `n8n_tool_costs` table directly in the view (calculate tool costs in the view)
2. **Option B**: Use `allocated_tool_cost` from `vw_workflow_roi_calculated` if that column exists (sum per workflow)

**Recommended**: Check if `vw_workflow_roi_calculated` has `allocated_tool_cost` column. If yes, use Option B (sum from workflows). If no, use Option A (calculate in summary view).

### Fix #2: Update Frontend to Use Database Values

1. **KPICards.tsx**: Remove client-side automation cost calculation (lines 182-189)
2. Use `data.total_automation_cost` from the view instead
3. Use `data.net_roi` from the view instead of calculating

### Fix #3: Verify Tool Cost Calculation Logic

- Check if frontend calculation (6.4K) matches database calculation (£1,576.71)
- Ensure tool costs are allocated correctly (per workflow, per month, etc.)
- Verify if implementation costs should be included in automation cost

---

## 🎯 PRIORITY ACTIONS

1. **HIGH**: Fix `vw_client_roi_summary` view to use NEW `n8n_tool_costs` table
2. **HIGH**: Update frontend to use database view values (no client-side calculations)
3. **MEDIUM**: Investigate discrepancy between 6.4K (frontend) and £1,576.71 (database)
4. **MEDIUM**: Verify tool cost allocation logic matches between frontend and database

---

## ✅ VERIFIED CORRECT

- ✅ Labor Cost Saved calculation and display
- ✅ Value Created calculation and display
- ✅ Implementation Costs (currently £0, but calculation is correct)
- ✅ Workflow ROI sums match summary view
- ✅ Hours Saved calculation
- ✅ Workflows count

