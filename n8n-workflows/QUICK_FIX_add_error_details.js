// QUICK FIX: Add this to your "Filter and Transform" node
// Replace the existing code with this updated version

// Get config from earlier node
const clientId = $('Set Client ID1').first().json.clientId;
const workflowIds = $('Prepare Workflow List').first().json.workflowIds;

// Get all merged executions
const allExecs = $input.all();

// Filter and transform
const results = [];

for (const item of allExecs) {
  const exec = item.json;
  
  // Only include executions for our tracked workflows
  if (!workflowIds.includes(exec.workflowId)) {
    continue;
  }
  
  // Calculate duration
  let durationMs = null;
  if (exec.startedAt && exec.stoppedAt) {
    durationMs = Math.round(new Date(exec.stoppedAt) - new Date(exec.startedAt));
  }
  
  // ========== NEW: Extract error message or details ==========
  let details = null;
  
  if (exec._status === 'error') {
    // For errors, extract error message from execution data
    if (exec.data && exec.data.resultData && exec.data.resultData.error) {
      const error = exec.data.resultData.error;
      details = error.message || error.description || 'Error occurred';
    } else if (exec.lastNodeExecuted) {
      details = `Error in node: ${exec.lastNodeExecuted}`;
    } else {
      details = 'Execution failed';
    }
  }
  // For success, you'll add details from your existing Postgres nodes in each workflow
  // ========================================================
  
  results.push({
    json: {
      client_id: clientId,
      workflow_id: exec.workflowId,
      execution_id: String(exec.id),
      finished: exec.finished || false,
      mode: exec.mode || null,
      started_at: exec.startedAt || null,
      stopped_at: exec.stoppedAt || null,
      duration_ms: durationMs,
      status: exec._status,
      details: details  // ← NEW: Add details field
    }
  });
}

if (results.length === 0) {
  return [{ json: { _skip: true, message: 'No executions for tracked workflows' } }];
}

return results;
