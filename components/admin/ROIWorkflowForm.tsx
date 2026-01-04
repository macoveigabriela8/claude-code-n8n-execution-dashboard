'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
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
import { Textarea } from '@/components/ui/textarea'
import { createROIConfig, updateROIConfig, getClientData } from '@/lib/supabase'
import { WorkflowROIConfig } from '@/types/supabase'
import { getCurrencySymbol } from '@/lib/utils'
import { ArrowLeft } from 'lucide-react'

interface ROIWorkflowFormProps {
  workflowId: string
  workflowName: string
  clientId: string
  existingConfig?: WorkflowROIConfig | null
  onSave: () => void
  onCancel: () => void
}

export default function ROIWorkflowForm({
  workflowId,
  workflowName,
  clientId,
  existingConfig,
  onSave,
  onCancel,
}: ROIWorkflowFormProps) {
  const [roiType, setRoiType] = useState<'per_execution' | 'recurring_task' | 'new_capability'>(
    existingConfig?.roi_type || 'per_execution'
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [clientCurrency, setClientCurrency] = useState<string>('GBP')

  // Fetch client currency on mount
  useEffect(() => {
    async function fetchClientCurrency() {
      try {
        const clientData = await getClientData(clientId)
        setClientCurrency(clientData?.currency_code || 'GBP')
      } catch (err) {
        console.error('Error loading client currency:', err)
        // Default to GBP on error
        setClientCurrency('GBP')
      }
    }
    fetchClientCurrency()
  }, [clientId])

  // Common fields
  const [deploymentDate, setDeploymentDate] = useState(
    existingConfig?.deployment_date || ''
  )
  const [implementationCost, setImplementationCost] = useState(
    existingConfig?.implementation_cost?.toString() || '0'
  )
  const [implementationDate, setImplementationDate] = useState(
    existingConfig?.implementation_date || ''
  )
  const [notes, setNotes] = useState(existingConfig?.notes || '')

  // Per execution fields
  const [manualMinutesSaved, setManualMinutesSaved] = useState(
    existingConfig?.manual_minutes_saved?.toString() || ''
  )
  const [hourlyRate, setHourlyRate] = useState(existingConfig?.hourly_rate?.toString() || '')

  // Recurring task fields
  const [frequency, setFrequency] = useState<
    'daily' | 'weekly' | 'monthly' | 'quarterly' | ''
  >(existingConfig?.frequency || '')
  const [occurrencesPerFrequency, setOccurrencesPerFrequency] = useState(
    existingConfig?.occurrences_per_frequency?.toString() || '1'
  )
  const [workDaysPerWeek, setWorkDaysPerWeek] = useState(
    existingConfig?.work_days_per_week?.toString() || '5'
  )

  // New capability fields
  const [valuePerExecution, setValuePerExecution] = useState(
    existingConfig?.value_per_execution?.toString() || ''
  )
  const [newCapabilityFrequency, setNewCapabilityFrequency] = useState<
    'daily' | 'weekly' | 'monthly' | 'quarterly' | ''
  >(existingConfig?.frequency || '')
  const [valuePerFrequency, setValuePerFrequency] = useState(
    existingConfig?.value_per_frequency?.toString() || ''
  )
  const [clientsPerReport, setClientsPerReport] = useState(
    existingConfig?.clients_per_report?.toString() || ''
  )
  const [reactivationRatePercent, setReactivationRatePercent] = useState(
    existingConfig?.reactivation_rate_percent?.toString() || ''
  )
  const [valuePerClient, setValuePerClient] = useState(
    existingConfig?.value_per_client?.toString() || ''
  )
  const [valueDescription, setValueDescription] = useState(
    existingConfig?.value_description || ''
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const config: any = {
        workflow_id: workflowId,
        client_id: clientId,
        roi_type: roiType,
        deployment_date: deploymentDate || null,  // Convert empty string to null
        currency_code: clientCurrency,  // Use client-level currency
        implementation_cost: parseFloat(implementationCost) || 0,
        implementation_date: implementationDate || null,
        notes: notes || null,
      }

      if (roiType === 'per_execution') {
        config.manual_minutes_saved = parseInt(manualMinutesSaved) || 0
        config.hourly_rate = parseFloat(hourlyRate) || 0
      } else if (roiType === 'recurring_task') {
        config.frequency = frequency
        config.occurrences_per_frequency = parseInt(occurrencesPerFrequency) || 1
        config.manual_minutes_saved = parseInt(manualMinutesSaved) || 0
        config.hourly_rate = parseFloat(hourlyRate) || 0
        config.work_days_per_week = parseInt(workDaysPerWeek) || 5
      } else if (roiType === 'new_capability') {
        if (newCapabilityFrequency && valuePerFrequency) {
          // Frequency-based value generation
          config.frequency = newCapabilityFrequency
          config.value_per_frequency = parseFloat(valuePerFrequency)
        } else if (clientsPerReport && reactivationRatePercent && valuePerClient) {
          // Aggregate/report pattern
          config.clients_per_report = parseInt(clientsPerReport)
          config.reactivation_rate_percent = parseFloat(reactivationRatePercent)
          config.value_per_client = parseFloat(valuePerClient)
        } else if (valuePerExecution) {
          // Simple value per execution
          config.value_per_execution = parseFloat(valuePerExecution)
        }
        config.value_description = valueDescription || null
      }

      if (existingConfig?.id) {
        await updateROIConfig(existingConfig.id, config)
      } else {
        await createROIConfig(config)
      }

      onSave()
    } catch (err) {
      console.error('Error saving ROI config:', err)
      let errorMessage = 'Unknown error occurred'
      if (err instanceof Error) {
        errorMessage = err.message
      } else if (err && typeof err === 'object') {
        // Handle Supabase errors or other error objects
        errorMessage = (err as any).message || (err as any).error?.message || JSON.stringify(err)
      } else {
        errorMessage = String(err)
      }
      setError(`Failed to save configuration: ${errorMessage}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={onCancel}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <CardTitle>Configure ROI: {workflowName}</CardTitle>
            <CardDescription>
              Set up ROI calculation parameters for this workflow
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-4 bg-destructive/10 border border-destructive rounded-md">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {/* ROI Type Selection */}
          <div className="space-y-2">
            <Label>ROI Calculation Type *</Label>
            <Select value={roiType} onValueChange={(v: any) => setRoiType(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="per_execution">Per Execution</SelectItem>
                <SelectItem value="recurring_task">Recurring Task</SelectItem>
                <SelectItem value="new_capability">New Capability</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Common Fields */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Deployment Date</Label>
              <Input
                type="date"
                value={deploymentDate}
                onChange={(e) => setDeploymentDate(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Required for ROI calculation
              </p>
            </div>
            <div className="space-y-2">
              <Label>Currency</Label>
              <div className="flex items-center h-10 px-3 py-2 text-sm bg-muted rounded-md border border-input">
                <span className="font-medium">{clientCurrency} ({getCurrencySymbol(clientCurrency)})</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Currency is set at the client level
              </p>
            </div>
            <div className="space-y-2">
              <Label>Implementation Cost</Label>
              <Input
                type="number"
                step="0.01"
                value={implementationCost}
                onChange={(e) => setImplementationCost(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label>Client Testing Start Date</Label>
              <Input
                type="date"
                value={implementationDate}
                onChange={(e) => setImplementationDate(e.target.value)}
              />
            </div>
          </div>

          {/* Per Execution Fields */}
          {roiType === 'per_execution' && (
            <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
              <h3 className="font-semibold">Per Execution Settings</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Minutes Saved Per Execution *</Label>
                  <Input
                    type="number"
                    value={manualMinutesSaved}
                    onChange={(e) => setManualMinutesSaved(e.target.value)}
                    placeholder="15"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Hourly Rate ({clientCurrency}) *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={hourlyRate}
                    onChange={(e) => setHourlyRate(e.target.value)}
                    placeholder="25.00"
                    required
                  />
                </div>
              </div>
            </div>
          )}

          {/* Recurring Task Fields */}
          {roiType === 'recurring_task' && (
            <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
              <h3 className="font-semibold">Recurring Task Settings</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Frequency *</Label>
                  <Select value={frequency} onValueChange={(v: any) => setFrequency(v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select frequency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="quarterly">Quarterly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Occurrences Per Frequency *</Label>
                  <Input
                    type="number"
                    value={occurrencesPerFrequency}
                    onChange={(e) => setOccurrencesPerFrequency(e.target.value)}
                    placeholder="3"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    e.g., 3 for "3 times per week"
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Minutes Saved Per Occurrence *</Label>
                  <Input
                    type="number"
                    value={manualMinutesSaved}
                    onChange={(e) => setManualMinutesSaved(e.target.value)}
                    placeholder="30"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Hourly Rate ({clientCurrency}) *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={hourlyRate}
                    onChange={(e) => setHourlyRate(e.target.value)}
                    placeholder="25.00"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Work Days Per Week</Label>
                  <Select value={workDaysPerWeek} onValueChange={setWorkDaysPerWeek}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5 days</SelectItem>
                      <SelectItem value="6">6 days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {/* New Capability Fields */}
          {roiType === 'new_capability' && (
            <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
              <h3 className="font-semibold">New Capability Settings</h3>
              
              {/* Simple value per execution */}
              <div className="space-y-2">
                <Label>Value Per Execution ({clientCurrency})</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={valuePerExecution}
                  onChange={(e) => setValuePerExecution(e.target.value)}
                  placeholder="10.00"
                />
                <p className="text-xs text-muted-foreground">
                  Use this for simple value per execution, OR use the frequency-based or conversion-based value patterns below
                </p>
              </div>

              {/* Frequency-Based Value Pattern (New) */}
              <div className="pt-4 border-t">
                <h4 className="font-medium mb-2">Frequency-Based Value (Optional)</h4>
                <p className="text-xs text-muted-foreground mb-4">
                  Use this for workflows that generate value per time period (daily/weekly/monthly/quarterly).
                  Example: A report that generates £350 per month, regardless of execution count.
                </p>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Frequency</Label>
                    <Select
                      value={newCapabilityFrequency}
                      onValueChange={(value) => setNewCapabilityFrequency(value as any)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select frequency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="quarterly">Quarterly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Value Per Frequency ({clientCurrency})</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={valuePerFrequency}
                      onChange={(e) => setValuePerFrequency(e.target.value)}
                      placeholder="e.g., 350"
                    />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  If frequency is set, value will be calculated per time period instead of per execution.
                </p>
              </div>

              {/* Conversion-Based Value Pattern */}
              <div className="pt-4 border-t">
                <h4 className="font-medium mb-2">Conversion-Based Value (Optional)</h4>
                <p className="text-xs text-muted-foreground mb-4">
                  Use this for workflows that generate items (leads, clients, opportunities, etc.) with a conversion rate. 
                  Examples: Reports (100 inactive patients per report), Scrapers (50 leads per execution), Lead generation workflows.
                  <br />
                  <span className="font-medium">Example:</span> 50 leads per execution × 2% conversion × £350 per converted lead = £350 per execution
                </p>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label>Items Per Execution</Label>
                    <Input
                      type="number"
                      value={clientsPerReport}
                      onChange={(e) => setClientsPerReport(e.target.value)}
                      placeholder="50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Conversion Rate (%)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={reactivationRatePercent}
                      onChange={(e) => setReactivationRatePercent(e.target.value)}
                      placeholder="2.0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Value Per Converted Item ({clientCurrency})</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={valuePerClient}
                      onChange={(e) => setValuePerClient(e.target.value)}
                      placeholder="350.00"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Value Description</Label>
                <Textarea
                  value={valueDescription}
                  onChange={(e) => setValueDescription(e.target.value)}
                  placeholder="Description of the value created..."
                  rows={3}
                />
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional notes..."
              rows={3}
            />
          </div>

          {/* Submit Buttons */}
          <div className="flex items-center justify-end gap-4">
            <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : existingConfig ? 'Update Configuration' : 'Save Configuration'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

