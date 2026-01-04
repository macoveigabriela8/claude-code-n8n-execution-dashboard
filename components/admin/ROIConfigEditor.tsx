'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { deleteROIConfig } from '@/lib/supabase'
import { WorkflowROIConfig } from '@/types/supabase'
import ROIWorkflowForm from './ROIWorkflowForm'
import { Trash2, Edit } from 'lucide-react'

interface ROIConfigEditorProps {
  config: WorkflowROIConfig
  workflowName: string
  onSave: () => void
  onCancel: () => void
}

export default function ROIConfigEditor({
  config,
  workflowName,
  onSave,
  onCancel,
}: ROIConfigEditorProps) {
  const [editing, setEditing] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleDelete = async () => {
    if (!config.id) return
    if (!confirm('Are you sure you want to delete this ROI configuration? This action cannot be undone.')) {
      return
    }

    setDeleting(true)
    setError(null)

    try {
      await deleteROIConfig(config.id)
      onSave()
    } catch (err) {
      console.error('Error deleting ROI config:', err)
      const errorMessage = err instanceof Error ? err.message : String(err)
      setError(`Failed to delete configuration: ${errorMessage}`)
    } finally {
      setDeleting(false)
    }
  }

  if (editing) {
    return (
      <ROIWorkflowForm
        workflowId={config.workflow_id}
        workflowName={workflowName}
        clientId={config.client_id}
        existingConfig={config}
        onSave={() => {
          setEditing(false)
          onSave()
        }}
        onCancel={() => setEditing(false)}
      />
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>ROI Configuration: {workflowName}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Type: {config.roi_type} | Currency: {config.currency_code || 'GBP'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditing(true)}
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              disabled={deleting}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="p-4 bg-destructive/10 border border-destructive rounded-md mb-4">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Deployment Date</p>
              <p className="text-base">{config.deployment_date || 'Not set (ROI calculation unavailable)'}</p>
            </div>
            {config.implementation_cost && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Implementation Cost</p>
                <p className="text-base">
                  {config.currency_code || 'GBP'} {config.implementation_cost}
                </p>
              </div>
            )}
          </div>

          {config.roi_type === 'per_execution' && (
            <div className="p-4 bg-muted/50 rounded-lg">
              <h4 className="font-medium mb-2">Per Execution Settings</h4>
              <div className="grid gap-2 md:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground">Minutes Saved</p>
                  <p className="text-base font-medium">{config.manual_minutes_saved || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Hourly Rate</p>
                  <p className="text-base font-medium">
                    {config.currency_code || 'GBP'} {config.hourly_rate || 0}
                  </p>
                </div>
              </div>
            </div>
          )}

          {config.roi_type === 'recurring_task' && (
            <div className="p-4 bg-muted/50 rounded-lg">
              <h4 className="font-medium mb-2">Recurring Task Settings</h4>
              <div className="grid gap-2 md:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground">Frequency</p>
                  <p className="text-base font-medium">{config.frequency}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Occurrences</p>
                  <p className="text-base font-medium">{config.occurrences_per_frequency || 1}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Minutes Saved</p>
                  <p className="text-base font-medium">{config.manual_minutes_saved || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Hourly Rate</p>
                  <p className="text-base font-medium">
                    {config.currency_code || 'GBP'} {config.hourly_rate || 0}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Work Days Per Week</p>
                  <p className="text-base font-medium">{config.work_days_per_week || 5}</p>
                </div>
              </div>
            </div>
          )}

          {config.roi_type === 'new_capability' && (
            <div className="p-4 bg-muted/50 rounded-lg">
              <h4 className="font-medium mb-2">New Capability Settings</h4>
              {config.value_per_execution && (
                <div>
                  <p className="text-sm text-muted-foreground">Value Per Execution</p>
                  <p className="text-base font-medium">
                    {config.currency_code || 'GBP'} {config.value_per_execution}
                  </p>
                </div>
              )}
              {config.clients_per_report && config.reactivation_rate_percent && config.value_per_client && (
                <div className="grid gap-2 md:grid-cols-3 mt-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Items Per Execution</p>
                    <p className="text-base font-medium">{config.clients_per_report}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Conversion Rate</p>
                    <p className="text-base font-medium">{config.reactivation_rate_percent}%</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Value Per Converted Item</p>
                    <p className="text-base font-medium">
                      {config.currency_code || 'GBP'} {config.value_per_client}
                    </p>
                  </div>
                </div>
              )}
              {config.value_description && (
                <div className="mt-2">
                  <p className="text-sm text-muted-foreground">Description</p>
                  <p className="text-base">{config.value_description}</p>
                </div>
              )}
            </div>
          )}

          {config.notes && (
            <div>
              <p className="text-sm font-medium text-muted-foreground">Notes</p>
              <p className="text-base">{config.notes}</p>
            </div>
          )}
        </div>

        <div className="mt-6 pt-6 border-t">
          <Button variant="outline" onClick={onCancel}>
            Back to List
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

