'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { ChevronDown } from 'lucide-react'
import { formatCurrency, formatPeriodDisplay, formatDate } from '@/lib/utils'
import { Colors } from '@/lib/design-tokens'
import { ClientROISummary, WorkflowROICalculated, ClientToolCost, WorkflowROIConfig } from '@/types/supabase'

interface KPICardsBreakdownProps {
  clientId: string
  summaryData: ClientROISummary
  workflowData: WorkflowROICalculated[]
  clientData: {
    initial_setup_fee?: number | null
    tool_costs?: ClientToolCost[]
  } | null
  totalWorkflows: number
  roiConfigs: WorkflowROIConfig[]
}

export default function KPICardsBreakdown({
  clientId,
  summaryData,
  workflowData,
  clientData,
  totalWorkflows,
  roiConfigs,
}: KPICardsBreakdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isHeaderHovered, setIsHeaderHovered] = useState(false)

  const currency = summaryData.currency_code || 'GBP'
  const initialSetupFee = clientData?.initial_setup_fee || 0
  const toolCosts = clientData?.tool_costs || []
  
  // Create a map of workflow_id to ROI config for quick lookup
  const configMap = new Map((roiConfigs || []).map(config => [config.workflow_id, config]))
  
  // Find earliest deployment date from workflows (database uses this, not tool.start_date)
  const earliestDeploymentDate = workflowData.length > 0 
    ? workflowData
        .map(w => w.deployment_date ? new Date(w.deployment_date) : null)
        .filter(d => d !== null)
        .sort((a, b) => (a?.getTime() || 0) - (b?.getTime() || 0))[0]
    : null

  // Calculate months since earliest deployment (for formula display)
  const getMonthsSinceDeployment = (): number => {
    if (!earliestDeploymentDate) return 0
    const now = new Date()
    return Math.max(0, (now.getFullYear() - earliestDeploymentDate.getFullYear()) * 12 + (now.getMonth() - earliestDeploymentDate.getMonth()) + 1)
  }

  // Calculate total tool costs per period (using start_date if available, otherwise earliest deployment_date, matching database logic)
  const calculateToolCostSinceStart = (tool: ClientToolCost): number => {
    // For one-time fees, just return the cost (already allocated in database)
    if (tool.recurring === false && tool.end_date) {
      // One-time fees: return the total cost (database already allocates per workflow)
      const now = new Date()
      const endDate = new Date(tool.end_date)
      // Only apply if end_date is in the past (fee has been incurred)
      if (now >= endDate) {
        return parseFloat(tool.cost.toString())
      }
      return 0
    }
    
    // For recurring tools, use start_date if available, otherwise fall back to earliest deployment date
    const baseDate = tool.start_date ? new Date(tool.start_date) : earliestDeploymentDate
    if (!baseDate) return 0
    
    const now = new Date()
    // Calculate months since base date
    // For monthly: include partial month (+1), for others: exact months
    const yearsDiff = now.getFullYear() - baseDate.getFullYear()
    const monthsDiff = now.getMonth() - baseDate.getMonth()
    const monthsSinceStart = yearsDiff * 12 + monthsDiff
    
    const cost = parseFloat(tool.cost.toString())
    
    switch (tool.period) {
      case 'monthly':
        // Monthly: charge per month since start (charge only for complete months)
        return cost * Math.max(0, monthsSinceStart)
      case 'quarterly':
        // Quarterly: charge per complete quarter
        return cost * Math.max(0, Math.floor((monthsSinceStart + 1) / 3))
      case 'yearly':
        // Yearly: charge full year immediately, then accumulate each year
        return cost * Math.max(1, Math.floor((monthsSinceStart + 1) / 12))
      case '24months':
        // 24months: charge per complete 24-month period
        return cost * Math.max(0, Math.floor((monthsSinceStart + 1) / 24))
      default:
        return 0
    }
  }

  // Helper component for tooltip icon
  const TooltipIcon = ({ content }: { content: React.ReactNode }) => (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '14px',
            height: '14px',
            borderRadius: '50%',
            border: `1px solid ${Colors.main.default.gray2.rgb}`,
            backgroundColor: 'transparent',
            cursor: 'pointer',
            padding: 0,
            flexShrink: 0,
          }}
        >
          <span style={{ 
            color: Colors.main.default.gray2.rgb,
            fontSize: '10px',
            fontWeight: 600,
            lineHeight: '1',
            display: 'block',
          }}>?</span>
        </button>
      </TooltipTrigger>
      <TooltipContent side="top" style={{ maxWidth: '400px', fontSize: '12px' }}>
        {typeof content === 'string' ? (
          <div style={{ 
            fontSize: '12px', 
            lineHeight: '1.6',
            whiteSpace: 'pre-line',
            textAlign: 'left'
          }}>
            {content}
          </div>
        ) : (
          <div style={{ fontSize: '12px', lineHeight: '1.8' }}>
            {content}
          </div>
        )}
      </TooltipContent>
    </Tooltip>
  )

  // Placeholder for consistent spacing when no tooltip is present
  const TooltipPlaceholder = () => (
    <div style={{ width: '14px', height: '14px', flexShrink: 0 }} />
  )

  // Helper function to get detailed formula for a workflow (extremely detailed for new employees)
  const getFormula = (workflow: WorkflowROICalculated): string => {
    const config = configMap.get(workflow.workflow_id)
    if (!config) return ''
    
    const manualMinutesSaved = config.manual_minutes_saved || 0
    const hourlyRate = config.hourly_rate || 0
    
    // Use config.roi_type if available, otherwise fall back to workflow.roi_type
    const roiType = config.roi_type || workflow.roi_type
    
    if (roiType === 'per_execution') {
      const executions = workflow.successful_executions || 0
      if (executions > 0 && manualMinutesSaved > 0 && hourlyRate > 0) {
        const totalMinutes = executions * manualMinutesSaved
        const totalHours = totalMinutes / 60
        const totalCost = totalHours * hourlyRate
        
        return `Time saved per execution: ${manualMinutesSaved} minutes\n` +
               `Hourly labor rate: ${formatCurrency(hourlyRate, currency)} per hour\n` +
               `Convert minutes to hours: ÷ 60 minutes\n` +
               `Number of successful executions: ${executions} execution${executions !== 1 ? 's' : ''}\n\n` +
               `Calculation:\n` +
               `${executions} execution${executions !== 1 ? 's' : ''} × ${manualMinutesSaved} min = ${totalMinutes} minutes\n` +
               `${totalMinutes} min ÷ 60 = ${totalHours.toFixed(2)} hours\n` +
               `${totalHours.toFixed(2)} hours × ${formatCurrency(hourlyRate, currency)}/hour = ${formatCurrency(totalCost, currency)}`
      }
    } else if (roiType === 'recurring_task') {
      const days = workflow.days_since_deployment || 0
      const frequency = config.frequency || ''
      const occurrences = config.occurrences_per_frequency || 1
      
      if (manualMinutesSaved > 0 && hourlyRate > 0) {
        let frequencyText = ''
        let occurrencesText = ''
        let timeSinceDeploymentText = ''
        let totalOccurrences = 0
        let totalMinutes = 0
        let totalHours = 0
        let totalCost = 0
        
        if (frequency === 'daily') {
          frequencyText = 'day'
          timeSinceDeploymentText = `${days} day${days !== 1 ? 's' : ''} since workflow deployment`
          totalOccurrences = days * occurrences
          totalMinutes = totalOccurrences * manualMinutesSaved
          totalHours = totalMinutes / 60
          totalCost = totalHours * hourlyRate
          occurrencesText = `${days} day${days !== 1 ? 's' : ''} × ${occurrences} occurrence${occurrences !== 1 ? 's' : ''} per day = ${totalOccurrences} total occurrence${totalOccurrences !== 1 ? 's' : ''}`
        } else if (frequency === 'weekly') {
          frequencyText = 'week'
          const weeksFractional = days / 7.0
          const weeksRounded = Math.round(weeksFractional * 100) / 100
          timeSinceDeploymentText = `${days} day${days !== 1 ? 's' : ''} since workflow deployment (${weeksRounded.toFixed(2)} weeks)`
          totalOccurrences = weeksFractional * occurrences
          totalMinutes = totalOccurrences * manualMinutesSaved
          totalHours = totalMinutes / 60
          totalCost = totalHours * hourlyRate
          occurrencesText = `${weeksRounded.toFixed(2)} weeks × ${occurrences} occurrence${occurrences !== 1 ? 's' : ''} per week = ${totalOccurrences.toFixed(2)} total occurrence${totalOccurrences !== 1 ? 's' : ''}`
        } else if (frequency === 'monthly') {
          frequencyText = 'month'
          const monthsFractional = days / 30.44
          const monthsRounded = Math.round(monthsFractional * 100) / 100
          timeSinceDeploymentText = `${days} day${days !== 1 ? 's' : ''} since workflow deployment (${monthsRounded.toFixed(2)} months)`
          totalOccurrences = monthsFractional * occurrences
          totalMinutes = totalOccurrences * manualMinutesSaved
          totalHours = totalMinutes / 60
          totalCost = totalHours * hourlyRate
          occurrencesText = `${monthsRounded.toFixed(2)} months × ${occurrences} occurrence${occurrences !== 1 ? 's' : ''} per month = ${totalOccurrences.toFixed(2)} total occurrence${totalOccurrences !== 1 ? 's' : ''}`
        } else if (frequency === 'quarterly') {
          frequencyText = 'quarter'
          const quartersFractional = days / 91.25
          const quartersRounded = Math.round(quartersFractional * 100) / 100
          timeSinceDeploymentText = `${days} day${days !== 1 ? 's' : ''} since workflow deployment (${quartersRounded.toFixed(2)} quarters)`
          totalOccurrences = quartersFractional * occurrences
          totalMinutes = totalOccurrences * manualMinutesSaved
          totalHours = totalMinutes / 60
          totalCost = totalHours * hourlyRate
          occurrencesText = `${quartersRounded.toFixed(2)} quarters × ${occurrences} occurrence${occurrences !== 1 ? 's' : ''} per quarter = ${totalOccurrences.toFixed(2)} total occurrence${totalOccurrences !== 1 ? 's' : ''}`
        }
        
        if (frequencyText) {
          return `Manual work pattern: ${occurrences} time${occurrences !== 1 ? 's' : ''} per ${frequencyText}\n` +
                 `Time saved per occurrence: ${manualMinutesSaved} minutes\n` +
                 `Hourly labor rate: ${formatCurrency(hourlyRate, currency)} per hour\n` +
                 `Convert minutes to hours: ÷ 60 minutes\n` +
                 `${timeSinceDeploymentText}\n\n` +
                 `${occurrencesText}\n\n` +
                 `Calculation:\n` +
                 `${totalOccurrences.toFixed(2)} occurrence${totalOccurrences !== 1 ? 's' : ''} × ${manualMinutesSaved} min = ${totalMinutes.toFixed(2)} minutes\n` +
                 `${totalMinutes.toFixed(2)} min ÷ 60 = ${totalHours.toFixed(2)} hours\n` +
                 `${totalHours.toFixed(2)} hours × ${formatCurrency(hourlyRate, currency)}/hour = ${formatCurrency(totalCost, currency)}`
        }
      }
    } else if (roiType === 'new_capability') {
      const days = workflow.days_since_deployment || 0
      const frequency = config.frequency || ''
      const valuePerFrequency = config.value_per_frequency || 0
      
      // Check if this is frequency-based (new method) or execution-based (legacy)
      if (frequency && valuePerFrequency > 0) {
        // Frequency-based calculation
        let frequencyText = ''
        let timeSinceDeploymentText = ''
        let periodsFractional = 0
        let totalValue = 0
        
        if (frequency === 'daily') {
          frequencyText = 'day'
          timeSinceDeploymentText = `${days} day${days !== 1 ? 's' : ''} since workflow deployment`
          periodsFractional = days
          totalValue = days * valuePerFrequency
        } else if (frequency === 'weekly') {
          frequencyText = 'week'
          const weeksFractional = days / 7.0
          const weeksRounded = Math.round(weeksFractional * 100) / 100
          timeSinceDeploymentText = `${days} day${days !== 1 ? 's' : ''} since workflow deployment (${weeksRounded.toFixed(2)} weeks)`
          periodsFractional = weeksFractional
          totalValue = weeksFractional * valuePerFrequency
        } else if (frequency === 'monthly') {
          frequencyText = 'month'
          const monthsFractional = days / 30.44
          const monthsRounded = Math.round(monthsFractional * 100) / 100
          timeSinceDeploymentText = `${days} day${days !== 1 ? 's' : ''} since workflow deployment (${monthsRounded.toFixed(2)} months)`
          periodsFractional = monthsFractional
          totalValue = monthsFractional * valuePerFrequency
        } else if (frequency === 'quarterly') {
          frequencyText = 'quarter'
          const quartersFractional = days / 91.25
          const quartersRounded = Math.round(quartersFractional * 100) / 100
          timeSinceDeploymentText = `${days} day${days !== 1 ? 's' : ''} since workflow deployment (${quartersRounded.toFixed(2)} quarters)`
          periodsFractional = quartersFractional
          totalValue = quartersFractional * valuePerFrequency
        }
        
        if (frequencyText) {
          return `Value generation pattern: ${formatCurrency(valuePerFrequency, currency)} per ${frequencyText}\n` +
                 `${timeSinceDeploymentText}\n\n` +
                 `Calculation:\n` +
                 `${periodsFractional.toFixed(2)} ${frequencyText}${periodsFractional !== 1 ? 's' : ''} × ${formatCurrency(valuePerFrequency, currency)}/${frequencyText} = ${formatCurrency(totalValue, currency)}`
        }
      } else {
        // Execution-based calculation (legacy/backward compatibility)
        const executions = workflow.successful_executions || 0
        const clientsPerReport = config.clients_per_report || 0
        const reactivationRate = config.reactivation_rate_percent || 0
        const valuePerClient = config.value_per_client || 0
        const valuePerExecution = config.value_per_execution || 0
        
        if (clientsPerReport > 0 && reactivationRate > 0 && valuePerClient > 0) {
          // Conversion-based pattern
          const totalClients = executions * clientsPerReport
          const convertedClients = totalClients * (reactivationRate / 100.0)
          const totalValue = convertedClients * valuePerClient
          
          return `Items per execution: ${clientsPerReport}\n` +
                 `Conversion rate: ${reactivationRate}%\n` +
                 `Value per converted item: ${formatCurrency(valuePerClient, currency)}\n` +
                 `Number of successful executions: ${executions} execution${executions !== 1 ? 's' : ''}\n\n` +
                 `Calculation:\n` +
                 `${executions} execution${executions !== 1 ? 's' : ''} × ${clientsPerReport} items = ${totalClients} total items\n` +
                 `${totalClients} items × ${reactivationRate}% = ${convertedClients.toFixed(2)} converted items\n` +
                 `${convertedClients.toFixed(2)} items × ${formatCurrency(valuePerClient, currency)} = ${formatCurrency(totalValue, currency)}`
        } else if (valuePerExecution > 0 && executions > 0) {
          // Simple value per execution
          const totalValue = executions * valuePerExecution
          
          return `Value per execution: ${formatCurrency(valuePerExecution, currency)}\n` +
                 `Number of successful executions: ${executions} execution${executions !== 1 ? 's' : ''}\n\n` +
                 `Calculation:\n` +
                 `${executions} execution${executions !== 1 ? 's' : ''} × ${formatCurrency(valuePerExecution, currency)} = ${formatCurrency(totalValue, currency)}`
        }
      }
    }
    return ''
  }

  // Separate one-time fees (setup fees) from recurring tools
  // One-time fees (recurring = false) go to Implementation Costs section
  const oneTimeFeeTools = toolCosts.filter(tool => tool.recurring === false)
    .sort((a, b) => (a.tool || '').localeCompare(b.tool || ''))
  
  // Separate common costs (database, hosting, supabase, LLM Tokens) from other tools
  // Include all tools even if cost is 0 (for future paid plans)
  // Only recurring tools (recurring = true) go to Tools section
  const commonCostTools = toolCosts.filter(tool => 
    tool.recurring === true && ( // Only recurring tools
      tool.tool?.toLowerCase().includes('database') || 
      tool.tool?.toLowerCase().includes('hosting') ||
      tool.tool?.toLowerCase().includes('supabase') ||
      tool.tool?.toLowerCase().includes('llm tokens')
    )
  ).sort((a, b) => (a.tool || '').localeCompare(b.tool || ''))
  const otherTools = toolCosts.filter(tool => 
    tool.recurring === true && ( // Only recurring tools
      !tool.tool?.toLowerCase().includes('database') && 
      !tool.tool?.toLowerCase().includes('hosting') &&
      !tool.tool?.toLowerCase().includes('supabase') &&
      !tool.tool?.toLowerCase().includes('llm tokens')
    )
  ).sort((a, b) => (a.tool || '').localeCompare(b.tool || ''))

  // Debug logging for tool costs
  console.log('Tool costs received:', toolCosts)
  console.log('Common cost tools (recurring + keywords):', commonCostTools)
  console.log('Other tools (recurring, no keywords):', otherTools)

  const laborCostWorkflows = workflowData.filter(w => w.labor_cost_saved && w.labor_cost_saved > 0)
    .sort((a, b) => {
      const nameA = (a.workflow_name || a.workflow_id || '').toLowerCase()
      const nameB = (b.workflow_name || b.workflow_id || '').toLowerCase()
      return nameA.localeCompare(nameB)
    })
  const valueCreatedWorkflows = workflowData.filter(w => w.value_created && w.value_created > 0)
    .sort((a, b) => {
      const nameA = (a.workflow_name || a.workflow_id || '').toLowerCase()
      const nameB = (b.workflow_name || b.workflow_id || '').toLowerCase()
      return nameA.localeCompare(nameB)
    })
  const implementationCostWorkflows = workflowData.filter(w => (w.implementation_cost_applied || w.implementation_cost || 0) > 0)
  
  // Combine implementation cost workflows and one-time fees, then sort alphabetically
  const allDevelopmentItems = [
    ...implementationCostWorkflows.map(w => ({
      type: 'workflow' as const,
      id: w.workflow_id,
      name: w.workflow_name || w.workflow_id || '',
      cost: w.implementation_cost_applied || w.implementation_cost || 0,
      workflow: w
    })),
    ...oneTimeFeeTools.map(tool => ({
      type: 'tool' as const,
      id: tool.tool,
      name: tool.tool,
      cost: parseFloat(tool.cost.toString()),
      tool: tool
    }))
  ].sort((a, b) => {
    const nameA = a.name.toLowerCase()
    const nameB = b.name.toLowerCase()
    return nameA.localeCompare(nameB)
  })

  return (
    <TooltipProvider delayDuration={200}>
      <div style={{ marginTop: '8px' }}>
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          {/* Integrated section header with breakdown toggle */}
          <CollapsibleTrigger asChild>
            <div 
              style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginTop: 0,
                marginBottom: isOpen ? '13px' : '0px',
                backgroundColor: isHeaderHovered ? Colors.dashboard.header.background.rgb : '#F5F5F5',
                padding: '10px 16px',
                transition: 'background-color 0.2s, color 0.2s',
                cursor: 'pointer',
              }}
              onMouseEnter={() => setIsHeaderHovered(true)}
              onMouseLeave={() => setIsHeaderHovered(false)}
            >
              <h3 style={{
                color: isHeaderHovered ? Colors.dashboard.header.text.rgb : Colors.dashboard.text.primary.rgb,
                fontSize: '11px',
                fontWeight: 600,
                margin: 0,
                padding: 0,
              }}>
                View Details
              </h3>
              <ChevronDown 
                className="h-5 w-5" 
                style={{ 
                  transform: isOpen ? 'rotate(180deg)' : 'none',
                  color: isHeaderHovered ? Colors.dashboard.header.text.rgb : Colors.dashboard.text.primary.rgb,
                  transition: 'transform 0.2s, color 0.2s',
                }} 
              />
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div style={{
              borderTop: `1px solid ${Colors.dashboard.borders.light.rgb}`,
              borderBottom: `1px solid ${Colors.dashboard.borders.light.rgb}`,
              backgroundColor: Colors.dashboard.background.white.rgb,
              padding: '13px',
            }}>
              <Card style={{ border: 'none', backgroundColor: 'transparent', boxShadow: 'none' }}>
                <CardContent className="p-0" style={{ padding: 0 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  
                  {/* ROI */}
                  {(() => {
                    const totalAutomationCostBreakdown = 
                      implementationCostWorkflows.reduce((sum, w) => sum + (w.implementation_cost_applied || w.implementation_cost || 0), 0) +
                      (oneTimeFeeTools.reduce((sum, tool) => sum + parseFloat(tool.cost.toString()), 0)) +
                      ([...commonCostTools, ...otherTools].reduce((sum, tool) => sum + calculateToolCostSinceStart(tool), 0))
                    
                    const totalBenefits = (summaryData.total_labor_cost_saved || 0) + (summaryData.total_value_created || 0)
                    const calculatedROI = totalBenefits - totalAutomationCostBreakdown

                    // Build ROI formula for tooltip (3 rows)
                    const roiFormulaTooltip = `ROI = (Labor Cost Saved + Value Created) - Automation Cost\n= (${formatCurrency(summaryData.total_labor_cost_saved || 0, currency)} + ${formatCurrency(summaryData.total_value_created || 0, currency)}) - ${formatCurrency(totalAutomationCostBreakdown, currency)}\n= ${formatCurrency(calculatedROI, currency)}`

                    return (
                      <Card style={{ 
                        border: 'none',
                        borderRadius: '8px',
                        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04)',
                        backgroundColor: '#FFFFFF'
                      }}>
                        <CardHeader 
                          className=""
                          style={{ 
                            padding: '5px 16px', 
                            borderBottom: `1px solid rgba(0, 0, 0, 0.06)`,
                            display: 'flex',
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            backgroundColor: 'rgba(0, 0, 0, 0.02)'
                          }}>
                          <h4 style={{
                            color: 'rgba(13, 7, 106, 0.9)', 
                            fontSize: '15px', 
                            fontWeight: 600,
                            letterSpacing: '-0.01em',
                            margin: 0,
                            padding: 0,
                            lineHeight: '1.4',
                            textTransform: 'uppercase',
                            textAlign: 'left',
                            display: 'block',
                            width: 'auto',
                            marginRight: 'auto'
                          }}>
                            RETURN ON INVESTMENT
                          </h4>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 'auto' }}>
                            <span style={{ 
                              fontSize: '15px', 
                              fontWeight: 600, 
                              color: Colors.main.default.green.hex,
                              textAlign: 'right',
                              minWidth: '64px'
                            }}>
                              {formatCurrency(calculatedROI, currency)}
                            </span>
                            <TooltipIcon content={roiFormulaTooltip} />
                          </div>
                        </CardHeader>
                        <CardContent style={{ padding: '13px 16px' }}>
                          {/* Labor Cost Saved Sub-section */}
                          {(summaryData.total_labor_cost_saved || 0) > 0 && (
                            <div style={{ marginBottom: (summaryData.total_value_created || 0) > 0 ? '20px' : '0' }}>
                              <div style={{
                                padding: '6px 0',
                                marginBottom: '6px',
                                borderBottom: '1px solid rgba(0, 0, 0, 0.04)',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                              }}>
                                <h5 style={{ 
                                  color: 'rgba(13, 7, 106, 0.95)', 
                                  fontSize: '12px', 
                                  fontWeight: 600,
                                  letterSpacing: '-0.01em',
                                  margin: 0,
                                  padding: 0,
                                  lineHeight: '1.5',
                                  textTransform: 'uppercase',
                                  textAlign: 'left'
                                }}>
                                  LABOR COST SAVED
                                </h5>
                                {laborCostWorkflows.length > 0 && (() => {
                                  const subtotal = laborCostWorkflows.reduce((sum, w) => sum + (w.labor_cost_saved || 0), 0)
                                  return (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                      <span style={{
                                        fontSize: '12px',
                                        fontWeight: 600,
                                        color: 'rgb(156, 160, 169)',
                                        marginRight: '4px'
                                      }}>
                                        Subtotal:
                                      </span>
                                      <span style={{
                                        fontSize: '14px',
                                        fontWeight: 600,
                                        color: Colors.main.default.green.hex,
                                        textAlign: 'right',
                                        minWidth: '64px'
                                      }}>
                                        {formatCurrency(subtotal, currency)}
                                      </span>
                                      <TooltipPlaceholder />
                                    </div>
                                  )
                                })()}
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                {laborCostWorkflows.map((workflow, index) => {
                                  const cost = workflow.labor_cost_saved || 0
                                  const formula = getFormula(workflow)
                                  
                                  return (
                                    <div
                                      key={workflow.workflow_id}
                                      style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        padding: '10px 13px 10px 26px',
                                        margin: '-10px -13px',
                                        borderRadius: '6px',
                                        transition: 'background-color 0.15s ease',
                                        cursor: 'default',
                                        backgroundColor: 'transparent'
                                      }}
                                      onMouseEnter={(e) => {
                                        e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.02)'
                                      }}
                                      onMouseLeave={(e) => {
                                        e.currentTarget.style.backgroundColor = 'transparent'
                                      }}
                                    >
                                      <span style={{ 
                                        color: 'rgba(13, 7, 106, 0.95)', 
                                        fontSize: '13px', 
                                        fontWeight: 400,
                                        lineHeight: '1.5',
                                        textAlign: 'left'
                                      }}>
                                        {workflow.workflow_name || workflow.workflow_id}
                                      </span>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span style={{ 
                                          fontSize: '13px', 
                                          fontWeight: 600, 
                                          lineHeight: '1.5',
                                          color: Colors.main.default.green.hex,
                                          textAlign: 'right',
                                          minWidth: '64px'
                                        }}>
                                          {formatCurrency(cost, currency)}
                                        </span>
                                        {formula ? <TooltipIcon content={formula} /> : <TooltipPlaceholder />}
                                      </div>
                                    </div>
                                  )
                                })}
                              </div>
                            </div>
                          )}

                          {/* Value Created Sub-section */}
                          {(summaryData.total_value_created || 0) > 0 && (
                            <div>
                              <div style={{
                                padding: '6px 0',
                                marginBottom: '6px',
                                borderBottom: '1px solid rgba(0, 0, 0, 0.04)',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                              }}>
                                <h5 style={{ 
                                  color: 'rgba(13, 7, 106, 0.95)', 
                                  fontSize: '12px', 
                                  fontWeight: 600,
                                  letterSpacing: '-0.01em',
                                  margin: 0,
                                  padding: 0,
                                  lineHeight: '1.5',
                                  textTransform: 'uppercase',
                                  textAlign: 'left'
                                }}>
                                  VALUE CREATED
                                </h5>
                                {valueCreatedWorkflows.length > 0 && (() => {
                                  const subtotal = valueCreatedWorkflows.reduce((sum, w) => sum + (w.value_created || 0), 0)
                                  return (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                      <span style={{
                                        fontSize: '12px',
                                        fontWeight: 600,
                                        color: 'rgb(156, 160, 169)',
                                        marginRight: '4px'
                                      }}>
                                        Subtotal:
                                      </span>
                                      <span style={{
                                        fontSize: '14px',
                                        fontWeight: 600,
                                        color: Colors.main.default.green.hex,
                                        textAlign: 'right',
                                        minWidth: '64px'
                                      }}>
                                        {formatCurrency(subtotal, currency)}
                                      </span>
                                      <TooltipPlaceholder />
                                    </div>
                                  )
                                })()}
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                {valueCreatedWorkflows.map((workflow, index) => {
                                  const cost = workflow.value_created || 0
                                  const formula = getFormula(workflow)
                                  
                                  return (
                                    <div
                                      key={workflow.workflow_id}
                                      style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        padding: '10px 13px 10px 26px',
                                        margin: '-10px -13px',
                                        borderRadius: '6px',
                                        transition: 'background-color 0.15s ease',
                                        cursor: 'default',
                                        backgroundColor: 'transparent'
                                      }}
                                      onMouseEnter={(e) => {
                                        e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.02)'
                                      }}
                                      onMouseLeave={(e) => {
                                        e.currentTarget.style.backgroundColor = 'transparent'
                                      }}
                                    >
                                      <span style={{ 
                                        color: 'rgba(13, 7, 106, 0.95)', 
                                        fontSize: '13px', 
                                        fontWeight: 400,
                                        lineHeight: '1.5',
                                        textAlign: 'left'
                                      }}>
                                        {workflow.workflow_name || workflow.workflow_id}
                                      </span>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span style={{ 
                                          fontSize: '13px', 
                                          fontWeight: 600, 
                                          lineHeight: '1.5',
                                          color: Colors.main.default.green.hex,
                                          textAlign: 'right',
                                          minWidth: '64px'
                                        }}>
                                          {formatCurrency(cost, currency)}
                                        </span>
                                        {formula ? (
                                          <TooltipIcon content={formula} />
                                        ) : (
                                          <TooltipPlaceholder />
                                        )}
                                      </div>
                                    </div>
                                  )
                                })}
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )
                  })()}

                  {/* Automation Cost */}
                  {(() => {
                    const totalDevelopmentCost = implementationCostWorkflows.reduce((sum, w) => sum + (w.implementation_cost_applied || w.implementation_cost || 0), 0) +
                      (oneTimeFeeTools.reduce((sum, tool) => sum + parseFloat(tool.cost.toString()), 0))
                    const totalToolsCost = [...commonCostTools, ...otherTools].reduce((sum, tool) => sum + calculateToolCostSinceStart(tool), 0)
                    const totalAutomationCost = totalDevelopmentCost + totalToolsCost

                    return (
                      <Card style={{ 
                        border: 'none',
                        borderRadius: '8px',
                        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04)',
                        backgroundColor: '#FFFFFF'
                      }}>
                        <CardHeader 
                          className=""
                          style={{ 
                            padding: '5px 16px', 
                            borderBottom: `1px solid rgba(0, 0, 0, 0.06)`,
                            display: 'flex',
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            backgroundColor: 'rgba(0, 0, 0, 0.02)'
                          }}>
                          <h4 style={{
                            color: 'rgba(13, 7, 106, 0.9)', 
                            fontSize: '15px', 
                            fontWeight: 600,
                            letterSpacing: '-0.01em',
                            margin: 0,
                            padding: 0,
                            lineHeight: '1.4',
                            textTransform: 'uppercase',
                            textAlign: 'left',
                            display: 'block',
                            width: 'auto',
                            marginRight: 'auto'
                          }}>
                            AUTOMATION COST
                          </h4>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 'auto' }}>
                            <span style={{ 
                              fontSize: '15px', 
                              fontWeight: 600, 
                              color: Colors.main.default.red.hex,
                              textAlign: 'right',
                              minWidth: '64px'
                            }}>
                              {formatCurrency(totalAutomationCost, currency)}
                            </span>
                            <TooltipPlaceholder />
                          </div>
                        </CardHeader>
                        <CardContent style={{ padding: '13px 16px' }}>
                          {/* Development Sub-section */}
                          <div style={{ marginBottom: '16px' }}>
                            <div style={{
                              padding: '8px 0',
                              marginBottom: '8px',
                              borderBottom: '1px solid rgba(0, 0, 0, 0.04)',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center'
                            }}>
                              <h5 style={{
                                color: 'rgba(13, 7, 106, 0.95)', 
                                fontSize: '12px', 
                                fontWeight: 600,
                                letterSpacing: '-0.01em',
                                margin: 0,
                                padding: 0,
                                lineHeight: '1.5',
                                textTransform: 'uppercase',
                                textAlign: 'left'
                              }}>
                                DEVELOPMENT
                              </h5>
                              {allDevelopmentItems.length > 0 && (() => {
                                const developmentSubtotal = allDevelopmentItems.reduce((sum, item) => sum + item.cost, 0)
                                return (
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{
                                      fontSize: '12px',
                                      fontWeight: 600,
                                      color: 'rgb(156, 160, 169)',
                                      marginRight: '4px'
                                    }}>
                                      Subtotal:
                                    </span>
                                    <span style={{
                                      fontSize: '13px',
                                      fontWeight: 600,
                                      color: Colors.main.default.red.hex,
                                      textAlign: 'right',
                                      minWidth: '64px'
                                    }}>
                                      {formatCurrency(developmentSubtotal, currency)}
                                    </span>
                                    <TooltipPlaceholder />
                                  </div>
                                )
                              })()}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                              {allDevelopmentItems.map((item, index) => (
                                <div
                                  key={item.id}
                                  style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    padding: '12px 16px 12px 32px',
                                    margin: '-12px -16px',
                                    borderRadius: '6px',
                                    transition: 'background-color 0.15s ease',
                                    cursor: 'default',
                                    backgroundColor: 'transparent'
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.02)'
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = 'transparent'
                                  }}
                                >
                                  <span style={{ 
                                    color: 'rgba(13, 7, 106, 0.95)', 
                                    fontSize: '13px', 
                                    fontWeight: 400,
                                    lineHeight: '1.5',
                                    textAlign: 'left'
                                  }}>
                                    {item.name}
                                  </span>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{ 
                                      fontSize: '13px', 
                                      fontWeight: 600, 
                                      lineHeight: '1.5',
                                      color: Colors.main.default.red.hex,
                                      textAlign: 'right',
                                      minWidth: '64px'
                                    }}>
                                      {formatCurrency(item.cost, currency)}
                                    </span>
                                    <TooltipPlaceholder />
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Tools Sub-section */}
                          <div>
                            <div style={{
                              padding: '6px 0',
                              marginBottom: '6px',
                              borderBottom: '1px solid rgba(0, 0, 0, 0.04)',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center'
                            }}>
                              <h5 style={{ 
                                color: 'rgba(13, 7, 106, 0.95)', 
                                fontSize: '12px', 
                                fontWeight: 600,
                                letterSpacing: '-0.01em',
                                margin: 0,
                                padding: 0,
                                lineHeight: '1.5',
                                textTransform: 'uppercase',
                                textAlign: 'left'
                              }}>
                                TOOLS
                              </h5>
                              {(() => {
                                const toolsSubtotal = [...commonCostTools, ...otherTools].reduce((sum, tool) => sum + calculateToolCostSinceStart(tool), 0)
                                if (toolsSubtotal > 0 || commonCostTools.length > 0 || otherTools.length > 0) {
                                  return (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                      <span style={{
                                        fontSize: '12px',
                                        fontWeight: 600,
                                        color: 'rgb(156, 160, 169)',
                                        marginRight: '4px'
                                      }}>
                                        Subtotal:
                                      </span>
                                      <span style={{
                                        fontSize: '13px',
                                        fontWeight: 600,
                                        color: Colors.main.default.red.hex,
                                        textAlign: 'right',
                                        minWidth: '64px'
                                      }}>
                                        {formatCurrency(toolsSubtotal, currency)}
                                      </span>
                                      <TooltipPlaceholder />
                                    </div>
                                  )
                                }
                                return null
                              })()}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                              {/* All Tools - Combined and sorted alphabetically */}
                              {[...commonCostTools, ...otherTools].sort((a, b) => (a.tool || '').localeCompare(b.tool || '')).map((tool, index) => {
                                const totalCost = calculateToolCostSinceStart(tool)
                                const periodMonths = tool.period === 'monthly' ? 1 : tool.period === 'quarterly' ? 3 : tool.period === 'yearly' ? 12 : tool.period === '24months' ? 24 : 1
                                const toolCost = parseFloat(tool.cost.toString())
                                
                                // Get payment date: use start_date if available, otherwise earliest deployment date
                                const paymentDate = tool.start_date ? new Date(tool.start_date) : earliestDeploymentDate
                                const paymentDateStr = paymentDate ? formatDate(paymentDate) : 'N/A'
                                
                                // Build tooltip content: Special handling for LLM Tokens
                                const isLLMTokens = tool.tool?.toLowerCase().includes('llm tokens')
                                let tooltipContent: React.ReactNode
                                
                                if (isLLMTokens) {
                                  // Calculate months since deployment for LLM Tokens (same logic as calculateToolCostSinceStart for monthly tools)
                                  const baseDate = tool.start_date ? new Date(tool.start_date) : earliestDeploymentDate
                                  let monthsSinceStart = 0
                                  if (baseDate) {
                                    const now = new Date()
                                    const yearsDiff = now.getFullYear() - baseDate.getFullYear()
                                    const monthsDiff = now.getMonth() - baseDate.getMonth()
                                    monthsSinceStart = Math.max(0, yearsDiff * 12 + monthsDiff)
                                  }
                                  
                                  // Special tooltip for LLM Tokens with calculation breakdown and link to Open Router
                                  const monthLabel = monthsSinceStart === 1 ? '1 month' : `${monthsSinceStart} months`
                                  tooltipContent = (
                                    <div style={{ color: 'rgba(13, 7, 106, 0.9)', whiteSpace: 'pre-line' }}>
                                      Estimated monthly cost: {formatCurrency(toolCost, currency)}.
                                      {'\n'}For exact costs check your{' '}
                                      <a 
                                        href="https://openrouter.ai/account" 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        style={{ 
                                          color: 'rgba(59, 130, 246, 1)', 
                                          textDecoration: 'underline',
                                          cursor: 'pointer'
                                        }}
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        Open Router account
                                      </a>
                                      {'\n\n'}{monthLabel} since workflow deployment.
                                      {'\n\n'}Calculation:
                                      {'\n'}{monthLabel} × {formatCurrency(toolCost, currency)} / month = {formatCurrency(totalCost, currency)}.
                                    </div>
                                  )
                                } else {
                                  // Standard tooltip format: "12 months hosting paid on 8 Dec 2025"
                                  const periodLabel = periodMonths === 1 ? '1 month' : `${periodMonths} months`
                                  tooltipContent = `${periodLabel} ${tool.tool} paid on ${paymentDateStr}\n${formatCurrency(toolCost, currency)}`
                                }
                                
                                return (
                                  <div
                                    key={tool.tool}
                                    style={{
                                      display: 'flex',
                                      justifyContent: 'space-between',
                                      alignItems: 'center',
                                      padding: '12px 16px 12px 32px',
                                      margin: '-12px -16px',
                                      borderRadius: '6px',
                                      transition: 'background-color 0.15s ease',
                                      cursor: 'default',
                                      backgroundColor: 'transparent'
                                    }}
                                    onMouseEnter={(e) => {
                                      e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.02)'
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.backgroundColor = 'transparent'
                                    }}
                                  >
                                    <span style={{ 
                                      color: 'rgba(13, 7, 106, 0.95)', 
                                      fontSize: '13px', 
                                      fontWeight: 400,
                                      lineHeight: '1.5'
                                    }}>
                                      {tool.tool}
                                    </span>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                      <span style={{ 
                                        fontSize: '13px', 
                                        fontWeight: 600, 
                                        lineHeight: '1.5',
                                        color: Colors.main.default.red.hex,
                                        textAlign: 'right',
                                        minWidth: '64px'
                                      }}>
                                        {formatCurrency(totalCost, currency)}
                                      </span>
                                      <TooltipIcon content={tooltipContent} />
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })()}
                </div>
              </CardContent>
            </Card>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
    </TooltipProvider>
  )
}
