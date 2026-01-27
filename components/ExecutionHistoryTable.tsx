'use client'

import { useEffect, useState, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { StatusBadge } from '@/components/ui/status-badge'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { getRecentExecutions } from '@/lib/supabase'
import { RecentExecution } from '@/types/supabase'
import { formatDateTime, formatDuration, getDurationColor } from '@/lib/utils'
import ExecutionFilters from './ExecutionFilters'
import { Activity, X, ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight } from 'lucide-react'
import { Colors } from '@/lib/design-tokens'

interface ExecutionHistoryTableProps {
  clientId: string
}

const ITEMS_PER_PAGE = 20

export default function ExecutionHistoryTable({ clientId }: ExecutionHistoryTableProps) {
  const [data, setData] = useState<RecentExecution[]>([])
  const [totalCount, setTotalCount] = useState<number>(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isCardHovered, setIsCardHovered] = useState(false)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [workflowFilter, setWorkflowFilter] = useState<string>('all')
  const [daysFilter, setDaysFilter] = useState<number>(1) // Default: Last 24 hours
  const [currentPage, setCurrentPage] = useState(1)
  
  // Use refs to track previous filter values to detect changes
  const prevStatusFilterRef = useRef(statusFilter)
  const prevDaysFilterRef = useRef(daysFilter)
  const prevWorkflowFilterRef = useRef(workflowFilter)

  // Fetch data with server-side pagination
  useEffect(() => {
    // Reset to page 1 if filters changed (but not if just page changed)
    const filtersChanged = prevStatusFilterRef.current !== statusFilter || 
                          prevDaysFilterRef.current !== daysFilter ||
                          prevWorkflowFilterRef.current !== workflowFilter
    const pageToUse = filtersChanged ? 1 : currentPage
    
    if (filtersChanged) {
      setCurrentPage(1)
      setError(null) // Clear any previous errors
      prevStatusFilterRef.current = statusFilter
      prevDaysFilterRef.current = daysFilter
      prevWorkflowFilterRef.current = workflowFilter
    }
    
    async function fetchData() {
      try {
        setLoading(true)
        setError(null) // Clear any previous errors at the start of fetch
        
        // Calculate offset and limit for the page to use
        const offset = (pageToUse - 1) * ITEMS_PER_PAGE
        const limit = ITEMS_PER_PAGE
        
        const filters: { status?: string; limit?: number; days?: number; offset?: number; workflowName?: string } = { 
          limit: limit,
          offset: offset,
          days: daysFilter // Add days filter (default: 1 for 24 hours)
        }
        if (statusFilter !== 'all') {
          filters.status = statusFilter
        }
        if (workflowFilter !== 'all') {
          filters.workflowName = workflowFilter
        }
        
        const result = await getRecentExecutions(clientId, filters)
        if (!result || typeof result !== 'object' || !('data' in result)) {
          console.error('Invalid response format:', result)
          throw new Error('Invalid response format from getRecentExecutions')
        }
        // Ensure data is always an array
        if (!Array.isArray(result.data)) {
          console.error('Invalid data format - not an array:', result.data)
          throw new Error('Invalid data format: expected array')
        }
        setData(result.data)
        setTotalCount(result.count || 0)
        setError(null) // Clear error on success
      } catch (err) {
        console.error('Error loading executions:', err)
        let errorMessage = 'Failed to load executions. Please try again.'
        
        // Safely extract error message
        if (err instanceof Error) {
          errorMessage = err.message || errorMessage
        } else if (err && typeof err === 'object') {
          // Try to extract message from error object
          if ('message' in err) {
            const msg = err.message
            if (typeof msg === 'string' && msg.trim()) {
              errorMessage = msg
            } else if (typeof msg === 'object') {
              // If message is an object, stringify it safely
              try {
                errorMessage = JSON.stringify(msg).substring(0, 200)
              } catch {
                errorMessage = 'An error occurred while processing the request'
              }
            }
          } else if ('error' in err) {
            // Supabase errors sometimes have an 'error' property
            const supabaseErr = (err as any).error
            if (typeof supabaseErr === 'string') {
              errorMessage = supabaseErr
            } else if (supabaseErr && typeof supabaseErr === 'object' && 'message' in supabaseErr) {
              errorMessage = String(supabaseErr.message) || errorMessage
            }
          }
        } else if (typeof err === 'string') {
          errorMessage = err
        }
        
        // Clean up the error message (remove any JSON-like artifacts)
        errorMessage = errorMessage.trim()
        if (errorMessage.startsWith('{') || errorMessage.startsWith('[')) {
          // If error message starts with JSON, it's likely a serialization issue
          errorMessage = 'An error occurred while loading executions. Please refresh the page.'
        }
        
        setError(errorMessage)
        setData([]) // Ensure data is always an array, even on error
        setTotalCount(0)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [clientId, statusFilter, daysFilter, workflowFilter, currentPage])

  // Fetch all workflow names for filter dropdown (separate query, limited to 1000)
  const [workflowOptions, setWorkflowOptions] = useState<string[]>([])
  useEffect(() => {
    async function fetchWorkflowNames() {
      try {
        const result = await getRecentExecutions(clientId, { 
          days: daysFilter,
          limit: 1000 // Get enough to extract unique workflow names
        })
        const uniqueWorkflows = Array.from(
          new Set(result.data.map((exec) => exec.workflow_name).filter(Boolean))
        ).sort() as string[]
        setWorkflowOptions(uniqueWorkflows)
      } catch (err) {
        console.error('Error loading workflow names:', err)
      }
    }
    fetchWorkflowNames()
  }, [clientId, daysFilter])

  // No client-side filtering needed - all filtering is done server-side
  // Ensure data is always an array
  const paginatedData = Array.isArray(data) ? data : []

  // Pagination - use server-side count
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE)

  const activeFilterCount = (statusFilter !== 'all' ? 1 : 0) + (workflowFilter !== 'all' ? 1 : 0) + (daysFilter !== 1 ? 1 : 0)

  const clearAllFilters = () => {
    setStatusFilter('all')
    setWorkflowFilter('all')
    setDaysFilter(1) // Reset to default: Last 24 hours
  }

  return (
    <Card 
        style={{ 
          marginTop: '8px',
          border: isCardHovered ? `1px solid ${Colors.dashboard.text.primary.rgb}` : undefined
        }}
        onMouseEnter={() => setIsCardHovered(true)}
        onMouseLeave={() => setIsCardHovered(false)}
      >
        <CardHeader style={{ padding: '16px 16px 4px', borderBottom: `1px solid ${Colors.dashboard.borders.lighter.rgb}`, position: 'relative' }}>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-2">
            <div>
              <h4 style={{ 
                color: Colors.dashboard.text.primary.rgb,
                fontSize: 'calc(1.02rem + 0.24vw)', 
                fontWeight: 500, 
                margin: 0, 
                padding: 0, 
                fontFamily: 'Roboto',
                wordWrap: 'break-word',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical' as any,
                display: '-webkit-box',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'pre-wrap',
                lineHeight: 1.2,
                textAlign: 'left'
              }}>Execution History</h4>
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
            />
          </div>
        </CardHeader>
        <CardContent style={{ padding: '16px' }}>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : error ? (
            <div className="p-4">
              <p className="text-destructive font-semibold mb-2">Error loading executions</p>
              <p className="text-sm text-muted-foreground break-words">
                {typeof error === 'string' ? error : 'An unexpected error occurred. Please check the browser console for details.'}
              </p>
            </div>
          ) : !Array.isArray(paginatedData) || paginatedData.length === 0 ? (
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
              <div className="overflow-auto" style={{ maxHeight: '600px' }}>
                <table className="w-full" style={{ borderCollapse: 'collapse' }}>
                  <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
                    <tr style={{ backgroundColor: '#F5F5F5' }}>
                      <th style={{ padding: '14px', textAlign: 'left', color: Colors.dashboard.text.primary.rgb, fontWeight: 600, fontSize: '14px', lineHeight: 1.6, borderBottom: `1px solid ${Colors.dashboard.borders.lighter.rgb}` }}>Execution ID</th>
                      <th style={{ padding: '14px', textAlign: 'left', color: Colors.dashboard.text.primary.rgb, fontWeight: 600, fontSize: '14px', lineHeight: 1.6, borderBottom: `1px solid ${Colors.dashboard.borders.lighter.rgb}` }}>Workflow</th>
                      <th style={{ padding: '14px', textAlign: 'left', color: Colors.dashboard.text.primary.rgb, fontWeight: 600, fontSize: '14px', lineHeight: 1.6, borderBottom: `1px solid ${Colors.dashboard.borders.lighter.rgb}` }}>Duration</th>
                      <th style={{ padding: '14px', textAlign: 'left', color: Colors.dashboard.text.primary.rgb, fontWeight: 600, fontSize: '14px', lineHeight: 1.6, borderBottom: `1px solid ${Colors.dashboard.borders.lighter.rgb}` }}>Status</th>
                      <th style={{ padding: '14px', textAlign: 'left', color: Colors.dashboard.text.primary.rgb, fontWeight: 600, fontSize: '14px', lineHeight: 1.6, borderBottom: `1px solid ${Colors.dashboard.borders.lighter.rgb}` }}>Timestamp</th>
                      <th style={{ padding: '14px', textAlign: 'left', color: Colors.dashboard.text.primary.rgb, fontWeight: 600, fontSize: '14px', lineHeight: 1.6, borderBottom: `1px solid ${Colors.dashboard.borders.lighter.rgb}` }}>Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedData.map((execution, index) => {
                      const workflowName = execution.workflow_name || execution.workflow_id || 'Unknown'
                      const isTruncated = workflowName.length > 30
                      const isOddRow = index % 2 === 1
                      return (
                        <tr 
                          key={execution.execution_id || execution.workflow_id || execution.workflow_name || `execution-${index}`}
                          style={{ 
                            backgroundColor: isOddRow ? '#F5F5F5' : '#FFFFFF',
                            borderBottom: index < paginatedData.length - 1 ? `1px solid ${Colors.dashboard.borders.lighter.rgb}` : 'none' 
                          }}
                        >
                          <td style={{ padding: '14px', fontSize: '14px', lineHeight: 1.6, fontWeight: 500, color: Colors.dashboard.text.primary.rgb }}>
                            {execution.execution_id || '-'}
                          </td>
                          <td style={{ padding: '14px', fontSize: '14px', lineHeight: 1.6, fontWeight: 500 }}>
                            <span className="truncate block" style={{ color: Colors.dashboard.text.primary.rgb }}>
                              {workflowName}
                            </span>
                          </td>
                          <td style={{ padding: '14px', color: Colors.dashboard.text.primary.rgb, fontSize: '14px', lineHeight: 1.6, fontWeight: 500 }}>
                            {formatDuration(execution.duration_ms)}
                          </td>
                          <td style={{ padding: '14px', fontSize: '14px', lineHeight: 1.6, fontWeight: 500 }}>
                            <StatusBadge status={execution.status || 'error'} />
                          </td>
                          <td style={{ padding: '14px', color: Colors.dashboard.text.primary.rgb, fontSize: '14px', lineHeight: 1.6, fontWeight: 500 }}>
                            {formatDateTime(execution.started_at)}
                          </td>
                          <td style={{ padding: '14px', color: Colors.dashboard.text.primary.rgb, fontSize: '14px', lineHeight: 1.6, fontWeight: 500 }}>
                            {(() => {
                              const details = execution.details
                              if (!details) return '-'
                              const detailsStr = typeof details === 'string' ? details : JSON.stringify(details)
                              return detailsStr.length > 100 ? `${detailsStr.substring(0, 100)}...` : detailsStr
                            })()}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-4 border-t">
                  <div className="text-sm text-muted-foreground text-center sm:text-left">
                    {statusFilter !== 'all' || workflowFilter !== 'all' || daysFilter !== 1
                      ? `Showing ${paginatedData.length} of ${totalCount} executions (filtered)`
                      : `Showing ${((currentPage - 1) * ITEMS_PER_PAGE) + 1}-${Math.min(currentPage * ITEMS_PER_PAGE, totalCount)} of ${totalCount} executions`
                    }
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(1)}
                      disabled={currentPage === 1}
                      title="First page"
                    >
                      <ChevronsLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      title="Previous page"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <div className="text-sm text-muted-foreground min-w-[80px] text-center">
                      Page {currentPage} of {totalPages}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      title="Next page"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(totalPages)}
                      disabled={currentPage === totalPages}
                      title="Last page"
                    >
                      <ChevronsRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
            </>
          )}
        </CardContent>
      </Card>
  )
}

