'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { getWorkflowROI } from '@/lib/supabase'
import { WorkflowROICalculated } from '@/types/supabase'
import { formatCurrency, formatHours, getHealthStatus } from '@/lib/utils'
import { AlertCircle, CheckCircle2, Activity } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface WorkflowROIBreakdownProps {
  clientId: string
}

export default function WorkflowROIBreakdown({ clientId }: WorkflowROIBreakdownProps) {
  const [data, setData] = useState<WorkflowROICalculated[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        const result = await getWorkflowROI(clientId)
        setData(result)
      } catch (err) {
        console.error('Error loading workflow ROI:', err)
        const errorMessage = err instanceof Error ? err.message : String(err)
        setError(`Failed to load workflow ROI: ${errorMessage}`)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [clientId])

  const getStatusIndicator = (workflow: WorkflowROICalculated) => {
    if (workflow.roi_type === 'new_capability') {
      return <CheckCircle2 className="h-4 w-4 text-blue-600" />
    }
    
    // For per_execution and recurring_task, we'd need success rate
    // For now, show a default indicator
    return <CheckCircle2 className="h-4 w-4 text-green-600" />
  }

  const getROITypeBadge = (type: string) => {
    const configs: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
      per_execution: { label: 'Per Execution', variant: 'default' },
      recurring_task: { label: 'Recurring Task', variant: 'secondary' },
      new_capability: { label: 'New Capability', variant: 'outline' },
    }
    const config = configs[type] || { label: type, variant: 'default' }
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-full" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <p className="text-destructive">{error}</p>
        </CardHeader>
      </Card>
    )
  }

  if (data.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="rounded-full bg-muted p-3 mb-4">
            <Activity className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No Workflow ROI Data</h3>
          <p className="text-sm text-muted-foreground text-center max-w-md">
            No workflows have ROI configuration yet. Configure ROI parameters to see workflow-level value metrics.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <TooltipProvider>
      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold mb-2">Workflow ROI Breakdown</h2>
          <p className="text-sm text-muted-foreground">
            Individual workflow value metrics since deployment
          </p>
        </div>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {data.map((workflow) => {
            const workflowName = workflow.workflow_name || workflow.workflow_id || 'Unknown'
            const isTruncated = workflowName.length > 40
            const currency = workflow.currency_code || 'GBP'
            
            // Calculate value (labor cost saved or value created)
            const value = workflow.labor_cost_saved || workflow.value_created || 0
            const workflowCost = workflow.workflow_implementation_cost || 0
            const allocatedSetupFee = workflow.allocated_setup_fee || 0
            const totalCost = workflow.implementation_cost_applied || 0
            const netROI = value - totalCost
            
            // Get display values
            const hoursSaved = workflow.minutes_saved ? workflow.minutes_saved / 60 : 0
            const executions = workflow.successful_executions || 0

            return (
              <Card key={workflow.workflow_id} className="hover:border-primary/50 hover:shadow-lg transition-all duration-200 shadow-sm">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        {getStatusIndicator(workflow)}
                        {isTruncated ? (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <h3 className="font-semibold text-lg truncate cursor-help" title={workflowName}>
                                {workflowName}
                              </h3>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="max-w-xs">{workflowName}</p>
                            </TooltipContent>
                          </Tooltip>
                        ) : (
                          <h3 className="font-semibold text-lg">{workflowName}</h3>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {getROITypeBadge(workflow.roi_type)}
                        <span className="text-xs text-muted-foreground">
                          {workflow.days_since_deployment || 0} days active
                        </span>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Value Metrics */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Value Created</p>
                        <p className="text-xl font-bold text-green-600">
                          {formatCurrency(value, currency)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Net ROI</p>
                        <p className={`text-xl font-bold ${netROI >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(netROI, currency)}
                        </p>
                      </div>
                    </div>

                    {/* Additional Metrics */}
                    {workflow.roi_type !== 'new_capability' && hoursSaved > 0 && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Time Saved</p>
                        <p className="text-lg font-semibold">{formatHours(workflow.minutes_saved || 0)}</p>
                      </div>
                    )}

                    {executions > 0 && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Successful Executions</p>
                        <p className="text-lg font-semibold">{executions.toLocaleString()}</p>
                      </div>
                    )}

                    {/* Cost Breakdown */}
                    {totalCost > 0 && (
                      <div className="pt-3 border-t space-y-2">
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Total Implementation Cost</p>
                          <p className="text-sm font-medium text-destructive">
                            {formatCurrency(totalCost, currency)}
                          </p>
                        </div>
                        {(workflowCost > 0 || allocatedSetupFee > 0) && (
                          <div className="pl-2 border-l-2 border-muted space-y-1 text-xs">
                            {workflowCost > 0 && (
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Workflow-specific:</span>
                                <span className="font-medium">{formatCurrency(workflowCost, currency)}</span>
                              </div>
                            )}
                            {allocatedSetupFee > 0 && (
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Allocated setup fee:</span>
                                <span className="font-medium">{formatCurrency(allocatedSetupFee, currency)}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {workflow.value_description && (
                      <div className="pt-2">
                        <p className="text-xs text-muted-foreground italic">
                          {workflow.value_description}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </TooltipProvider>
  )
}

