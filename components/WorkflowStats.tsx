'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { getWorkflowStats } from '@/lib/supabase'
import { WorkflowStats as WorkflowStatsType } from '@/types/supabase'
import { formatTimeAgo, formatDuration, getHealthStatus } from '@/lib/utils'
import { ChevronDown, AlertCircle, CheckCircle2 } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Colors } from '@/lib/design-tokens'

interface WorkflowStatsProps {
  clientId: string
}

export default function WorkflowStats({ clientId }: WorkflowStatsProps) {
  const [data, setData] = useState<WorkflowStatsType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        const result = await getWorkflowStats(clientId)
        setData(result)
      } catch (err) {
        console.error('Error loading workflow stats:', err)
        const errorMessage = err instanceof Error ? err.message : String(err)
        setError(`Failed to load workflow stats: ${errorMessage}`)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [clientId])

  const calculateSuccessRate = (stats: WorkflowStatsType) => {
    if (stats.success_rate_24h !== undefined && stats.success_rate_24h !== null) {
      return Math.round(stats.success_rate_24h)
    }
    const total = stats.executions_24h ?? 0
    const successful = stats.success_24h ?? 0
    if (total === 0) return 0
    return Math.round((successful / total) * 100)
  }

  const getHealthColor = (rate: number) => {
    // Return palette color hex values for inline styles
    if (rate >= 99) return Colors.main.default.green.hex
    if (rate >= 95) return Colors.main.default.green.hex
    if (rate >= 90) return Colors.main.default.yellow.hex
    return Colors.main.default.red.hex
  }

  const getStatusIndicator = (rate: number) => {
    const status = getHealthStatus(rate)
    if (status === 'healthy') {
      return <CheckCircle2 className="h-4 w-4" style={{ color: Colors.main.default.green.hex }} />
    } else if (status === 'needs-attention') {
      return <AlertCircle className="h-4 w-4" style={{ color: Colors.main.default.yellow.hex }} />
    } else {
      return <AlertCircle className="h-4 w-4" style={{ color: Colors.main.default.red.hex }} />
    }
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
              <div className="grid grid-cols-4 gap-3 mb-4">
                {[1, 2, 3, 4].map((j) => (
                  <div key={j} className="text-center">
                    <Skeleton className="h-8 w-full mb-1" />
                    <Skeleton className="h-3 w-full" />
                  </div>
                ))}
              </div>
              <Skeleton className="h-2 w-full" />
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
          <h3 className="text-lg font-semibold mb-2">No Workflows Found</h3>
          <p className="text-sm text-muted-foreground text-center max-w-md">
            There are no active workflows for this client. Workflows will appear here once executions are recorded.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <TooltipProvider>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {data.map((workflow) => {
          const successRate = calculateSuccessRate(workflow)
          const workflowName = workflow.workflow_name || workflow.workflow_id || 'Unknown'
          const isTruncated = workflowName.length > 40
          return (
            <Card key={workflow.workflow_id || workflow.workflow_name} className="hover:border-primary/50 hover:shadow-lg transition-all duration-200 shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {getStatusIndicator(successRate)}
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
                    <p className="text-xs text-muted-foreground mt-1">Last run: {formatTimeAgo(workflow.last_execution)}</p>
                  </div>
                  <ChevronDown size={18} className="text-muted-foreground flex-shrink-0" />
                </div>
              </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-3 mb-4">
                <div className="text-center">
                  <p className="text-2xl font-bold">{workflow.executions_24h?.toLocaleString() ?? 0}</p>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Total</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold" style={{ color: Colors.main.default.green.hex }}>{workflow.success_24h?.toLocaleString() ?? 0}</p>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Success</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-destructive">{workflow.errors_24h?.toLocaleString() ?? 0}</p>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Errors</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">{formatDuration(workflow.avg_duration_ms)}</p>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Avg Time</p>
                </div>
              </div>
              
              <div className="mt-4">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-muted-foreground">Success Rate</span>
                  <span className="text-sm font-semibold">{successRate}%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full transition-all duration-500"
                    style={{ 
                      width: `${Math.min(successRate, 100)}%`,
                      backgroundColor: getHealthColor(successRate)
                    }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
          )
        })}
      </div>
    </TooltipProvider>
  )
}
