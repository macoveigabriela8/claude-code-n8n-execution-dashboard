// Type definitions for Supabase views
// These will be refined once we query actual data

export interface ClientSummary {
  client_id: string
  client_name?: string
  client_code?: string
  total_workflows?: number
  executions_24h?: number
  success_24h?: number
  errors_24h?: number
  success_rate_24h?: number
  [key: string]: any
}

export interface RecentExecution {
  client_id: string
  client_name?: string
  client_code?: string
  execution_id: string
  workflow_id?: string
  workflow_name?: string
  status: 'success' | 'error'
  mode?: string
  started_at?: string
  stopped_at?: string
  duration_ms?: number
  details?: string | any
  [key: string]: any
}

export interface WorkflowStats {
  client_id: string
  client_name?: string
  client_code?: string
  workflow_id?: string
  workflow_name?: string
  display_order?: number
  executions_24h?: number
  success_24h?: number
  errors_24h?: number
  success_rate_24h?: number
  avg_duration_ms?: number
  last_execution?: string
  [key: string]: any
}

export interface WorkflowROIConfig {
  id?: string
  workflow_id: string
  client_id: string
  roi_type: 'per_execution' | 'recurring_task' | 'new_capability'
  deployment_date: string | null
  currency_code?: string
  work_days_per_week?: number
  manual_minutes_saved?: number
  hourly_rate?: number
  implementation_cost?: number
  implementation_date?: string
  frequency?: 'daily' | 'weekly' | 'monthly' | 'quarterly'
  occurrences_per_frequency?: number
  value_per_execution?: number
  clients_per_report?: number
  reactivation_rate_percent?: number
  value_per_client?: number
  value_per_frequency?: number  // Value per frequency period for new_capability (e.g., 350 for £350 per month)
  value_description?: string
  notes?: string
  [key: string]: any
}

export interface WorkflowROICalculated {
  id?: string
  client_id: string
  workflow_id: string
  workflow_name?: string
  roi_type: 'per_execution' | 'recurring_task' | 'new_capability'
  currency_code?: string
  deployment_date?: string
  implementation_cost?: number
  implementation_date?: string
  days_since_deployment?: number
  successful_executions?: number
  total_executions?: number
  minutes_saved?: number
  labor_cost_saved?: number
  value_created?: number
  workflow_implementation_cost?: number
  allocated_setup_fee?: number
  implementation_cost_applied?: number
  recurring_tool_cost_allocated_divided_by_workflows_times_months_active?: number
  one_time_tool_cost_divided_by_number_of_workflows?: number
  allocated_tool_cost?: number  // Total: recurring + one-time
  value_description?: string
  notes?: string
  [key: string]: any
}

export interface ClientROISummary {
  client_id: string
  client_name?: string
  client_code?: string
  total_minutes_saved?: number
  total_hours_saved?: number
  total_labor_cost_saved?: number
  total_value_created?: number
  total_implementation_costs?: number
  total_tool_costs?: number
  total_automation_cost?: number
  net_roi?: number
  currency_code?: string
  workflows_with_roi?: number
  [key: string]: any
}

export interface ClientToolCost {
  tool: string
  cost: number
  recurring?: boolean
  period?: 'monthly' | 'quarterly' | 'yearly' | '24months' | null
  start_date?: string | null  // Date when tool subscription started. If NULL, falls back to earliest workflow deployment date.
  end_date?: string
  currency_code?: string
}

