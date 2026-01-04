'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { getClientWorkflows, getROIConfig } from '@/lib/supabase'
import { WorkflowROIConfig } from '@/types/supabase'
import ROIWorkflowForm from './ROIWorkflowForm'
import ROIConfigEditor from './ROIConfigEditor'
import { Settings, CheckCircle2, XCircle } from 'lucide-react'

interface ROIWorkflowListProps {
  clientId: string
}

interface WorkflowWithROI {
  workflow_id: string
  workflow_name: string
  display_order: number
  roiConfig: WorkflowROIConfig | null
}

export default function ROIWorkflowList({ clientId }: ROIWorkflowListProps) {
  const [workflows, setWorkflows] = useState<WorkflowWithROI[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedWorkflow, setSelectedWorkflow] = useState<string | null>(null)
  const [editingConfig, setEditingConfig] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        const workflowList = await getClientWorkflows(clientId)
        
        // Fetch ROI configs for each workflow
        const workflowsWithROI = await Promise.all(
          workflowList.map(async (workflow) => {
            const roiConfig = await getROIConfig(workflow.workflow_id, clientId)
            return {
              workflow_id: workflow.workflow_id,
              workflow_name: workflow.workflow_name,
              display_order: workflow.display_order || 0,
              roiConfig: roiConfig as WorkflowROIConfig | null,
            }
          })
        )
        
        setWorkflows(workflowsWithROI)
      } catch (err) {
        console.error('Error loading workflows:', err)
        const errorMessage = err instanceof Error ? err.message : String(err)
        setError(`Failed to load workflows: ${errorMessage}`)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [clientId])

  const handleConfigSaved = () => {
    setSelectedWorkflow(null)
    setEditingConfig(null)
    // Refetch workflows
    async function refetch() {
      const workflowList = await getClientWorkflows(clientId)
      const workflowsWithROI = await Promise.all(
        workflowList.map(async (workflow) => {
          const roiConfig = await getROIConfig(workflow.workflow_id, clientId)
          return {
            workflow_id: workflow.workflow_id,
            workflow_name: workflow.workflow_name,
            display_order: workflow.display_order || 0,
            roiConfig: roiConfig as WorkflowROIConfig | null,
          }
        })
      )
      setWorkflows(workflowsWithROI)
    }
    refetch()
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-64" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-10 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <p className="text-destructive">{error}</p>
        </CardHeader>
      </Card>
    )
  }

  if (selectedWorkflow) {
    const workflow = workflows.find(w => w.workflow_id === selectedWorkflow)
    if (!workflow) return null
    
    return (
      <ROIWorkflowForm
        workflowId={workflow.workflow_id}
        workflowName={workflow.workflow_name}
        clientId={clientId}
        existingConfig={workflow.roiConfig}
        onSave={handleConfigSaved}
        onCancel={() => setSelectedWorkflow(null)}
      />
    )
  }

  if (editingConfig) {
    const workflow = workflows.find(w => w.roiConfig?.id === editingConfig)
    if (!workflow || !workflow.roiConfig) return null
    
    return (
      <ROIConfigEditor
        config={workflow.roiConfig}
        workflowName={workflow.workflow_name}
        onSave={handleConfigSaved}
        onCancel={() => setEditingConfig(null)}
      />
    )
  }

  const workflowsWithROI = workflows.filter(w => w.roiConfig !== null).length
  const workflowsWithoutROI = workflows.filter(w => w.roiConfig === null).length

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Workflow ROI Configuration</h2>
        <p className="text-sm text-muted-foreground">
          {workflowsWithROI} configured, {workflowsWithoutROI} pending configuration
        </p>
      </div>

      <div className="space-y-3">
        {workflows.map((workflow) => (
          <Card key={workflow.workflow_id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {workflow.roiConfig ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-muted-foreground" />
                  )}
                  <div>
                    <CardTitle className="text-lg">{workflow.workflow_name}</CardTitle>
                    {workflow.roiConfig && (
                      <Badge variant="secondary" className="mt-1">
                        {workflow.roiConfig.roi_type}
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {workflow.roiConfig ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingConfig(workflow.roiConfig!.id!)}
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Edit Config
                    </Button>
                  ) : (
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => setSelectedWorkflow(workflow.workflow_id)}
                    >
                      Configure ROI
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>

      {workflows.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground">No workflows found for this client.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}


