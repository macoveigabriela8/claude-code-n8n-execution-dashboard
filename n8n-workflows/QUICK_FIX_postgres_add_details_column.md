# Quick Fix: Add Details Column to Postgres Upsert

## Step 1: Update "Filter and Transform" Node
Copy the code from `QUICK_FIX_add_error_details.js` into your "Filter and Transform" node.

## Step 2: Update "Upsert to Postgres" Node

In your **"Upsert to Postgres"** node:

### Add to Columns Mapping:

```
details: ={{ $json.details }}
```

### Steps in n8n UI:

1. Click **"Upsert to Postgres"** node
2. Under **"Columns"** section, click **"Add Column"**
3. Set:
   - **Column**: `details`
   - **Value**: `={{ $json.details }}`
4. Save

## What This Does:

- **For Error executions**: Extracts error message from n8n execution data → Saves to `details` column
- **For Success executions**: Details field is null (you'll add via your existing Postgres nodes in each workflow)

## Error Message Sources (in priority order):

1. `exec.data.resultData.error.message` - Main error message
2. `exec.data.resultData.error.description` - Error description
3. `exec.lastNodeExecuted` - Shows which node failed
4. Fallback: "Execution failed"

## Test:

1. Save and execute the workflow
2. Check your database: Error executions should now have error messages in `details` column
3. Refresh your dashboard → Details column will show error messages for failed flows!

---

**Time to implement: 2 minutes** ⏱️
