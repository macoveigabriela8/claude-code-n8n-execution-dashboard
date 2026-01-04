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

  // Gauge dimensions - scaled to 80% (0.8)
  const width = 600
  const height = 320
  const centerX = width / 2
  const centerY = height - 8 // Scaled: 10 * 0.8 = 8
  const radius = 240 // Scaled: 300 * 0.8 = 240
  // Arc thickness scaled: 161.5 * 0.8 = 129.2px
  const innerRadius = radius - 129.2 // innerRadius = 110.8 (thickness = 129.2px)
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
  // Make needle extend 10% outside the arc: extend from radius to radius * 1.1, then reduce by 5%
  const needleLength = radius * 1.1 * 0.95
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

  // Label positions - positioned at consistent distance from arc edge
  // Use same radius-based approach as segment labels for consistency
  const labelOffset = 40 // Same offset as segment labels (radius + 40)
  // Single constant for label radius to ensure all labels are at exactly the same distance
  const labelRadius = radius + labelOffset
  const labelPositions: Array<{ percent: number; x: number; y: number; textAnchor?: "inherit" | "end" | "start" | "middle" }> = []
  
  // Calculate 0% position using angle-based positioning (consistent with segment labels)
  // Use same distance as segment labels, with "start" anchor to prevent clipping
  const angle0 = percentageToAngle(0)
  const angle0Rad = degToRad(angle0)
  const x0 = centerX + labelRadius * Math.cos(angle0Rad)
  const y0 = centerY - labelRadius * Math.sin(angle0Rad) // Negative to curve upward
  labelPositions.push({ percent: 0, x: x0, y: y0, textAnchor: 'start' })
  
  // For 2-3 segments, show middle labels above the arc (using consistent radius-based positioning)
  // Use proportional boundaries instead of equal segments
  if (segmentCount === 2 && segmentBoundaries.length > 2) {
    const midAngle = percentageToAngle(segmentBoundaries[1])
    const midAngleRad = degToRad(midAngle)
    const midX = centerX + labelRadius * Math.cos(midAngleRad)
    const midY = centerY - labelRadius * Math.sin(midAngleRad)
    labelPositions.push({ percent: segmentBoundaries[1], x: midX, y: midY })
  } else if (segmentCount === 3 && segmentBoundaries.length > 3) {
    const angle1 = percentageToAngle(segmentBoundaries[1])
    const angle1Rad = degToRad(angle1)
    const x1 = centerX + labelRadius * Math.cos(angle1Rad)
    const y1 = centerY - labelRadius * Math.sin(angle1Rad)
    labelPositions.push({ percent: segmentBoundaries[1], x: x1, y: y1 })
    
    const angle2 = percentageToAngle(segmentBoundaries[2])
    const angle2Rad = degToRad(angle2)
    const x2 = centerX + labelRadius * Math.cos(angle2Rad)
    const y2 = centerY - labelRadius * Math.sin(angle2Rad)
    labelPositions.push({ percent: segmentBoundaries[2], x: x2, y: y2 })
  }
  
  // Calculate 100% position using angle-based positioning (consistent with segment labels)
  // Use same distance as segment labels increased by 5%, with "end" anchor to prevent clipping
  const angle100 = percentageToAngle(100)
  const angle100Rad = degToRad(angle100)
  const labelRadius100 = labelRadius * 1.05 // Increase distance by 5% for 100% label
  const x100 = centerX + labelRadius100 * Math.cos(angle100Rad)
  const y100 = centerY - labelRadius100 * Math.sin(angle100Rad) // Negative to curve upward
  labelPositions.push({ percent: 100, x: x100, y: y100, textAnchor: 'end' })

  return (
    <Card 
      style={{ 
        marginTop: '0px',
        border: isCardHovered ? `1px solid ${Colors.dashboard.text.primary.rgb}` : undefined,
        height: '100%',
        display: 'flex',
        flexDirection: 'column'
      }}
      onMouseEnter={() => setIsCardHovered(true)}
      onMouseLeave={() => setIsCardHovered(false)}
    >
      <CardHeader style={{ padding: '20px 20px 5px', position: 'relative' }}>
        <h4 style={{ 
          color: Colors.dashboard.text.primary.rgb,
          maxWidth: '463px',
          fontSize: 'calc(1.02rem + 0.24vw)', 
          fontWeight: 500, 
          margin: 0, 
          padding: 0, 
          paddingRight: '144px',
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
          top: '11px',
          right: '8px',
          fontSize: '0.7rem',
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
      <CardContent style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div className="flex flex-col items-center justify-center" ref={setContainerRef} style={{ position: 'relative', width: '100%', maxWidth: '100%', overflow: 'visible', flex: 1, minHeight: 0 }}>
          <svg width="100%" height="320" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet" style={{ maxWidth: '100%' }}>
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
                textAnchor={label.textAnchor || "middle"}
                dominantBaseline="middle"
                style={{
                  fontSize: '11px',
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
              // Position label using the same labelRadius constant as all other labels
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
                    fontSize: '11px',
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
                fontSize: '11px',
                pointerEvents: 'none',
                zIndex: 1000,
                whiteSpace: 'nowrap',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <div
                style={{
                  width: '10px',
                  height: '10px',
                  backgroundColor: hoveredSegment.color,
                  flexShrink: 0,
                }}
              />
              <span style={{ fontSize: '11px', color: Colors.dashboard.background.white.rgb }}>
                {hoveredSegment.name}: <span style={{ fontWeight: 700 }}>{hoveredSegment.percent.toFixed(1)}%</span>
              </span>
            </div>
          )}

          {/* Success rate and target - positioned below the gauge */}
          <div style={{ marginTop: '8px', textAlign: 'center', paddingBottom: '4px', overflow: 'visible' }}>
            <div style={{ 
              fontSize: '19px', // Scaled: 24px * 0.8 = 19.2px -> 19px
              fontWeight: 700, 
              color: Colors.main.default.black.rgb, // Changed to black (was gray1)
              fontFamily: 'Roboto, sans-serif',
              lineHeight: '1.2',
              marginBottom: '6px',
              overflow: 'visible',
              whiteSpace: 'nowrap'
            }}>
              {successRate.toFixed(0)}%
            </div>
            <p style={{ 
              fontSize: '11px', 
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

