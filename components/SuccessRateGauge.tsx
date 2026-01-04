'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { getClientSummary, getWorkflowROI, getWorkflowStats, supabase } from '@/lib/supabase'
import { ClientSummary, WorkflowROICalculated, WorkflowStats } from '@/types/supabase'
import { Activity } from 'lucide-react'
import { Colors } from '@/lib/design-tokens'

interface SuccessRateGaugeProps {
  clientId: string
}

export default function SuccessRateGauge({ clientId }: SuccessRateGaugeProps) {
  const [data, setData] = useState<ClientSummary | null>(null)
  const [workflowROIData, setWorkflowROIData] = useState<WorkflowROICalculated[]>([])
  const [workflowStats, setWorkflowStats] = useState<WorkflowStats[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isCardHovered, setIsCardHovered] = useState(false)
  const [hoveredSegment, setHoveredSegment] = useState<{ name: string; color: string; mouseX: number; mouseY: number; percent: number } | null>(null)
  const [containerRef, setContainerRef] = useState<HTMLDivElement | null>(null)
  const [lastCollectedAt, setLastCollectedAt] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        const [summaryResult, roiResult, statsResult, lastExecutionResult] = await Promise.all([
          getClientSummary(clientId),
          getWorkflowROI(clientId),
          getWorkflowStats(clientId),
          supabase
            .from('n8n_executions')
            .select('collected_at')
            .eq('client_id', clientId)
            .order('collected_at', { ascending: false })
            .limit(1)
            .maybeSingle()
        ])
        setData(summaryResult)
        setWorkflowROIData(roiResult || [])
        setWorkflowStats(statsResult || [])
        if (lastExecutionResult.data?.collected_at) {
          setLastCollectedAt(lastExecutionResult.data.collected_at)
        }
      } catch (err) {
        console.error('Error loading client summary:', err)
        const errorMessage = err instanceof Error ? err.message : String(err)
        setError(`Failed to load success rate: ${errorMessage}`)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [clientId])

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

  if (!data) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="rounded-full bg-muted p-3 mb-4">
            <Activity className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No Data Available</h3>
          <p className="text-sm text-muted-foreground text-center max-w-md">
            No success rate data available for the last 24 hours.
          </p>
        </CardContent>
      </Card>
    )
  }

  const successRate = data.success_rate_24h || 0
  const targetRate = 95

  // Format last update timestamp as HH:mm
  const formatLastUpdate = (timestamp: string | null): string => {
    if (!timestamp) return ''
    try {
      const date = new Date(timestamp)
      return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
    } catch {
      return ''
    }
  }

  // Gauge dimensions - make arc 2.5x bigger, reduce white space
  const width = 700
  const height = 400
  const centerX = width / 2
  const centerY = height - 10 // Position closer to bottom to reduce white space
  const radius = 300 // 2.5x larger radius (300 is approximately 2.5x of original ~120 base)
  // Reduce arc thickness by 5%: current thickness = 170px, new = 170 * 0.95 = 161.5px
  const innerRadius = radius - 161.5 // innerRadius = 138.5 (thickness = 161.5px, 5% reduction)
  const startAngle = 180 // Start at left (180°) for 0%
  const endAngle = 0 // End at right (0°) for 100%

  // Convert percentage to angle (0% = 180° left, 100% = 0° right)
  // SVG angles: 0° = right, 90° = down, 180° = left, 270° = up
  const percentageToAngle = (percent: number) => {
    return startAngle - (percent / 100) * (startAngle - endAngle)
  }

  // Helper to convert degrees to radians
  const degToRad = (deg: number) => (deg * Math.PI) / 180

  // Create SVG arc path for semicircle pointing UP (concave up, like a rainbow/smile)
  // For an arc pointing UP, we need the sweep to go counterclockwise (sweep=1)
  // so the arc curves upward from the center point
  const createArc = (startPercent: number, endPercent: number) => {
    const startDeg = percentageToAngle(startPercent)
    const endDeg = percentageToAngle(endPercent)
    const startRad = degToRad(startDeg)
    const endRad = degToRad(endDeg)

    // Outer arc points (arc curves UP - points are at negative y offset from centerY)
    const x1 = centerX + radius * Math.cos(startRad)
    const y1 = centerY - radius * Math.sin(startRad) // Negative to curve upward
    const x2 = centerX + radius * Math.cos(endRad)
    const y2 = centerY - radius * Math.sin(endRad) // Negative to curve upward

    // Inner arc points
    const x3 = centerX + innerRadius * Math.cos(endRad)
    const y3 = centerY - innerRadius * Math.sin(endRad) // Negative to curve upward
    const x4 = centerX + innerRadius * Math.cos(startRad)
    const y4 = centerY - innerRadius * Math.sin(startRad) // Negative to curve upward

    // Large arc flag (1 if arc spans more than 180°)
    const largeArc = Math.abs(endDeg - startDeg) > 180 ? 1 : 0

    // Create path: Move to start, outer arc (sweep=1 for counterclockwise to curve upward), line to inner, inner arc (sweep=0), close
    return `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} L ${x3} ${y3} A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${x4} ${y4} Z`
  }

  // Filter workflows with executions in the last 24 hours and match with ROI data
  const workflowsWithExecutions = workflowStats
    .filter(stat => (stat.executions_24h || 0) > 0)
    .map(stat => {
      // Match with ROI data to get workflow name and other properties
      const roiData = workflowROIData.find(roi => roi.workflow_id === stat.workflow_id)
      return {
        ...stat,
        workflow_name: roiData?.workflow_name || stat.workflow_name || stat.workflow_id || 'Unknown',
        executions_24h: stat.executions_24h || 0
      }
    })
    .sort((a, b) => (b.executions_24h || 0) - (a.executions_24h || 0)) // Sort by execution count (descending)

  // Calculate total executions for proportional calculation
  const totalExecutions = workflowsWithExecutions.reduce((sum, w) => sum + w.executions_24h, 0)

  // Calculate proportional segment boundaries based on execution counts
  let segmentBoundaries: number[] = [0]
  if (totalExecutions > 0) {
    let cumulativePercent = 0
    workflowsWithExecutions.forEach(workflow => {
      const percent = (workflow.executions_24h / totalExecutions) * 100
      cumulativePercent += percent
      segmentBoundaries.push(cumulativePercent)
    })
    // Ensure the last boundary is exactly 100% to avoid rounding issues
    segmentBoundaries[segmentBoundaries.length - 1] = 100
  } else {
    // If no executions, show empty state (handled below)
    segmentBoundaries = [0, 100]
  }

  const segmentCount = workflowsWithExecutions.length

  // Segment colors - dynamic gradient from dark to light blue/purple
  const colorPalette = [
    Colors.main.primary.color1.rgb, // rgb(52, 43, 194) - Darkest blue/purple
    Colors.main.primary.color2.rgb, // rgb(111, 103, 241) - Medium purple
    Colors.main.secondary.color6.rgb, // rgb(24, 151, 191) - Teal
    Colors.main.secondary.color7.rgb, // rgb(45, 183, 226) - Cyan
    Colors.main.secondary.color8.rgb, // rgb(124, 219, 249) - Lightest blue
    Colors.main.secondary.color9.rgb, // rgb(208, 172, 237) - Lavender (for >5 workflows)
    Colors.main.tertiary.color12.rgb, // rgb(123, 238, 233) - Aqua (for >6 workflows)
  ]
  const segmentColors = colorPalette.slice(0, segmentCount)

  // Needle angle
  const needleAngle = percentageToAngle(Math.min(successRate, 100))
  const needleAngleRad = degToRad(needleAngle)
  // Make needle extend 10% outside the arc: extend from radius to radius * 1.1
  const needleLength = radius * 1.1
  const needleX = centerX + needleLength * Math.cos(needleAngleRad)
  const needleY = centerY - needleLength * Math.sin(needleAngleRad) // Negative to point upward

  // Calculate needle triangle shape (thicker at center, sharp point at end)
  const perpendicularAngle = needleAngle + 90
  const perpendicularAngleRad = degToRad(perpendicularAngle)
  const triangleBaseWidth = 12 // Width at center
  const baseOffsetX1 = Math.cos(perpendicularAngleRad) * (triangleBaseWidth / 2)
  const baseOffsetY1 = -Math.sin(perpendicularAngleRad) * (triangleBaseWidth / 2)
  const baseOffsetX2 = Math.cos(perpendicularAngleRad) * (-triangleBaseWidth / 2)
  const baseOffsetY2 = -Math.sin(perpendicularAngleRad) * (-triangleBaseWidth / 2)
  // Triangle path: from base edge 1, to tip, to base edge 2, back to start
  const needleTrianglePath = `M ${centerX + baseOffsetX1} ${centerY + baseOffsetY1} L ${needleX} ${needleY} L ${centerX + baseOffsetX2} ${centerY + baseOffsetY2} Z`

  // Target line angle (for white marker at target position)
  const targetAngle = percentageToAngle(targetRate)
  const targetAngleRad = degToRad(targetAngle)
  const targetLineStartX = centerX + innerRadius * Math.cos(targetAngleRad)
  const targetLineStartY = centerY - innerRadius * Math.sin(targetAngleRad) // Negative to curve upward
  const targetLineEndX = centerX + radius * Math.cos(targetAngleRad)
  const targetLineEndY = centerY - radius * Math.sin(targetAngleRad) // Negative to curve upward

  // Label positions - positioned closer to the arc edge
  // For proportional segments, show key labels (0%, and segment boundaries if 3 or fewer segments, otherwise just 0% and 100%)
  const labelPositions: Array<{ percent: number; x: number; y: number }> = []
  
  // Always show 0% at bottom left (closer to arc)
  labelPositions.push({ percent: 0, x: centerX - radius - 30, y: centerY + 10 })
  
  // For 2-3 segments, show middle labels above the arc (closer to arc)
  // Use proportional boundaries instead of equal segments
  if (segmentCount === 2 && segmentBoundaries.length > 2) {
    labelPositions.push({ percent: segmentBoundaries[1], x: centerX, y: centerY - radius - 20 })
  } else if (segmentCount === 3 && segmentBoundaries.length > 3) {
    labelPositions.push({ percent: segmentBoundaries[1], x: centerX - radius * 0.5 - 20, y: centerY - radius - 20 })
    labelPositions.push({ percent: segmentBoundaries[2], x: centerX + radius * 0.5 + 20, y: centerY - radius - 20 })
  }
  
  // Always show 100% at bottom right (closer to arc)
  labelPositions.push({ percent: 100, x: centerX + radius + 30, y: centerY + 10 })

  return (
    <Card 
      style={{ 
        marginTop: '10px',
        border: isCardHovered ? `1px solid ${Colors.dashboard.text.primary.rgb}` : undefined
      }}
      onMouseEnter={() => setIsCardHovered(true)}
      onMouseLeave={() => setIsCardHovered(false)}
    >
      <CardHeader style={{ padding: '20px 20px 5px', position: 'relative' }}>
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
        }}>Execution Success Rate</h4>
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
      <CardContent style={{ padding: '5px' }}>
        <div className="flex flex-col items-center justify-center" ref={setContainerRef} style={{ position: 'relative' }}>
          <svg width={width} height={height} style={{ overflow: 'visible' }}>
            {/* Background segments - proportional based on execution counts */}
            {totalExecutions > 0 && segmentBoundaries.slice(0, -1).map((startPercent, index) => {
              const endPercent = segmentBoundaries[index + 1]
              const workflow = workflowsWithExecutions[index]
              const workflowName = workflow?.workflow_name || 'Unknown'
              const segmentPercent = totalExecutions > 0 ? ((workflow.executions_24h / totalExecutions) * 100) : 0
              return (
                <g
                  key={workflow?.workflow_id || index}
                  onMouseMove={(e) => {
                    if (containerRef) {
                      const rect = containerRef.getBoundingClientRect()
                      const mouseX = e.clientX - rect.left
                      const mouseY = e.clientY - rect.top
                      setHoveredSegment({ 
                        name: workflowName, 
                        color: segmentColors[index], 
                        mouseX, 
                        mouseY,
                        percent: segmentPercent
                      })
                    }
                  }}
                  onMouseLeave={() => setHoveredSegment(null)}
                  style={{ cursor: 'pointer' }}
                >
                  <path 
                    d={createArc(startPercent, endPercent)} 
                    fill={segmentColors[index]}
                  />
                </g>
              )
            })}

            {/* Target marker - white line */}
            <line
              x1={targetLineStartX}
              y1={targetLineStartY}
              x2={targetLineEndX}
              y2={targetLineEndY}
              stroke="#FFFFFF"
              strokeWidth="4"
              strokeLinecap="round"
            />

            {/* Scale labels - positioned along outer edge of arc */}
            {labelPositions.map((label, index) => (
              <text
                key={index}
                x={label.x}
                y={label.y}
                textAnchor="middle"
                style={{
                  fontSize: '14px',
                  fill: Colors.dashboard.text.primary.rgb,
                  fontFamily: 'Roboto, sans-serif',
                }}
              >
                {label.percent.toFixed(0)}%
              </text>
            ))}

            {/* Segment percentage labels - positioned outside the arc */}
            {totalExecutions > 0 && segmentBoundaries.slice(0, -1).map((startPercent, index) => {
              const endPercent = segmentBoundaries[index + 1]
              const midPercent = (startPercent + endPercent) / 2
              const midAngle = percentageToAngle(midPercent)
              const midAngleRad = degToRad(midAngle)
              // Position label further out than the radius (radius + 50px offset)
              const labelRadius = radius + 50
              const labelX = centerX + labelRadius * Math.cos(midAngleRad)
              const labelY = centerY - labelRadius * Math.sin(midAngleRad) // Negative to curve upward
              const workflow = workflowsWithExecutions[index]
              const segmentPercent = totalExecutions > 0 ? ((workflow.executions_24h / totalExecutions) * 100) : 0
              
              // Don't show labels for very small segments (less than 0.5%)
              if (segmentPercent < 0.5) {
                return null
              }
              
              return (
                <text
                  key={`segment-label-${index}`}
                  x={labelX}
                  y={labelY}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  style={{
                    fontSize: '14px',
                    fill: Colors.dashboard.text.primary.rgb,
                    fontFamily: 'Roboto, sans-serif',
                    fontWeight: 500,
                  }}
                >
                  {segmentPercent.toFixed(1)}%
                </text>
              )
            })}

            {/* Needle - thicker at center, sharp point at end (triangle shape) */}
            <path
              d={needleTrianglePath}
              fill={Colors.main.default.gray1.rgb}
            />
            {/* Needle center circle - small black */}
            <circle cx={centerX} cy={centerY} r="6" fill={Colors.main.default.black.rgb} />
          </svg>

          {/* Custom hover tooltip */}
          {hoveredSegment && (
            <div
              style={{
                position: 'absolute',
                left: `${hoveredSegment.mouseX + 10}px`,
                top: `${hoveredSegment.mouseY - 40}px`,
                backgroundColor: Colors.main.default.black.rgb,
                color: Colors.dashboard.background.white.rgb,
                padding: '8px 12px',
                borderRadius: '0px',
                fontSize: '14px',
                pointerEvents: 'none',
                zIndex: 1000,
                whiteSpace: 'nowrap',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <div
                style={{
                  width: '12px',
                  height: '12px',
                  backgroundColor: hoveredSegment.color,
                  flexShrink: 0,
                }}
              />
              <span style={{ fontSize: '14px', color: Colors.dashboard.background.white.rgb }}>
                {hoveredSegment.name}: <span style={{ fontWeight: 700 }}>{hoveredSegment.percent.toFixed(1)}%</span>
              </span>
            </div>
          )}

          {/* Success rate and target - positioned below the gauge */}
          <div style={{ marginTop: '10px', textAlign: 'center' }}>
            <div style={{ 
              fontSize: '24px', // Half the size (was 48px)
              fontWeight: 700, 
              color: Colors.main.default.black.rgb, // Changed to black (was gray1)
              fontFamily: 'Roboto, sans-serif',
              lineHeight: '1.2',
              marginBottom: '8px'
            }}>
              {successRate.toFixed(0)}%
            </div>
            <p style={{ 
              fontSize: '14px', 
              color: Colors.main.default.gray2.rgb,
              fontFamily: 'Roboto, sans-serif',
              margin: 0
            }}>
              Target : {targetRate}%
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

