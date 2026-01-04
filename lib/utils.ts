import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Time formatting utilities
export function formatTimeAgo(dateStr?: string | null): string {
  if (!dateStr) return 'Just now'
  try {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    
    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours}h ago`
    return `${Math.floor(diffHours / 24)}d ago`
  } catch {
    return dateStr
  }
}

export function formatDuration(ms?: number | null): string {
  if (!ms) return '-'
  if (ms < 1000) return `${ms}ms`
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
  const minutes = Math.floor(ms / 60000)
  const seconds = Math.floor((ms % 60000) / 1000)
  return `${minutes}m ${seconds}s`
}

export function formatDurationSeconds(seconds?: number | null): string {
  if (!seconds) return '-'
  if (seconds < 60) return `${seconds.toFixed(1)}s`
  const minutes = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${minutes}m ${secs}s`
}

export function getDurationColor(ms?: number | null): string {
  if (!ms) return 'text-muted-foreground'
  const seconds = ms / 1000
  if (seconds < 5) return 'text-green-600'
  if (seconds < 30) return 'text-yellow-600'
  return 'text-red-600'
}

export function getHealthStatus(rate: number): 'healthy' | 'needs-attention' | 'critical' {
  if (rate >= 95) return 'healthy'
  if (rate >= 90) return 'needs-attention'
  return 'critical'
}

// Currency formatting utilities
export function getCurrencySymbol(currencyCode: string): string {
  const symbols: Record<string, string> = {
    GBP: '£',
    USD: '$',
    EUR: '€',
    CAD: 'C$',
    AUD: 'A$',
    JPY: '¥',
    CHF: 'CHF',
    CNY: '¥',
    INR: '₹',
  }
  return symbols[currencyCode.toUpperCase()] || currencyCode
}

export function formatCurrency(value: number, currencyCode: string = 'GBP'): string {
  const symbol = getCurrencySymbol(currencyCode)
  // Format with no decimal places and thousand separators
  // Preserve negative sign
  const rounded = Math.round(value)
  const formatted = Math.abs(rounded).toLocaleString('en-US')
  return rounded < 0 ? `-${symbol}${formatted}` : `${symbol}${formatted}`
}

export function formatHours(minutes: number): string {
  if (!minutes || minutes === 0) return '0h'
  const hours = Math.floor(minutes / 60)
  const mins = Math.floor(minutes % 60)
  
  if (hours === 0) return `${mins}m`
  if (mins === 0) return `${hours}h`
  return `${hours}h ${mins}m`
}

export function formatDate(dateStr: string | Date): string {
  if (!dateStr) return ''
  const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr
  return date.toLocaleDateString('en-GB', { 
    day: 'numeric', 
    month: 'short', 
    year: 'numeric' 
  })
}

export function formatDateTime(dateStr?: string | null): string {
  if (!dateStr) return '-'
  try {
    const date = new Date(dateStr)
    return date.toLocaleString('en-GB', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).replace(',', '')
  } catch {
    return dateStr
  }
}

export function formatDurationHours(ms?: number | null): string {
  if (!ms) return '-'
  const hours = ms / (1000 * 60 * 60)
  if (hours < 0.01) return '<0.01h'
  return `${hours.toFixed(2)}h`
}

export function formatDurationMinutes(ms?: number | null): string {
  if (!ms) return '-'
  const minutes = ms / (1000 * 60)
  if (minutes < 1) return '<1'
  return Math.round(minutes).toString()
}

// Calculate automation cost (implementation + allocated tool costs)
export function calculateWorkflowAutomationCost(
  implementationCost: number,
  implementationDate: string | null | undefined,
  clientToolCosts: Array<{ cost: number; period: string; start_date: string; end_date?: string }>,
  workflowCount: number,
  endDate: Date = new Date()
): number {
  let total = 0
  
  // Implementation cost (one-time, if date has passed)
  if (implementationDate && new Date(implementationDate) <= endDate) {
    total += implementationCost || 0
  }
  
  // Allocated tool costs (divide by number of workflows)
  if (workflowCount > 0 && clientToolCosts.length > 0) {
    const toolCostTotal = calculateClientToolCosts(clientToolCosts, endDate)
    total += toolCostTotal / workflowCount
  }
  
  return total
}

// Calculate client-level tool costs
export function calculateClientToolCosts(
  toolCosts: Array<{ cost: number; period: string; start_date: string; end_date?: string }>,
  endDate: Date = new Date()
): number {
  return toolCosts.reduce((total, tool) => {
    const startDate = new Date(tool.start_date)
    if (startDate > endDate) return total
    
    // Handle one-time fees with end_date
    if (tool.end_date) {
      // For one-time fees, apply cost once if endDate is >= start_date
      // The end_date marks when the setup period ends, but fee is incurred from start
      if (endDate >= startDate) {
        return total + tool.cost
      }
      // If endDate is before start_date, don't apply cost yet
      return total
    }
    
    const monthsSinceStart = Math.max(0, 
      (endDate.getFullYear() - startDate.getFullYear()) * 12 + 
      (endDate.getMonth() - startDate.getMonth())
    )
    
    let toolTotal = 0
    if (tool.period === 'monthly') {
      toolTotal = tool.cost * monthsSinceStart
    } else if (tool.period === 'quarterly') {
      toolTotal = tool.cost * Math.floor(monthsSinceStart / 3)
    } else if (tool.period === 'yearly') {
      const yearsSinceStart = Math.max(0, 
        endDate.getFullYear() - startDate.getFullYear()
      )
      toolTotal = tool.cost * yearsSinceStart
    } else if (tool.period === '24months') {
      toolTotal = tool.cost * Math.floor(monthsSinceStart / 24)
    }
    
    return total + toolTotal
  }, 0)
}

// Format period for display
export function formatPeriodDisplay(period: string): string {
  switch (period) {
    case 'monthly':
      return 'monthly'
    case 'quarterly':
      return 'quarterly'
    case 'yearly':
      return '12 months'
    case '24months':
      return '24 months'
    default:
      return period
  }
}

// Calculate value for aggregate/report pattern
export function calculateReportValue(
  clientsPerReport: number,
  reactivationRate: number,
  valuePerClient: number,
  executions: number
): number {
  const expectedReactivations = executions * clientsPerReport * (reactivationRate / 100)
  return expectedReactivations * valuePerClient
}

