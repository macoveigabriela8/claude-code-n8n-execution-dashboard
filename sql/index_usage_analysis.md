# Index Usage Analysis for n8n_executions

## Current Index Usage Statistics

### Highly Used Indexes ✅
1. **`n8n_executions_client_id_execution_id_key`** - 70,322 scans
   - Unique constraint, heavily used for lookups
   - **Keep** - Critical for data integrity

2. **`idx_exec_client_workflow`** - 8,741 scans (2.9M tuples read)
   - Composite: (client_id, workflow_id)
   - **Keep** - Very active, matches your query patterns

3. **`idx_exec_workflow`** - 1,049 scans
   - Single column: workflow_id
   - **Keep** - Moderately used

4. **`idx_exec_started`** - 953 scans
   - Single column: started_at
   - **Keep but optimize** - Used for date queries, but needs composite index

### Rarely/Unused Indexes ⚠️
1. **`idx_exec_status`** - Only 2 scans
   - Single column: status
   - **Consider dropping** - Rarely used, adds overhead

2. **`idx_exec_client`** - 0 scans ❌
   - Single column: client_id
   - **Candidate for removal** - Completely unused, redundant with unique constraint

## Missing Indexes for 5-Day Filter 🔴

**Critical Missing Index:**
- ❌ No composite index on `(client_id, started_at)`
- This is **essential** for your 5-day filter query pattern
- Single column indexes can't efficiently handle: `WHERE client_id = X AND started_at >= Y`

## Recommendations

### 1. Create Composite Indexes (High Priority)
Run `sql/create_execution_indexes.sql` to create:
- `idx_executions_client_started_at` - **MOST IMPORTANT** for 5-day filter
- `idx_executions_client_workflow_started_at` - For workflow-specific date queries
- `idx_executions_client_status_started_at` - If you filter by status + date

### 2. Consider Dropping Unused Indexes (After creating new ones)
```sql
-- Only after verifying new composite indexes work well
DROP INDEX IF EXISTS idx_exec_client;  -- 0 scans, redundant
-- Keep idx_exec_status for now, but monitor usage
```

### 3. Expected Impact
- **Before:** Query uses `idx_exec_client` (0 scans) + `idx_exec_started` separately = inefficient
- **After:** Query uses `idx_executions_client_started_at` = single efficient index scan
- **Performance:** Should reduce query time from potentially seconds to < 50ms

## Query Pattern Analysis

Your current queries are:
- ✅ Heavy use of `(client_id, execution_id)` - Unique constraint handles this
- ✅ Heavy use of `(client_id, workflow_id)` - `idx_exec_client_workflow` handles this
- ❌ **Missing:** `(client_id, started_at)` - This is what you need for date filtering!

The 5-day filter will benefit significantly from the composite index.

