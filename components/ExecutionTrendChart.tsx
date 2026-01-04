'use client'

import { useEffect, useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { getRecentExecutions } from '@/lib/supabase'
import { RecentExecution } from '@/types/supabase'
import { Activity } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { Colors } from '@/lib/design-tokens'

interface ExecutionTrendChartProps {
  clientId: string
}

interface HourlyData {
  hour: string
  successful: number
  failed: number
}

export default function ExecutionTrendChart({ clientId }: ExecutionTrendChartProps) {
  const [data, setData] = useState<RecentExecution[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isCardHovered, setIsCardHovered] = useState(false)

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        // Fetch last 24 hours of executions
        // Since Supabase/PostgREST has a max limit of 1000 per request,
        // we need to use pagination to fetch all executions
        const allExecutions: RecentExecution[] = []
        let offset = 0
        const pageSize = 1000
        let hasMore = true
        
        while (hasMore) {
          const result = await getRecentExecutions(clientId, { 
            days: 1, 
            limit: pageSize, 
            offset: offset 
          })
          
          if (result.data && result.data.length > 0) {
            allExecutions.push(...result.data)
            offset += pageSize
            
            // If we got fewer results than pageSize, we've reached the end
            // Or if the total count matches what we've fetched
            if (result.data.length < pageSize || (result.count !== null && allExecutions.length >= result.count)) {
              hasMore = false
            }
          } else {
            hasMore = false
          }
        }
        
        setData(allExecutions)
      } catch (err) {
        console.error('Error loading executions:', err)
        const errorMessage = err instanceof Error ? err.message : String(err)
        setError(`Failed to load execution trend: ${errorMessage}`)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [clientId])

  // Aggregate executions by 2-hour intervals (using local time)
  const hourlyData: HourlyData[] = useMemo(() => {
    const now = new Date()
    // Round down current time to the nearest 2-hour boundary to ensure consistent bucket boundaries
    const currentHour = now.getHours()
    const roundedHour = Math.floor(currentHour / 2) * 2
    const roundedNow = new Date(now.getFullYear(), now.getMonth(), now.getDate(), roundedHour, 0, 0, 0)
    const last24Hours = new Date(roundedNow.getTime() - 24 * 60 * 60 * 1000)

    // Initialize 12 two-hour intervals covering exactly 24 hours (using local time)
    // Start from the rounded current hour and go back 24 hours in 2-hour increments
    const hoursMap = new Map<string, { successful: number; failed: number }>()
    for (let i = 0; i < 12; i++) {
      // Calculate the bucket start time: roundedNow - (i * 2 hours)
      const bucketTime = new Date(roundedNow.getTime() - i * 2 * 60 * 60 * 1000)
      const year = bucketTime.getFullYear()
      const month = String(bucketTime.getMonth() + 1).padStart(2, '0')
      const day = String(bucketTime.getDate()).padStart(2, '0')
      const hourNum = String(bucketTime.getHours()).padStart(2, '0')
      const hourKey = `${year}-${month}-${day} ${hourNum}:00`
      hoursMap.set(hourKey, { successful: 0, failed: 0 })
    }

    // Aggregate executions into 2-hour buckets (convert UTC timestamps to local time)
    data.forEach((execution) => {
      if (!execution.started_at) return

      const executionDate = new Date(execution.started_at)
      // Only process executions within the last 24 hours (from roundedNow to now)
      // We use roundedNow for the start boundary to match our bucket boundaries,
      // but use now for the end boundary to include all executions up to the current time
      if (executionDate < last24Hours || executionDate > now) return

      // Round down to the nearest 2-hour boundary
      const executionHour = executionDate.getHours()
      const intervalHour = Math.floor(executionHour / 2) * 2
      const year = executionDate.getFullYear()
      const month = String(executionDate.getMonth() + 1).padStart(2, '0')
      const day = String(executionDate.getDate()).padStart(2, '0')
      const hourNum = String(intervalHour).padStart(2, '0')
      const hourKey = `${year}-${month}-${day} ${hourNum}:00`
      const hourData = hoursMap.get(hourKey)

      if (hourData) {
        if (execution.status === 'success') {
          hourData.successful += 1
        } else {
          hourData.failed += 1
        }
      }
    })

    // Convert to array and format for display
    return Array.from(hoursMap.entries())
      .map(([hourKey, counts]) => {
        // Parse the hour key and format for display
        const [datePart, timePart] = hourKey.split(' ')
        const [year, month, day] = datePart.split('-').map(Number)
        const hour = parseInt(timePart.split(':')[0])
        const date = new Date(year, month - 1, day, hour, 0, 0)
        const hourLabel = date.toLocaleTimeString('en-GB', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        })
        return {
          hour: hourLabel,
          successful: counts.successful,
          failed: counts.failed,
        }
      })
      .reverse() // Reverse to show oldest to newest
  }, [data])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-64" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Error</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive">{error}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card 
      style={{ 
        marginTop: '10px',
        border: isCardHovered ? `1px solid ${Colors.dashboard.text.primary.rgb}` : undefined
      }}
      onMouseEnter={() => setIsCardHovered(true)}
      onMouseLeave={() => setIsCardHovered(false)}
    >
      <CardHeader style={{ padding: '10px 10px 5px', position: 'relative' }}>
        <h4 style={{ 
          color: Colors.dashboard.text.primary.rgb,
          maxWidth: '579px',
          fontSize: 'calc(1.275rem + 0.3vw)', 
          fontWeight: 500, 
          margin: 0, 
          padding: 0, 
          paddingRight: '180px',
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
        }}>Execution Trend</h4>
        <span style={{
          position: 'absolute',
          top: '14px',
          right: '10px',
          fontSize: '0.875rem',
          color: Colors.main.default.gray2.rgb,
          fontFamily: 'Roboto',
          margin: 0,
          padding: 0,
          lineHeight: 1.2,
          whiteSpace: 'nowrap'
        }}>
          Last 24 H
        </span>
      </CardHeader>
      <CardContent style={{ padding: '20px' }}>
        {hourlyData.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="rounded-full bg-muted p-3 mb-4">
              <Activity className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No Execution Data</h3>
            <p className="text-sm text-muted-foreground text-center max-w-md">
              No executions found in the last 24 hours.
            </p>
          </div>
        ) : (
          <>
            {/* Custom Legend */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', marginBottom: '20px', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div
                  style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    backgroundColor: Colors.main.primary.color1.hex,
                    flexShrink: 0,
                  }}
                />
                <span style={{ fontSize: '13px', color: Colors.dashboard.text.primary.rgb }}>
                  Successful Executions
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div
                  style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    backgroundColor: 'rgb(153, 147, 255)',
                    flexShrink: 0,
                  }}
                />
                <span style={{ fontSize: '13px', color: Colors.dashboard.text.primary.rgb }}>
                  Failed Executions
                </span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={hourlyData}>
                <XAxis
                  dataKey="hour"
                  stroke={Colors.main.default.gray2.hex}
                  style={{ fontSize: '12px' }}
                  interval="preserveStartEnd"
                />
                <YAxis
                  yAxisId="left"
                  stroke={Colors.main.default.gray2.hex}
                  style={{ fontSize: '12px' }}
                  label={{ value: 'Successful Executions', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: Colors.main.default.gray2.hex } }}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  stroke={Colors.main.default.gray2.hex}
                  style={{ fontSize: '12px' }}
                  label={{ value: 'Failed Executions', angle: 90, position: 'insideRight', style: { textAnchor: 'middle', fill: Colors.main.default.gray2.hex } }}
                />
                <Tooltip
                  cursor={false}
                  content={({ active, payload, label }) => {
                    if (!active || !payload || !payload.length) return null
                    
                    const successfulValue = payload.find(p => p.dataKey === 'successful')?.value || 0
                    const failedValue = payload.find(p => p.dataKey === 'failed')?.value || 0
                    
                    return (
                      <div style={{
                        backgroundColor: '#333333',
                        border: 'none',
                        borderRadius: '4px',
                        padding: '10px 14px',
                        color: '#FFFFFF',
                        fontSize: '14px',
                        fontWeight: 400,
                        fontFamily: 'Roboto, sans-serif',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
                        lineHeight: '1.5'
                      }}>
                        <div style={{ marginBottom: '8px', fontWeight: 500, fontSize: '14px' }}>
                          {label}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                          <div style={{
                            width: '12px',
                            height: '12px',
                            backgroundColor: Colors.main.primary.color1.hex,
                            flexShrink: 0,
                            borderRadius: '2px'
                          }} />
                          <span style={{ fontWeight: 400 }}>Successful Executions : {successfulValue}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{
                            width: '12px',
                            height: '12px',
                            backgroundColor: 'rgb(153, 147, 255)',
                            flexShrink: 0,
                            borderRadius: '2px'
                          }} />
                          <span style={{ fontWeight: 400 }}>Failed Executions : {failedValue}</span>
                        </div>
                      </div>
                    )
                  }}
                />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="successful"
                  stroke={Colors.main.primary.color1.hex}
                  strokeWidth={2}
                  name="Successful Executions"
                  dot={{ fill: Colors.main.primary.color1.hex, r: 4 }}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="failed"
                  stroke="rgb(153, 147, 255)"
                  strokeWidth={2}
                  name="Failed Executions"
                  dot={{ fill: 'rgb(153, 147, 255)', r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </>
        )}
      </CardContent>
    </Card>
  )
}

