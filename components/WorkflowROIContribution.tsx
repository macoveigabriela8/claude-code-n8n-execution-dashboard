'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { getWorkflowROI } from '@/lib/supabase'
import { WorkflowROICalculated } from '@/types/supabase'
import { formatCurrency, formatHours } from '@/lib/utils'
import { Activity } from 'lucide-react'
import { Treemap, ResponsiveContainer, Cell } from 'recharts'

interface WorkflowROIContributionProps {
  clientId: string
}

import { TreemapColors, Colors } from '@/lib/design-tokens'

type ViewMode = 'revenue' | 'hours'

// Use colors from design-tokens (exact colors from Mokkup.ai design)
const COLORS = TreemapColors.map(color => color.rgb)

export default function WorkflowROIContribution({ clientId }: WorkflowROIContributionProps) {
  const [data, setData] = useState<WorkflowROICalculated[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('revenue')
  const [hoveredCell, setHoveredCell] = useState<{ name: string; value: number; color: string; mouseX: number; mouseY: number } | null>(null)
  const [containerRef, setContainerRef] = useState<HTMLDivElement | null>(null)
  const [isCardHovered, setIsCardHovered] = useState(false)
  const [containerWidth, setContainerWidth] = useState<number>(0)

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        const result = await getWorkflowROI(clientId)
        console.log('Workflow ROI data:', result)
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

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48 mb-4" />
          <Skeleton className="h-10 w-full" />
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

  if (data.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="rounded-full bg-muted p-3 mb-4">
            <Activity className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No Workflow ROI Data</h3>
          <p className="text-sm text-muted-foreground text-center max-w-md">
            No workflows have ROI configuration yet. Configure ROI parameters to see workflow contributions.
          </p>
        </CardContent>
      </Card>
    )
  }

  // Prepare treemap data based on view mode
  const treemapData = data
    .map((workflow, index) => {
      const workflowName = workflow.workflow_name || workflow.workflow_id || 'Unknown'
      let value = 0
      
      if (viewMode === 'revenue') {
        // Use labor_cost_saved OR value_created, whichever has a value
        value = workflow.value_created || workflow.labor_cost_saved || 0
      } else {
        // Convert minutes to hours
        value = (workflow.minutes_saved || 0) / 60
      }
      
      return {
        name: workflowName,
        value: Math.max(0, value), // Ensure non-negative
        color: COLORS[index % COLORS.length],
        workflow_id: workflow.workflow_id,
        // Store raw values for formatting in tooltip
        rawValue: value,
        labor_cost_saved: workflow.labor_cost_saved,
        value_created: workflow.value_created,
        minutes_saved: workflow.minutes_saved,
      }
    })
    .filter((item) => item.value > 0) // Only show workflows with positive values
    .sort((a, b) => b.value - a.value) // Sort by value descending

  // Debug logging
  console.log('Original workflow ROI data:', data)
  console.log('Treemap data after processing:', treemapData)
  console.log('View mode:', viewMode)
  console.log('Original data length:', data.length)
  console.log('Treemap data length:', treemapData.length)
  if (data.length > 0) {
    console.log('Sample workflow data:', data[0])
    console.log('Sample workflow - value_created:', data[0].value_created)
    console.log('Sample workflow - labor_cost_saved:', data[0].labor_cost_saved)
    console.log('Sample workflow - minutes_saved:', data[0].minutes_saved)
  }
  if (treemapData.length > 0) {
    console.log('Sample treemap item:', treemapData[0])
    console.log('Sample treemap item value:', treemapData[0].value)
    console.log('Sample treemap item name:', treemapData[0].name)
    console.log('Sample treemap item color:', treemapData[0].color)
  }

  const currency = data[0]?.currency_code || 'GBP'

  // Custom content component for treemap cells with hover tooltip
  // Note: viewMode and treemapData are captured via closure from the component scope
  const CustomContent = (props: any) => {
    const { x, y, width, height, root, depth, index } = props
    
    console.log('CustomContent props:', { x, y, width, height, root, depth, index, props })
    
    // Handle small cells
    if (width < 1 || height < 1) {
      return <g></g>
    }
    
    // Skip root node (depth 0)
    if (depth === 0) {
      return <g></g>
    }
    
    // In Recharts Treemap, the node data is passed differently
    // Try accessing from root.children or from the node itself
    const nodeData = root?.children?.[index] || root || props
    
    // Get data from node - the actual data item
    const name = nodeData?.name || 'Unknown'
    const value = nodeData?.value || 0
    const color = nodeData?.color || COLORS[index % COLORS.length] || Colors.dashboard.borders.light.hex
    const minutesSaved = nodeData?.minutes_saved || 0
    
    // Format display value based on view mode (for cell label)
    let displayValue: string
    if (viewMode === 'revenue') {
      // Format with currency symbol using formatCurrency
      displayValue = formatCurrency(value, currency)
    } else {
      // Format minutes: show "Xm" for < 60 minutes, "Xh Ym" for >= 60 minutes
      const minutes = Math.floor(minutesSaved)
      if (minutes === 0) {
        displayValue = '0m'
      } else if (minutes < 60) {
        displayValue = `${minutes}m`
      } else {
        const hours = Math.floor(minutes / 60)
        const mins = minutes % 60
        if (mins === 0) {
          displayValue = `${hours}h`
        } else {
          displayValue = `${hours}h ${mins}m`
        }
      }
    }

    // Calculate if text fits - estimate ~9px per character for fontSize 16, ~8px for fontSize 14
    const estimatedCharWidthName = 9
    const estimatedCharWidthValue = 8
    const fullText = `${name} (${displayValue})`
    const fullTextWidth = (name.length * estimatedCharWidthName) + (fullText.length - name.length) * estimatedCharWidthValue
    const availableWidth = width - 20
    
    // Check if full text fits on one line
    const fitsOnOneLine = fullTextWidth <= availableWidth && width > 120
    
    // If not fitting on one line, calculate truncated name for two-line layout
    const maxChars = Math.floor((width - 20) / estimatedCharWidthName)
    const displayName = maxChars > 0 && name.length > maxChars 
      ? name.substring(0, maxChars - 3) + '...' 
      : name

    const handleMouseMove = (e: React.MouseEvent<SVGGElement>) => {
      if (containerRef) {
        const rect = containerRef.getBoundingClientRect()
        const mouseX = e.clientX - rect.left
        const mouseY = e.clientY - rect.top
        setHoveredCell({ name, value, color, mouseX, mouseY })
      }
    }

    const handleMouseEnter = () => {
      // Cell is being hovered, but position will be set by onMouseMove
    }

    return (
      <g
        onMouseEnter={handleMouseEnter}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => {
          setHoveredCell(null)
        }}
        style={{ cursor: 'pointer' }}
      >
        <rect
          x={x}
          y={y}
          width={width}
          height={height}
          fill={color}
        />
        {width > 60 && height > 30 && (
          <>
            {fitsOnOneLine ? (
              <text
                x={x + width / 2}
                y={y + height / 2 + 5}
                textAnchor="middle"
                fill="#fff"
                fontSize={16}
                fontWeight="bold"
                className="pointer-events-none"
              >
                {fullText}
              </text>
            ) : (
              <>
                <text
                  x={x + width / 2}
                  y={y + height / 2 - 10}
                  textAnchor="middle"
                  fill="#fff"
                  fontSize={16}
                  fontWeight="bold"
                  className="pointer-events-none"
                >
                  {displayName}
                </text>
                <text
                  x={x + width / 2}
                  y={y + height / 2 + 12}
                  textAnchor="middle"
                  fill="#fff"
                  fontSize={14}
                  fontWeight="bold"
                  className="pointer-events-none"
                >
                  ({displayValue})
                </text>
              </>
            )}
          </>
        )}
      </g>
    )
  }

  return (
    <Card 
      style={{ 
        marginTop: '10px',
        border: isCardHovered ? `1px solid ${Colors.dashboard.text.primary.rgb}` : `1px solid ${Colors.dashboard.borders.light.rgb}`
      }}
      onMouseEnter={() => setIsCardHovered(true)}
      onMouseLeave={() => setIsCardHovered(false)}
    >
        <CardHeader style={{ padding: '20px 20px 5px' }}>
          <div className="flex items-center justify-between">
            <h4 style={{ 
              color: Colors.dashboard.text.primary.rgb,
              maxWidth: '579px',
              fontSize: 'calc(1.275rem + 0.3vw)', 
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
            }}>Workflow ROI Contribution</h4>
          <div className="flex gap-2" style={{ marginLeft: 'auto' }}>
            <button
              onClick={() => setViewMode('revenue')}
              style={{
                border: `1px solid ${viewMode === 'revenue' ? Colors.dashboard.text.primary.rgb : Colors.dashboard.borders.lighter.rgb}`,
                backgroundColor: viewMode === 'revenue' ? Colors.dashboard.text.primary.rgb : Colors.dashboard.background.white.rgb,
                color: viewMode === 'revenue' ? Colors.dashboard.header.text.rgb : Colors.dashboard.text.primary.rgb,
                padding: '6px 12px',
                fontSize: '12px',
                cursor: 'pointer',
                borderRadius: '4px',
              }}
            >
              Revenue Generated
            </button>
            <button
              onClick={() => setViewMode('hours')}
              style={{
                border: `1px solid ${viewMode === 'hours' ? 'rgb(13, 7, 106)' : 'rgb(232, 232, 232)'}`,
                backgroundColor: viewMode === 'hours' ? 'rgb(13, 7, 106)' : 'white',
                color: viewMode === 'hours' ? 'white' : 'rgb(13, 7, 106)',
                padding: '6px 12px',
                fontSize: '12px',
                cursor: 'pointer',
                borderRadius: '4px',
              }}
            >
              Hours Saved
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent style={{ padding: '20px' }}>
        {treemapData.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <p className="text-sm text-muted-foreground">
              No {viewMode === 'revenue' ? 'revenue' : 'hours'} data available for workflows.
            </p>
          </div>
        ) : (
          <>
            {/* Treemap Chart */}
            <div ref={setContainerRef} style={{ width: '100%', height: '400px', position: 'relative' }}>
              <ResponsiveContainer width="100%" height={400}>
                <Treemap
                  data={treemapData}
                  dataKey="value"
                  aspectRatio={4 / 3}
                  stroke="none"
                  fill={TreemapColors[0].hex}
                  content={CustomContent}
                  isAnimationActive={false}
                >
                  {treemapData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Treemap>
              </ResponsiveContainer>
              {/* Custom hover tooltip */}
              {hoveredCell && (() => {
                // Find the corresponding treemapData entry to get minutes_saved
                const hoveredDataEntry = treemapData.find(entry => entry.name === hoveredCell.name)
                const minutesSaved = hoveredDataEntry?.minutes_saved || 0
                
                // Format the tooltip value based on view mode
                let tooltipValue: string
                if (viewMode === 'revenue') {
                  tooltipValue = formatCurrency(hoveredCell.value, currency)
                } else {
                  // Format minutes: show "Xm" for < 60 minutes, "Xh Ym" for >= 60 minutes
                  const minutes = Math.floor(minutesSaved)
                  if (minutes === 0) {
                    tooltipValue = '0m'
                  } else if (minutes < 60) {
                    tooltipValue = `${minutes}m`
                  } else {
                    const hours = Math.floor(minutes / 60)
                    const mins = minutes % 60
                    if (mins === 0) {
                      tooltipValue = `${hours}h`
                    } else {
                      tooltipValue = `${hours}h ${mins}m`
                    }
                  }
                }
                
                // Calculate tooltip width (approximate based on content)
                const tooltipContent = `${hoveredCell.name}: ${tooltipValue}`
                const estimatedTooltipWidth = Math.min(500, Math.max(200, tooltipContent.length * 7 + 72)) // 7px per char + 24px padding (12px each side) + gap + icon
                
                // Position to the left of mouse cursor
                const tooltipLeft = hoveredCell.mouseX - estimatedTooltipWidth - 20
                
                // Ensure tooltip stays within container bounds
                const minLeft = 10
                const maxLeft = containerWidth > 0 ? containerWidth - estimatedTooltipWidth - 10 : hoveredCell.mouseX - estimatedTooltipWidth - 20
                const finalLeft = Math.max(minLeft, Math.min(tooltipLeft, maxLeft))
                
                // Calculate vertical position (ensure it stays within container)
                const tooltipTop = Math.max(10, Math.min(hoveredCell.mouseY - 40, 350)) // 350 is approximately container height - tooltip height
                
                return (
                  <div
                    style={{
                      position: 'absolute',
                      left: `${finalLeft}px`,
                      top: `${tooltipTop}px`,
                      backgroundColor: Colors.dashboard.background.white.rgb,
                      border: `1px solid ${Colors.dashboard.borders.lighter.rgb}`,
                      color: Colors.dashboard.text.primary.rgb,
                      padding: '12px',
                      borderRadius: '0px',
                      fontSize: '15px',
                      pointerEvents: 'none',
                      zIndex: 1000,
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      maxWidth: '500px',
                    }}
                  >
                    <div
                      style={{
                        width: '12px',
                        height: '12px',
                        backgroundColor: hoveredCell.color,
                        flexShrink: 0,
                      }}
                    />
                    <span style={{ 
                      fontSize: '15px', 
                      color: Colors.dashboard.text.primary.rgb,
                    }}>
                      {hoveredCell.name}:
                    </span>
                    <span style={{ 
                      fontSize: '15px', 
                      fontWeight: 700, 
                      color: Colors.dashboard.text.primary.rgb,
                      flexShrink: 0,
                    }}>
                      {tooltipValue}
                    </span>
                  </div>
                )
              })()}
            </div>
            {/* Legend */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '20px', width: '100%', maxWidth: '100%', alignItems: 'center', justifyContent: 'flex-start' }}>
              {treemapData.map((entry, index) => (
                <div key={entry.workflow_id || index} style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                  <div
                    style={{
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      backgroundColor: entry.color,
                      flexShrink: 0,
                    }}
                  />
                  <span style={{ fontSize: '14px', color: Colors.dashboard.text.primary.rgb, fontWeight: 400, whiteSpace: 'nowrap', lineHeight: 1.4 }}>
                    {entry.name}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

