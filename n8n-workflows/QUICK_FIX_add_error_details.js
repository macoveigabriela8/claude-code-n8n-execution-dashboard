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
  
  // ========== NEW: Extract FULL ERROR DETAILS with Stack Trace ==========
  let details = null;
  
  if (exec._status === 'error') {
    // Build comprehensive error details object
    const errorInfo = {
      message: null,
      stack: null,
      node: null,
      code: null,
      type: null,
      fullError: null
    };
    
    // 1. Get main error with stack trace
    if (exec.data && exec.data.resultData && exec.data.resultData.error) {
      const error = exec.data.resultData.error;
      errorInfo.message = error.message || error.description;
      errorInfo.stack = error.stack; // FULL STACK TRACE
      errorInfo.code = error.code;
      errorInfo.type = error.name || error.type;
      errorInfo.fullError = JSON.stringify(error, null, 2); // Full error object
    }
    
    // 2. Get failed node name
    if (exec.lastNodeExecuted) {
      errorInfo.node = exec.lastNodeExecuted;
    }
    
    // 3. Get node-specific error details
    let nodeErrors = [];
    if (exec.data && exec.data.resultData && exec.data.resultData.runData) {
      const runData = exec.data.resultData.runData;
      for (const nodeName in runData) {
        const nodeData = runData[nodeName];
        if (nodeData && nodeData[0] && nodeData[0].error) {
          const nodeError = nodeData[0].error;
          nodeErrors.push({
            node: nodeName,
            message: nodeError.message,
            stack: nodeError.stack
          });
        }
      }
    }
    
    // 4. Combine into detailed string
    const parts = [];
    if (errorInfo.message) parts.push(`ERROR: ${errorInfo.message}`);
    if (errorInfo.node) parts.push(`NODE: ${errorInfo.node}`);
    if (errorInfo.code) parts.push(`CODE: ${errorInfo.code}`);
    if (errorInfo.type) parts.push(`TYPE: ${errorInfo.type}`);
    if (errorInfo.stack) parts.push(`STACK: ${errorInfo.stack}`);
    
    // Add node-specific errors
    if (nodeErrors.length > 0) {
      nodeErrors.forEach(ne => {
        parts.push(`${ne.node}: ${ne.message}`);
        if (ne.stack) parts.push(`STACK: ${ne.stack}`);
      });
    }
    
    details = parts.length > 0 
      ? parts.join(' || ')
      : (errorInfo.fullError || 'Execution failed - no error details available');
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
