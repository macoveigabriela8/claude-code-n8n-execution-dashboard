# Tool Costs Migration: JSONB to Table

This migration moves tool costs from JSONB storage in `n8n_clients.tool_costs` to a proper table structure `n8n_tool_costs`.

## Migration Steps

Run these SQL scripts in Supabase SQL Editor **in order**:

### Step 1: Create the Table
Run: `sql/create_tool_costs_table.sql`

This creates the `n8n_tool_costs` table with proper schema, indexes, and constraints.

### Step 2: Migrate Existing Data
Run: `sql/migrate_tool_costs_jsonb_to_table.sql`

This migrates all existing tool costs from the JSONB column to the new table.

**Note:** The migration uses `ON CONFLICT DO UPDATE`, so it's safe to run multiple times if needed.

### Step 3: Update Views
Run: `sql/update_views_use_tool_costs_table.sql`

This updates `vw_client_roi_summary` to use the new table instead of JSONB extraction.

## Verification

After running the migration, verify:

1. **Data migrated correctly:**
   ```sql
   SELECT COUNT(*) FROM n8n_tool_costs;
   -- Should match the number of tools you have
   ```

2. **View works correctly:**
   ```sql
   SELECT * FROM vw_client_roi_summary 
   WHERE client_id = 'your-client-id';
   -- Check that total_tool_costs is calculated correctly
   ```

3. **Application works:**
   - Go to admin page and check tool costs display correctly
   - Try editing and saving tool costs
   - Check dashboard shows correct tool costs

## Rollback (if needed)

If you need to rollback:

1. The old JSONB column `n8n_clients.tool_costs` is still there (we don't delete it)
2. You can restore the old view definition from `sql/roi_schema.sql`
3. Revert the code changes in `lib/supabase.ts`

## After Migration

Once verified, you can optionally:
- Keep the JSONB column for backup (recommended for a while)
- Or drop it after confirming everything works: `ALTER TABLE n8n_clients DROP COLUMN tool_costs;`

