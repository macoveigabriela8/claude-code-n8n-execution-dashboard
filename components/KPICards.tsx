'use client'

import { useEffect, useState, useCallback } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { getClientROISummary, getWorkflowROI, getClientData, getClientWorkflows, getWorkflowROIConfigs, getClientTools } from '@/lib/supabase'
import { ClientROISummary, WorkflowROICalculated, WorkflowROIConfig, ClientToolCost } from '@/types/supabase'
import { formatCurrency, getCurrencySymbol } from '@/lib/utils'
import { Colors } from '@/lib/design-tokens'
import KPICardsBreakdown from './KPICardsBreakdown'

interface KPICardProps {
  title: string
  value: string
  subtitle: string
  lineColor: string
}

interface KPICardsProps {
  clientId: string
}

export default function KPICards({ clientId }: KPICardsProps) {
  const [data, setData] = useState<ClientROISummary | null>(null)
  const [workflowData, setWorkflowData] = useState<WorkflowROICalculated[]>([])
  const [clientData, setClientData] = useState<any>(null)
  const [totalWorkflows, setTotalWorkflows] = useState<number>(0)
  const [roiConfigs, setRoiConfigs] = useState<WorkflowROIConfig[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Function to fetch all data (memoized to avoid dependency issues)
  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const [summary, workflows, client, allWorkflows, configs, tools] = await Promise.allSettled([
        getClientROISummary(clientId),
        getWorkflowROI(clientId),
        getClientData(clientId),
        getClientWorkflows(clientId),
        getWorkflowROIConfigs(clientId),
        getClientTools(clientId),
      ])
      
      // Handle results - use fulfilled values or defaults
      setData(summary.status === 'fulfilled' ? summary.value : null)
      setWorkflowData(workflows.status === 'fulfilled' ? workflows.value : [])
      const clientDataValue = client.status === 'fulfilled' ? client.value : null
      const toolsData = tools.status === 'fulfilled' ? tools.value : []
      // Combine client data with tool costs from the new table
      setClientData({
        ...clientDataValue,
        tool_costs: toolsData,
      })
      setTotalWorkflows(allWorkflows.status === 'fulfilled' ? allWorkflows.value.length : 0)
      setRoiConfigs(configs.status === 'fulfilled' ? configs.value : [])
      
      // Log any rejected promises
      if (summary.status === 'rejected') console.error('Failed to fetch ROI summary:', summary.reason)
      if (workflows.status === 'rejected') console.error('Failed to fetch workflow ROI:', workflows.reason)
      if (client.status === 'rejected') console.error('Failed to fetch client data:', client.reason)
      if (allWorkflows.status === 'rejected') console.error('Failed to fetch workflows:', allWorkflows.reason)
      if (configs.status === 'rejected') console.error('Failed to fetch ROI configs:', configs.reason)
    } catch (err) {
      console.error('Error loading ROI summary:', err)
      let errorMessage = 'Unknown error'
      if (err instanceof Error) {
        errorMessage = err.message
      } else if (err && typeof err === 'object' && 'message' in err) {
        errorMessage = String((err as any).message)
      } else if (err && typeof err === 'object' && 'details' in err) {
        errorMessage = String((err as any).details)
      } else {
        errorMessage = JSON.stringify(err)
      }
      setError(`Failed to load ROI summary: ${errorMessage}`)
    } finally {
      setLoading(false)
    }
  }, [clientId])

  // Fetch data on mount and when clientId changes
  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Refresh data when window gains focus (for real-time updates)
  useEffect(() => {
    const handleFocus = () => {
      fetchData()
    }

    window.addEventListener('focus', handleFocus)
    return () => {
      window.removeEventListener('focus', handleFocus)
    }
  }, [fetchData])

  if (loading) {
    return (
      <div className="grid gap-0" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginTop: '8px' }}>
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} style={{ border: `1px solid ${Colors.dashboard.borders.lighter.rgb}`, backgroundColor: Colors.dashboard.background.white.rgb, padding: '16px' }}>
            <Skeleton className="h-4 w-24 mb-3" />
            <Skeleton className="h-8 w-32 mb-2" />
            <Skeleton className="h-3 w-40" />
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ border: `1px solid ${Colors.dashboard.borders.lighter.rgb}`, backgroundColor: Colors.dashboard.background.white.rgb, padding: '16px' }}>
        <p style={{ color: Colors.main.default.red.hex }}>{error}</p>
      </div>
    )
  }

  if (!data) {
    return null
  }

  const currency = data.currency_code || 'GBP'
  const totalHoursSaved = data.total_hours_saved || 0
  const totalLaborCostSaved = data.total_labor_cost_saved || 0
  const totalValueCreated = data.total_value_created || 0
  const totalImplementationCosts = data.total_implementation_costs || 0
  const totalToolCosts = data.total_tool_costs || 0
  const workflowsCount = data.workflows_with_roi || 0

  // Format hours saved (convert to hours if stored as minutes)
  const hoursSaved = totalHoursSaved || (data.total_minutes_saved ? data.total_minutes_saved / 60 : 0)

  // Calculate total automation cost the same way as breakdown
  // Use automation cost and net ROI directly from database view (single source of truth)
  const totalAutomationCost = data.total_automation_cost || 0
  const netROI = data.net_roi || 0

  // Format currency in short format with 1 decimal: e.g., £7.5K or -£5.1K
  const formatCurrencyWithDecimal = (value: number, currencyCode: string) => {
    const symbol = getCurrencySymbol(currencyCode)
    const absValue = Math.abs(value)
    const sign = value < 0 ? '-' : ''
    if (absValue >= 1000) {
      const kValue = absValue / 1000
      return `${sign}${symbol}${kValue.toFixed(1)}K`
    }
    return `${sign}${symbol}${absValue.toFixed(1)}`
  }

  // Format currency with K suffix (for other KPIs)
  const formatCurrencyK = (value: number, currencyCode: string) => {
    const absValue = Math.abs(value)
    if (absValue >= 1000) {
      const formatted = formatCurrency(value / 1000, currencyCode).replace(/\.00$/, '')
      return formatted + 'K'
    }
    return formatCurrency(value, currencyCode)
  }

  const cardStyle = {
    border: `1px solid ${Colors.dashboard.borders.light.rgb}`,
    backgroundColor: Colors.dashboard.background.white.rgb,
    padding: '0px',
    textAlign: 'center' as const,
    boxSizing: 'border-box' as const,
    position: 'relative' as const,
    height: '100%',
    width: '100%',
    display: 'flex',
    flexDirection: 'column' as const,
    overflow: 'hidden' as const,
  }

  const titleStyle = {
    color: '#0D076A',
    fontSize: '14px',
    fontWeight: 700,
    margin: '0px 8px 10px',
    padding: '0px 2px',
    letterSpacing: '0.3px',
  }

  const valueStyle = {
    color: '#212529',
    fontSize: '32px',
    fontWeight: 900,
    margin: '0px 0px 10px',
    padding: 0,
    lineHeight: '1.2',
    letterSpacing: '0.5px',
  }

  const subtitleStyle = {
    color: '#9CA0A9',
    fontSize: '12px',
    fontWeight: 500,
    margin: '0px 0px 0px',
    padding: '0px 2px',
  }

  const lineStyle = (color: string) => ({
    backgroundColor: color,
    height: '4px',
    width: '100%',
    marginTop: 'auto',
    marginBottom: 0,
    position: 'absolute' as const,
    bottom: 0,
    left: 0,
    right: 0,
  })

  const innerContentStyle = {
    padding: '26px 22px',
  }

  const KPICard = ({ title, value, subtitle, lineColor, isHero, valueColor }: { title: string; value: string; subtitle: string; lineColor: string; isHero?: boolean; valueColor?: string }) => {
    const [isHovered, setIsHovered] = useState(false)
    
    // Calculate glow color from green accent - convert rgb(147, 191, 53) to rgba
    const heroCardStyle = isHero ? {
      boxShadow: '0 0 20px rgba(147, 191, 53, 0.15), 0 0 40px rgba(147, 191, 53, 0.1)',
    } : {}
    
    const shineStyle = isHero ? {
      position: 'absolute' as const,
      top: 0,
      width: '100%',
      height: '100%',
      background: 'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.6) 50%, transparent 100%)',
      pointerEvents: 'none' as const,
      zIndex: 1,
    } : {}
    
    const customValueStyle = valueColor ? {
      ...valueStyle,
      color: valueColor,
      fontSize: '35px', // Scaled: 44px * 0.8 = 35.2px -> 35px
      textShadow: '0 2px 4px rgba(0, 0, 0, 0.08)', // Subtle shadow for depth
      margin: '0px 0px 3px', // Scaled: 4px * 0.8 = 3.2px -> 3px
    } : valueStyle
    
    const customTitleStyle = isHero ? {
      ...titleStyle,
      fontSize: '16px', // Scaled: 20px * 0.8 = 16px
      margin: '0px 8px 6px', // Scaled: 10.5px * 0.8 = 8.4px -> 8px, 8px * 0.8 = 6.4px -> 6px
    } : titleStyle
    
    return (
      <div 
          style={{
            ...cardStyle,
            ...heroCardStyle,
            border: isHovered ? `1px solid ${Colors.dashboard.text.primary.rgb}` : cardStyle.border,
          }}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {isHero && <div className="kpi-hero-shine-element" style={shineStyle} />}
          <div style={{ ...innerContentStyle, position: 'relative' as const, zIndex: 2 }}>
            <h3 style={customTitleStyle}>{title}</h3>
            <p style={customValueStyle}>{value}</p>
            <div style={{ padding: 0 }}>
              <span style={subtitleStyle}>{subtitle}</span>
            </div>
          </div>
          <div style={lineStyle(lineColor)}></div>
        </div>
    )
  }

  return (
    <div style={{ marginTop: '8px' }}>
      <div className="grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
        {/* ROI */}
        <KPICard
          title="ROI"
          value={formatCurrencyWithDecimal(netROI, currency)}
          subtitle="since December 2025"
          lineColor={Colors.dashboard.kpi.accentGreen.rgb}
          isHero={true}
          valueColor={Colors.dashboard.kpi.accentGreen.rgb}
        />

        {/* Hours Saved */}
        <KPICard
          title="Hours Saved"
          value={`≈${Math.round(hoursSaved).toLocaleString()}h`}
          subtitle="since December 2025"
          lineColor={Colors.dashboard.kpi.accentGreen.rgb}
        />

        {/* Workflows Count */}
        <KPICard
          title="Workflows Count"
          value={workflowsCount.toString()}
          subtitle="since December 2025"
          lineColor={Colors.dashboard.kpi.accentGreen.rgb}
        />

        {/* Labor Cost Saved */}
        <KPICard
          title="Labor Cost Saved"
          value={formatCurrencyK(totalLaborCostSaved, currency)}
          subtitle="since December 2025"
          lineColor={Colors.dashboard.kpi.accentGreen.rgb}
        />

        {/* Value Created */}
        <KPICard
          title="Value Created"
          value={formatCurrencyK(totalValueCreated, currency)}
          subtitle="since December 2025"
          lineColor={Colors.dashboard.kpi.accentGreen.rgb}
        />

        {/* Automation Cost */}
        <KPICard
          title="Automation Cost "
          value={formatCurrencyWithDecimal(totalAutomationCost, currency)}
          subtitle="Implementation + Tools"
          lineColor={Colors.dashboard.kpi.accentRed.rgb}
        />
      </div>
      {data && Array.isArray(workflowData) && (
        <KPICardsBreakdown
          clientId={clientId}
          summaryData={data}
          workflowData={workflowData}
          clientData={clientData}
          totalWorkflows={totalWorkflows || 0}
          roiConfigs={Array.isArray(roiConfigs) ? roiConfigs : []}
        />
      )}
    </div>
  )
}
