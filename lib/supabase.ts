import { createClient } from '@supabase/supabase-js'
import { RecentExecution } from '@/types/supabase'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Query functions for the three views
export async function getClientSummary(clientId: string) {
  const { data, error } = await supabase
    .from('vw_client_summary')
    .select('*')
    .eq('client_id', clientId)
    .maybeSingle()

  if (error) throw error
  return data || null
}

export async function getRecentExecutions(clientId: string, filters?: {
  status?: string
  limit?: number
  days?: number  // Add days parameter for date filtering
  offset?: number  // Add offset for server-side pagination
  workflowName?: string  // Add workflow name filter
}) {
  let query = supabase
    .from('vw_recent_executions')
    .select('*', { count: 'exact' }) // Request count for pagination
    .eq('client_id', clientId)
  
  // Add date filter if days specified
  // "Last N days" means: last N * 24 hours from now (not calendar days)
  // Example: "Last 24 hours" means entries from the past 24 hours
  // Example: "Last 5 days" means entries from the past 5 * 24 hours
  // Use UTC for consistent date calculations (database stores timestamps in UTC)
  if (filters?.days) {
    const now = new Date()
    // Calculate threshold: now minus (N days * 24 hours)
    const dateThreshold = new Date(now.getTime() - (filters.days * 24 * 60 * 60 * 1000))
    query = query.gte('started_at', dateThreshold.toISOString())
  }

  if (filters?.status) {
    query = query.eq('status', filters.status)
  }

  if (filters?.workflowName) {
    query = query.eq('workflow_name', filters.workflowName)
  }

  // Add ordering by started_at descending for consistent results
  query = query.order('started_at', { ascending: false })

  // Supabase/PostgREST has a default max limit of 1000 rows per request
  // Use range() for server-side pagination to fetch specific chunks
  if (filters?.offset !== undefined && filters?.limit) {
    // Server-side pagination: fetch specific range
    const from = filters.offset
    const to = filters.offset + filters.limit - 1
    query = query.range(from, to)
  } else if (filters?.limit) {
    // Simple limit (for backward compatibility)
    // Supabase/PostgREST max limit is 1000 per request, so cap at 1000
    // For higher limits, pagination should be used instead
    query = query.limit(Math.min(filters.limit, 1000))
  } else {
    // Default limit: if days filter is set, use max 1000; otherwise 100
    const defaultLimit = filters?.days ? 1000 : 100
    query = query.limit(defaultLimit)
  }

  const { data, error, count } = await query

  if (error) throw error
  
  // Return data with count for pagination
  return {
    data: data || [],
    count: count || 0
  }
}

// Legacy function signature for backward compatibility
// This will be removed once all components are updated
export async function getRecentExecutionsLegacy(clientId: string, filters?: {
  status?: string
  limit?: number
  days?: number
}): Promise<RecentExecution[]> {
  const result = await getRecentExecutions(clientId, filters)
  return result.data
}

export async function getWorkflowStats(clientId: string) {
  const { data, error } = await supabase
    .from('vw_workflow_stats')
    .select('*')
    .eq('client_id', clientId)
    .order('display_order', { ascending: true })

  if (error) throw error
  return data || []
}

// ROI Query Functions
export async function getClientROISummary(clientId: string) {
  const { data, error } = await supabase
    .from('vw_client_roi_summary')
    .select('*')
    .eq('client_id', clientId)
    .maybeSingle()

  if (error) throw error
  return data || null
}

export async function getWorkflowROI(clientId: string) {
  const { data, error } = await supabase
    .from('vw_workflow_roi_calculated')
    .select('*')
    .eq('client_id', clientId)
    .order('workflow_name', { ascending: true })

  if (error) throw error
  return data || []
}

export async function getROIConfig(workflowId: string, clientId: string) {
  const { data, error } = await supabase
    .from('n8n_workflow_roi')
    .select('*')
    .eq('workflow_id', workflowId)
    .eq('client_id', clientId)
    .maybeSingle()

  if (error) throw error
  return data || null
}

export async function createROIConfig(config: any) {
  const { data, error } = await supabase
    .from('n8n_workflow_roi')
    .insert(config)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateROIConfig(id: string, updates: any) {
  const { data, error } = await supabase
    .from('n8n_workflow_roi')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteROIConfig(id: string) {
  const { error } = await supabase
    .from('n8n_workflow_roi')
    .delete()
    .eq('id', id)

  if (error) throw error
}

export async function getClientTools(clientId: string) {
  const { data, error } = await supabase
    .from('n8n_tool_costs')
    .select('*')
    .eq('client_id', clientId)
    .order('tool', { ascending: true })

  if (error) throw error
  return data || []
}

export async function updateClientTools(clientId: string, toolCosts: any[]) {
  // Use a transaction-like approach: delete existing, insert new
  // First, delete existing tools for this client
  const { error: deleteError } = await supabase
    .from('n8n_tool_costs')
    .delete()
    .eq('client_id', clientId)

  if (deleteError) throw deleteError

  // If no tools to insert, we're done
  if (!toolCosts || toolCosts.length === 0) {
    return []
  }

  // Insert new tools
  const toolsToInsert = toolCosts.map(tool => {
    const baseTool: any = {
      client_id: clientId,
      tool: tool.tool,
      cost: tool.cost || 0,
      period: tool.period || null,
      recurring: tool.recurring ?? true,
      enabled: true, // Only enabled tools are saved
      currency_code: tool.currency_code || null,
    }
    
    // Add end_date for one-time fees (recurring = false)
    if (tool.end_date) {
      baseTool.end_date = tool.end_date
    }
    
    // Add start_date for recurring tools (can be null)
    if (tool.recurring !== false) {
      baseTool.start_date = tool.start_date || null
    }
    
    return baseTool
  })

  const { data, error: insertError } = await supabase
    .from('n8n_tool_costs')
    .insert(toolsToInsert)
    .select()

  if (insertError) throw insertError
  return data || []
}

export async function getClientWorkflows(clientId: string) {
  const { data, error } = await supabase
    .from('n8n_workflows')
    .select('*')
    .eq('client_id', clientId)
    .eq('is_active', true)
    .order('display_order', { ascending: true })

  if (error) throw error
  return data || []
}

export async function getClientData(clientId: string) {
  const { data, error } = await supabase
    .from('n8n_clients')
    .select('*')  // Select all columns, handle missing fields gracefully
    .eq('id', clientId)
    .maybeSingle()

  if (error) throw error
  return data
}

export async function getWorkflowROIConfigs(clientId: string) {
  const { data, error } = await supabase
    .from('n8n_workflow_roi')
    .select('*')
    .eq('client_id', clientId)

  if (error) throw error
  return data || []
}

