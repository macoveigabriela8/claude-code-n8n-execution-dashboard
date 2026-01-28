'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { StatusBadge } from '@/components/ui/status-badge'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { getRecentExecutions } from '@/lib/supabase'
import { RecentExecution } from '@/types/supabase'
import { formatTimeAgo, formatDuration, getDurationColor, formatDurationSeconds } from '@/lib/utils'
import { getExecutionUrl } from '@/lib/config'
import ExecutionFilters from './ExecutionFilters'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Activity, ExternalLink, X } from 'lucide-react'

interface RecentExecutionsProps {
  clientId: string
}

const ITEMS_PER_PAGE = 20

export default function RecentExecutions({ clientId }: RecentExecutionsProps) {
  const [data, setData] = useState<RecentExecution[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [workflowFilter, setWorkflowFilter] = useState<string>('all')
  const [daysFilter, setDaysFilter] = useState<number>(1)
  const [currentPage, setCurrentPage] = useState(1)
  const [showOnlyWorkDone, setShowOnlyWorkDone] = useState<boolean>(true)

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        const filters: { status?: string; limit?: number; days?: number } = { limit: 100, days: daysFilter }
        if (statusFilter !== 'all') {
          filters.status = statusFilter
        }
        const result = await getRecentExecutions(clientId, filters)
        setData(result.data)
        setCurrentPage(1) // Reset to first page when filters change
      } catch (err) {
        console.error('Error loading executions:', err)
        let errorMessage = 'Failed to load executions'
        if (err instanceof Error) {
          errorMessage = err.message
        } else if (err && typeof err === 'object' && 'message' in err) {
          errorMessage = String(err.message)
        } else {
          errorMessage = String(err)
        }
        setError(errorMessage)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [clientId, statusFilter, daysFilter])

  // Get unique workflow names from the data
  const workflowOptions = Array.from(
    new Set(data.map((exec) => exec.workflow_name).filter(Boolean))
  ).sort() as string[]

  const filteredData = data.filter((execution) => {
    // Filter by workflow
    if (workflowFilter !== 'all' && execution.workflow_name !== workflowFilter) {
      return false
    }
    // Filter out "No action" executions if showing only work done
    if (showOnlyWorkDone) {
      if (!execution.details) return false // Exclude executions with no details - no details = no work done
      const detailsStr = typeof execution.details === 'string' ? execution.details : JSON.stringify(execution.details)
      if (detailsStr.toLowerCase().startsWith('no')) {
        return false
      }
    }
    return true
  })

  // Pagination
  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const paginatedData = filteredData.slice(startIndex, endIndex)

  const activeFilterCount = (statusFilter !== 'all' ? 1 : 0) + (workflowFilter !== 'all' ? 1 : 0) + (showOnlyWorkDone ? 1 : 0)

  const clearAllFilters = () => {
    setStatusFilter('all')
    setWorkflowFilter('all')
    setShowOnlyWorkDone(true)
  }

  return (
    <TooltipProvider>
      <Card className="shadow-sm">
        <CardHeader className="pb-4 border-b">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-2">
            <div>
              <CardTitle className="text-xl md:text-2xl">Recent Executions</CardTitle>
              <CardDescription>Latest workflow execution records</CardDescription>
            </div>
            {activeFilterCount > 0 && (
              <div className="flex items-center gap-2 flex-shrink-0">
                <Badge variant="secondary" className="text-xs">
                  {activeFilterCount} filter{activeFilterCount > 1 ? 's' : ''} active
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAllFilters}
                  className="h-7 text-xs"
                >
                  <X className="h-3 w-3 mr-1" />
                  Clear All
                </Button>
              </div>
            )}
          </div>
          <div className="mt-4">
            <ExecutionFilters
              statusFilter={statusFilter}
              onStatusChange={setStatusFilter}
              workflowFilter={workflowFilter}
              onWorkflowChange={setWorkflowFilter}
              workflowOptions={workflowOptions}
              daysFilter={daysFilter}
              onDaysChange={setDaysFilter}
              showOnlyWorkDone={showOnlyWorkDone}
              onShowOnlyWorkDoneChange={setShowOnlyWorkDone}
            />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : error ? (
            <p className="text-destructive">{error}</p>
          ) : filteredData.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 border border-dashed rounded-md">
              <div className="rounded-full bg-muted p-3 mb-4">
                <Activity className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No Executions Found</h3>
              <p className="text-sm text-muted-foreground text-center max-w-md">
                {statusFilter !== 'all' || workflowFilter !== 'all'
                  ? 'No executions match your current filters. Try adjusting your filter selection.'
                  : 'No recent executions found for this client. Executions will appear here once workflows start running.'}
              </p>
            </div>
          ) : (
            <>
              <div className="rounded-md border overflow-x-auto -mx-1 md:mx-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Workflow</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Started</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedData.map((execution, index) => {
                      const workflowName = execution.workflow_name || execution.workflow_id || 'Unknown'
                      const isTruncated = workflowName.length > 30
                      const durationSeconds = execution.duration_ms ? execution.duration_ms / 1000 : null
                      const executionUrl = execution.workflow_id && execution.execution_id
                        ? getExecutionUrl(execution.workflow_id, execution.execution_id)
                        : null
                      return (
                        <TableRow 
                          key={execution.execution_id || execution.workflow_id || execution.workflow_name || `execution-${index}`}
                          className="hover:bg-muted/50 transition-colors"
                        >
                          <TableCell className="font-medium">
                            {isTruncated ? (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="truncate block cursor-help" title={workflowName}>
                                    {workflowName}
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="max-w-xs">{workflowName}</p>
                                </TooltipContent>
                              </Tooltip>
                            ) : (
                              workflowName
                            )}
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={execution.status || 'error'} />
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {formatTimeAgo(execution.started_at)}
                          </TableCell>
                          <TableCell>
                            <span className={`font-mono text-sm ${getDurationColor(execution.duration_ms)}`}>
                              {formatDurationSeconds(durationSeconds)}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            {executionUrl && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <a
                                    href={executionUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center text-xs text-muted-foreground hover:text-foreground transition-colors"
                                  >
                                    <ExternalLink className="h-3 w-3" />
                                  </a>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Open in n8n</p>
                                </TooltipContent>
                              </Tooltip>
                            )}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
              
              {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-4 border-t">
                  <div className="text-sm text-muted-foreground text-center sm:text-left">
                    Showing {startIndex + 1}-{Math.min(endIndex, filteredData.length)} of {filteredData.length} executions
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <div className="text-sm text-muted-foreground min-w-[80px] text-center">
                      Page {currentPage} of {totalPages}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </TooltipProvider>
  )
}
