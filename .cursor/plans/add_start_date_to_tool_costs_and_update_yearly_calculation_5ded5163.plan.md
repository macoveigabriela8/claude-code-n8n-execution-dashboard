# Add start_date to Tool Costs and Update Yearly Calculation

Add a `start_date` field to track when each tool subscription started, and update calculations to use this date for ALL recurring tools (yearly, monthly, quarterly, 24months). The admin UI should allow setting `start_date` for all tools.

## Changes Required

### 1. Database Migration: Add `start_date` to `n8n_tool_costs` table

**Create migration file: `sql/add_start_date_to_tool_costs.sql`**
```sql
-- Add start_date column to n8n_tool_costs table
ALTER TABLE public.n8n_tool_costs 
ADD COLUMN IF NOT EXISTS start_date DATE;

-- Add comment explaining the field
COMMENT ON COLUMN public.n8n_tool_costs.start_date IS 
'Date when the tool subscription started. Used for calculating recurring tool costs. If NULL, falls back to earliest workflow deployment date.';
```

### 2. Update SQL View Calculation (`sql/fix_client_summary_view_use_tool_costs_table.sql`)

**Current logic:** Uses `earliest_deployment_date` from workflows for all recurring tools.

**New logic:** 
- For ALL recurring tools (monthly, quarterly, yearly, 24months), use `COALESCE(tc.start_date, ed.earliest_deployment_date)` as the calculation base date
- For yearly tools: Use Option 2 - charge 1 full year only after 12 complete months: `FLOOR(months / 12) × yearly_cost`
- For monthly tools: Keep existing logic - charge per month since start: `months × monthly_cost`
- For quarterly tools: Keep existing logic - charge per quarter: `FLOOR(months / 3) × quarterly_cost`
- For 24months tools: Keep existing logic - charge per 24-month period: `FLOOR(months / 24) × cost`

**Changes needed in `tool_costs_calculated` CTE:**
1. Change base date calculation: Use `COALESCE(tc.start_date, ed.earliest_deployment_date)` instead of just `ed.earliest_deployment_date`
2. Calculate months since this base date for all periods
3. Update yearly calculation to: `FLOOR(months / 12) × tc.cost`

### 3. Update TypeScript Types (`types/supabase.ts`)

Add `start_date?: string | null` to `ClientToolCost` interface:
```typescript
export interface ClientToolCost {
  tool: string
  cost: number
  recurring?: boolean
  period?: 'monthly' | 'quarterly' | 'yearly' | '24months' | null
  start_date?: string | null  // NEW: Date when tool subscription started
  end_date?: string
  currency_code?: string
}
```

### 4. Update Frontend Breakdown Calculation (`components/KPICardsBreakdown.tsx`)

**Changes needed in `calculateToolCostSinceStart` function:**
1. For recurring tools, use `tool.start_date` if available, falling back to `earliestDeploymentDate`
2. Calculate `monthsSinceStart` based on the selected date
3. Update yearly calculation to: `cost × Math.floor(monthsSinceStart / 12)`
4. Keep monthly, quarterly, 24months calculations using the new `monthsSinceStart` value

### 5. Update ToolCostManager Component (`components/admin/ToolCostManager.tsx`)

**Add UI field for `start_date`:**
- Add a date input field for `start_date` when `recurring === true`
- Make it optional (can be NULL to fall back to workflow deployment date)
- Add label/help text explaining: "Optional: Date when this subscription started. If not set, uses earliest workflow deployment date."

## Files to Create/Modify

1. **New:** `sql/add_start_date_to_tool_costs.sql` - Database migration
2. **Modify:** `sql/fix_client_summary_view_use_tool_costs_table.sql` - Update calculation logic for all periods
3. **Modify:** `types/supabase.ts` - Add `start_date` to `ClientToolCost` interface
4. **Modify:** `components/KPICardsBreakdown.tsx` - Update calculation to use `start_date` for all periods
5. **Modify:** `components/admin/ToolCostManager.tsx` - Add `start_date` input field

## Calculation Logic Summary

**Base date:** `COALESCE(tool.start_date, earliest_workflow_deployment_date)`

**For yearly tools (e.g., Hosting £76.71/year):**
- Calculate months since base date
- Use `FLOOR(months / 12)` to get number of complete years
- Multiply by yearly cost: `cost × FLOOR(months / 12)`
- Example: 0-11 months = £0, 12-23 months = £76.71, 24-35 months = £153.42

**For monthly tools (e.g., Database, LLM Tokens):**
- Calculate months since base date (including partial month: +1)
- Multiply by monthly cost: `cost × months`

**For quarterly tools:**
- Calculate months since base date
- Use `FLOOR(months / 3)` to get number of complete quarters
- Multiply by quarterly cost: `cost × FLOOR(months / 3)`

**For 24months tools:**
- Calculate months since base date
- Use `FLOOR(months / 24)` to get number of complete 24-month periods
- Multiply by cost: `cost × FLOOR(months / 24)`

