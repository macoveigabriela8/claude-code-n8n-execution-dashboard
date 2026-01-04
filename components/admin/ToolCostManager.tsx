'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { getClientTools, updateClientTools, supabase } from '@/lib/supabase'
import { ClientToolCost } from '@/types/supabase'
import { getCurrencySymbol } from '@/lib/utils'
import { Plus, Trash2, Save, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface ToolCostManagerProps {
  clientId: string
}

interface ToolCostWithEnabled extends ClientToolCost {
  enabled: boolean
  isDefault?: boolean
  end_date?: string
  start_date?: string | null
}

const DEFAULT_TOOLS: Omit<ToolCostWithEnabled, 'currency_code'>[] = [
  {
    tool: 'Audit / Initial setup',
    cost: 0,
    recurring: false,
    period: null,
    end_date: new Date().toISOString().split('T')[0],
    enabled: true,
    isDefault: true,
  },
  {
    tool: 'Hosting',
    cost: 83.88,
    recurring: true,
    period: 'yearly',
    enabled: true,
    isDefault: true,
  },
  {
    tool: 'Supabase',
    cost: 0,
    recurring: true,
    period: 'monthly',
    enabled: false,
    isDefault: true,
  },
  {
    tool: 'LLM Tokens',
    cost: 0,
    recurring: true,
    period: 'monthly',
    enabled: false,
    isDefault: true,
  },
]

export default function ToolCostManager({ clientId }: ToolCostManagerProps) {
  const [tools, setTools] = useState<ToolCostWithEnabled[]>([])
  const [originalTools, setOriginalTools] = useState<ClientToolCost[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [clientCurrency, setClientCurrency] = useState<string>('GBP')
  const [customToolName, setCustomToolName] = useState('')

  // Helper function to calculate monthly equivalent price
  const getMonthlyPrice = (cost: number, period: string): number => {
    if (period === 'yearly') {
      return cost / 12
    } else if (period === '24months') {
      return cost / 24
    } else if (period === 'monthly') {
      return cost
    }
    return 0
  }

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        setError(null)
        
        // Fetch client currency code
        const { data: clientData, error: currencyError } = await supabase
          .from('n8n_clients')
          .select('currency_code')
          .eq('id', clientId)
          .maybeSingle()
        
        const currency = clientData?.currency_code || 'GBP'
        if (currencyError) {
          console.warn('Error loading client currency:', currencyError)
        }
        setClientCurrency(currency)
        
        // Fetch existing tool costs
        const existingTools = await getClientTools(clientId)
        setOriginalTools(existingTools)
        
        // Create a map of existing tools by name
        const existingToolsMap = new Map(
          existingTools.map(tool => [tool.tool.toLowerCase(), tool])
        )
        
        // Merge default tools with existing tools
        const mergedTools: ToolCostWithEnabled[] = DEFAULT_TOOLS.map(defaultTool => {
          const existing = existingToolsMap.get(defaultTool.tool.toLowerCase())
          if (existing) {
            return {
              ...existing,
              enabled: true,
              isDefault: true,
              end_date: (existing as any).end_date || defaultTool.end_date,
            } as ToolCostWithEnabled
          }
          return {
            ...defaultTool,
            currency_code: currency,
            isDefault: true,
          } as ToolCostWithEnabled
        })
        
        // Add custom tools (tools that are not in defaults)
        existingTools.forEach(tool => {
          const isDefault = DEFAULT_TOOLS.some(
            dt => dt.tool.toLowerCase() === tool.tool.toLowerCase()
          )
          if (!isDefault) {
            mergedTools.push({
              ...tool,
              enabled: true,
              isDefault: false,
              end_date: (tool as any).end_date,
            } as ToolCostWithEnabled)
          }
        })
        
        setTools(mergedTools)
      } catch (err) {
        console.error('Error loading tool costs:', err)
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
        setError(`Failed to load tool costs: ${errorMessage}`)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [clientId])

  const handleToggleEnabled = (index: number) => {
    setTools(prev => {
      const updated = [...prev]
      updated[index] = {
        ...updated[index],
        enabled: !updated[index].enabled,
      }
      return updated
    })
  }

  const handleToolChange = (
    index: number,
    field: keyof ClientToolCost,
    value: string | number
  ) => {
    setTools(prev => {
      const updated = [...prev]
      updated[index] = {
        ...updated[index],
        [field]: value,
      } as ToolCostWithEnabled
      return updated
    })
  }

  const handleAddCustomTool = () => {
    if (!customToolName.trim()) {
      setError('Please enter a tool name')
      return
    }
    
    // Check if tool name already exists
    const toolNameLower = customToolName.trim().toLowerCase()
    const exists = tools.some(t => t.tool.toLowerCase() === toolNameLower)
    if (exists) {
      setError('A tool with this name already exists')
      return
    }
    
    setError(null)
    setTools(prev => [
      ...prev,
      {
        tool: customToolName.trim(),
        cost: 0,
        recurring: true,
        period: 'yearly',
        currency_code: clientCurrency,
        enabled: true,
        isDefault: false,
      },
    ])
    setCustomToolName('')
  }

  const handleRemoveCustomTool = (index: number) => {
    const tool = tools[index]
    if (tool.isDefault) {
      setError('Cannot remove default tools')
      return
    }
    setError(null)
    setTools(prev => prev.filter((_, i) => i !== index))
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      setError(null)
      
      // Filter to only enabled tools and remove internal fields
      const toolsToSave: any[] = tools
        .filter(tool => tool.enabled)
        .map(({ enabled, isDefault, ...tool }) => {
          const hasEndDate = !!(tool as any).end_date
          const baseTool: any = {
            ...tool,
            currency_code: tool.currency_code || clientCurrency,
            recurring: !hasEndDate, // recurring = true if no end_date, false if end_date exists
          }
          // For one-time fees: set period to NULL and ensure end_date is set
          if (hasEndDate) {
            baseTool.end_date = (tool as any).end_date
            baseTool.period = null
            baseTool.recurring = false
            // Remove start_date for one-time fees (not needed)
            delete baseTool.start_date
          } else {
            // For recurring tools: include start_date only if it's set (can be null/undefined)
            if (!(tool as any).start_date) {
              // Explicitly set to null if empty string or undefined
              baseTool.start_date = null
            }
          }
          return baseTool
        })
      
      await updateClientTools(clientId, toolsToSave)
      
      // Update original tools to reflect saved state
      setOriginalTools(toolsToSave)
      
      // Show success message (could use a toast here)
      alert('Tool costs saved successfully!')
    } catch (err) {
      console.error('Error saving tool costs:', err)
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
      setError(`Failed to save tool costs: ${errorMessage}`)
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    // Reset to original state
    const existingToolsMap = new Map(
      originalTools.map(tool => [tool.tool.toLowerCase(), tool])
    )
    
    const mergedTools: ToolCostWithEnabled[] = DEFAULT_TOOLS.map(defaultTool => {
      const existing = existingToolsMap.get(defaultTool.tool.toLowerCase())
      if (existing) {
        return {
          ...existing,
          enabled: true,
          isDefault: true,
        }
      }
      return {
        ...defaultTool,
        currency_code: clientCurrency,
        isDefault: true,
      }
    })
    
    originalTools.forEach(tool => {
      const isDefault = DEFAULT_TOOLS.some(
        dt => dt.tool.toLowerCase() === tool.tool.toLowerCase()
      )
      if (!isDefault) {
        mergedTools.push({
          ...tool,
          enabled: true,
          isDefault: false,
        })
      }
    })
    
    setTools(mergedTools)
    setError(null)
    setCustomToolName('')
  }

  const hasChanges = () => {
    const currentEnabled = tools.filter(t => t.enabled)
    if (currentEnabled.length !== originalTools.length) return true
    
    const currentMap = new Map(
      currentEnabled.map(t => [t.tool.toLowerCase(), t])
    )
    
    return originalTools.some(original => {
      const current = currentMap.get(original.tool.toLowerCase())
      if (!current) return true
      return (
        current.cost !== original.cost ||
        current.period !== original.period ||
        current.start_date !== (original as any).start_date
      )
    })
  }

  if (loading) {
    return (
      <Card>
        <CardContent style={{ padding: '24px' }}>
          <p>Loading...</p>
        </CardContent>
      </Card>
    )
  }

  const currencySymbol = getCurrencySymbol(clientCurrency)

  return (
    <Card>
      <CardContent className="space-y-6" style={{ paddingTop: '24px' }}>
        {error && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {/* Tools List */}
        <div className="space-y-4">
          {tools.map((tool, index) => (
            <div
              key={index}
              className="p-4 border rounded-lg space-y-4"
              style={{
                opacity: tool.enabled ? 1 : 0.6,
                backgroundColor: tool.enabled ? 'transparent' : '#f5f5f5',
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={tool.enabled}
                    onChange={() => handleToggleEnabled(index)}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <div className="flex items-center gap-2">
                    <Label className="text-base font-semibold">
                      {tool.tool}
                    </Label>
                    {tool.isDefault && (
                      <Badge variant="secondary" className="text-xs">
                        Default
                      </Badge>
                    )}
                    {tool.recurring === false && (
                      <Badge variant="outline" className="text-xs border-blue-500 text-blue-700 bg-blue-50">
                        Fixed Cost - One-Time
                      </Badge>
                    )}
                  </div>
                </div>
                {!tool.isDefault && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveCustomTool(index)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>

              {tool.enabled && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor={`cost-${index}`}>Cost ({currencySymbol})</Label>
                    <Input
                      id={`cost-${index}`}
                      type="text"
                      value={tool.cost.toString()}
                      onFocus={(e) => e.target.select()}
                      onChange={(e) => {
                        const value = e.target.value
                        // Allow empty string, numbers, and decimal point
                        if (value === '' || /^\d*\.?\d*$/.test(value)) {
                          const numValue = value === '' ? 0 : parseFloat(value)
                          handleToolChange(index, 'cost', isNaN(numValue) ? 0 : numValue)
                        }
                      }}
                    />
                    {tool.recurring !== false && tool.period && (
                      <p className="text-xs text-muted-foreground mt-1">
                        ~{currencySymbol}{Math.round(getMonthlyPrice(tool.cost, tool.period!))}/month
                      </p>
                    )}
                  </div>
                  {tool.recurring !== false && (
                    <div>
                      <Label htmlFor={`period-${index}`}>Period</Label>
                      <Select
                        value={tool.period || ''}
                        onValueChange={(value) =>
                          handleToolChange(
                            index,
                            'period',
                            value as 'monthly' | 'yearly' | '24months'
                          )
                        }
                      >
                        <SelectTrigger id={`period-${index}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {tool.tool === 'Supabase' || tool.tool.toLowerCase() === 'supabase' || 
                           tool.tool === 'LLM Tokens' || tool.tool.toLowerCase() === 'llm tokens' ? (
                            <>
                              <SelectItem value="monthly">Monthly</SelectItem>
                            </>
                          ) : (
                            <>
                              <SelectItem value="yearly">12 months</SelectItem>
                              <SelectItem value="24months">24 months</SelectItem>
                            </>
                          )}
                        </SelectContent>
                      </Select>
                      {tool.tool === 'Supabase' && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Free tier: $0, Micro: $10, Small: $15, Medium: $60
                        </p>
                      )}
                    </div>
                  )}
                  {tool.recurring !== false && (
                    <div>
                      <Label htmlFor={`start-date-${index}`}>Start Date (Optional)</Label>
                      <Input
                        id={`start-date-${index}`}
                        type="date"
                        value={tool.start_date || ''}
                        onChange={(e) => {
                          setTools(prev => {
                            const updated = [...prev]
                            updated[index] = {
                              ...updated[index],
                              start_date: e.target.value || null,
                            } as ToolCostWithEnabled
                            return updated
                          })
                        }}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Optional: Date when this subscription started. If not set, uses earliest workflow deployment date.
                      </p>
                    </div>
                  )}
                  {tool.recurring === false && (
                    <div>
                      <Label htmlFor={`end-date-${index}`}>End Date</Label>
                      <Input
                        id={`end-date-${index}`}
                        type="date"
                        value={(tool as ToolCostWithEnabled).end_date || ''}
                        onChange={(e) => {
                          setTools(prev => {
                            const updated = [...prev]
                            updated[index] = {
                              ...updated[index],
                              end_date: e.target.value,
                            } as ToolCostWithEnabled
                            return updated
                          })
                        }}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        One-time fee: divided by workflows (not time-based)
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Add Custom Tool */}
        <div className="flex gap-2">
          <Input
            placeholder="Enter custom tool name"
            value={customToolName}
            onChange={(e) => setCustomToolName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleAddCustomTool()
              }
            }}
            className="flex-1"
          />
          <Button
            type="button"
            variant="outline"
            onClick={handleAddCustomTool}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Tool
          </Button>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={saving || !hasChanges()}
          >
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || !hasChanges()}
          >
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

