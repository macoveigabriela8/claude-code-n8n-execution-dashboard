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
  
  // ========== NEW: Extract DETAILED error message ==========
  let details = null;
  
  if (exec._status === 'error') {
    // Extract comprehensive error details from n8n execution
    const errorParts = [];
    
    // 1. Check main error object
    if (exec.data && exec.data.resultData && exec.data.resultData.error) {
      const error = exec.data.resultData.error;
      if (error.message) errorParts.push(error.message);
      if (error.description) errorParts.push(error.description);
      if (error.cause && error.cause.message) errorParts.push(`Cause: ${error.cause.message}`);
    }
    
    // 2. Check last node that executed
    if (exec.lastNodeExecuted) {
      errorParts.push(`Failed at: ${exec.lastNodeExecuted}`);
    }
    
    // 3. Check for node-specific errors in runData
    if (exec.data && exec.data.resultData && exec.data.resultData.runData) {
      const runData = exec.data.resultData.runData;
      for (const nodeName in runData) {
        const nodeData = runData[nodeName];
        if (nodeData && nodeData[0] && nodeData[0].error) {
          const nodeError = nodeData[0].error;
          errorParts.push(`${nodeName}: ${nodeError.message || nodeError.description || 'Error'}`);
        }
      }
    }
    
    // 4. Combine all error info or use fallback
    details = errorParts.length > 0 
      ? errorParts.join(' | ') 
      : 'Execution failed - no error details available';
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
