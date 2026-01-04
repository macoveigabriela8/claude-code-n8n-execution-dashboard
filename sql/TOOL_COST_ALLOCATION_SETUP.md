# Tool Cost Allocation Per Workflow - Setup Instructions

## Overview

This adds tool cost allocation per workflow to the database views. Each workflow will have an `allocated_tool_cost` column showing its share of tool costs, calculated from its `deployment_date`.

## SQL Scripts to Run (in order)

### 1. Add Tool Cost Allocation to Workflow View
Run: `sql/add_tool_cost_allocation_to_workflow_view.sql`

This updates `vw_workflow_roi_calculated` to include:
- New CTE: `tool_costs_allocated` - calculates allocated tool cost per workflow
- New column: `allocated_tool_cost` - shows each workflow's share of tool costs

**Allocation Logic:**
- Tool costs are allocated from each workflow's `deployment_date` (not tool start_date)
- Costs are divided by the number of workflows with deployment_date
- Supports monthly, quarterly, yearly, and 24months periods
- One-time fees (with end_date) are excluded

### 2. Update Client Summary to Sum Allocated Costs
Run: `sql/update_client_summary_sum_allocated_tool_costs.sql`

This updates `vw_client_roi_summary` to:
- Sum `allocated_tool_cost` from `vw_workflow_roi_calculated` instead of calculating directly
- Ensures client-level totals match the sum of per-workflow allocations

## How to View Allocated Costs

After running the scripts, you can query:

```sql
-- See allocated tool costs per workflow
SELECT 
    workflow_id,
    workflow_name,
    deployment_date,
    allocated_tool_cost,
    implementation_cost_applied,
    allocated_tool_cost + implementation_cost_applied as total_automation_cost_per_workflow
FROM vw_workflow_roi_calculated
WHERE client_id = 'your-client-id';

-- See total tool costs at client level (should match sum of allocated_tool_cost)
SELECT 
    client_id,
    total_tool_costs,
    workflows_with_roi
FROM vw_client_roi_summary
WHERE client_id = 'your-client-id';
```

## Notes

- **Allocation is simplified**: Currently uses the current workflow count for all months. A more complex time-weighted allocation (where costs are divided by the number of workflows active in each specific month) can be added later if needed.
- **No start_date needed**: Tool costs are allocated from workflow `deployment_date` only, not from tool `start_date`.
- **One-time fees excluded**: Tools with `end_date` are excluded from recurring cost allocation.

