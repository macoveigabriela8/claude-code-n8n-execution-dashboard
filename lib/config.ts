// Configuration for n8n execution dashboard

export const N8N_BASE_URL = process.env.NEXT_PUBLIC_N8N_BASE_URL || 'https://project-n8n.uxwbvn.easypanel.host'

export function getExecutionUrl(workflowId: string, executionId: string): string {
  return `${N8N_BASE_URL}/workflow/${workflowId}/executions/${executionId}`
}


