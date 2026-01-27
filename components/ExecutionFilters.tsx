'use client'

import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Colors } from '@/lib/design-tokens'

interface ExecutionFiltersProps {
  statusFilter: string
  onStatusChange: (status: string) => void
  workflowFilter: string
  onWorkflowChange: (workflow: string) => void
  workflowOptions: string[]
  daysFilter: number
  onDaysChange: (days: number) => void
  showOnlyWorkDone: boolean
  onShowOnlyWorkDoneChange: (show: boolean) => void
}

export default function ExecutionFilters({
  statusFilter,
  onStatusChange,
  workflowFilter,
  onWorkflowChange,
  workflowOptions,
  daysFilter,
  onDaysChange,
  showOnlyWorkDone,
  onShowOnlyWorkDoneChange,
}: ExecutionFiltersProps) {
  const statusOptions = [
    { value: 'all', label: 'All' },
    { value: 'success', label: 'Success' },
    { value: 'error', label: 'Error' },
  ]

  const daysOptions = [
    { value: 1, label: 'Last 24 Hours' },
    { value: 2, label: 'Last 2 days' },
    { value: 3, label: 'Last 3 days' },
    { value: 5, label: 'Last 5 days' },
  ]

  // Calculate dynamic width for workflow filter based on longest workflow name
  const [workflowWidth, setWorkflowWidth] = useState<number>(250) // Default width

  useEffect(() => {
    if (typeof window === 'undefined' || workflowOptions.length === 0) return

    // Create a temporary element to measure text width
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d')
    if (!context) return

    // Use the same font as the select (text-sm, which is typically 14px)
    context.font = '14px Roboto, sans-serif'

    // Find the longest workflow name
    const allOptions = ['All Workflows', ...workflowOptions]
    let maxWidth = 0
    allOptions.forEach((option) => {
      const metrics = context.measureText(option)
      maxWidth = Math.max(maxWidth, metrics.width)
    })

    // Add padding for chevron and padding (left: 12px, right: 32px for chevron + padding)
    const totalWidth = Math.ceil(maxWidth) + 44
    // Set minimum width of 200px, maximum reasonable width of 500px
    setWorkflowWidth(Math.max(200, Math.min(500, totalWidth)))
  }, [workflowOptions])

  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex gap-2 flex-wrap">
          {statusOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => onStatusChange(option.value)}
              className="transition-opacity"
            >
              <Badge
                variant={statusFilter === option.value ? 'default' : 'outline'}
                className="cursor-pointer hover:opacity-80 text-sm"
              >
                {option.label}
              </Badge>
            </button>
          ))}
        </div>
        <Select value={workflowFilter} onValueChange={onWorkflowChange}>
          <SelectTrigger 
            className="w-full sm:w-auto !border-[#E8E8E8] focus:ring-0 focus:ring-offset-0"
            style={{
              minWidth: workflowWidth,
            }}
          >
            <SelectValue placeholder="Select a workflow..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Workflows</SelectItem>
            {workflowOptions.map((workflow) => (
              <SelectItem key={workflow} value={workflow}>
                {workflow}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={daysFilter.toString()} onValueChange={(value) => onDaysChange(parseInt(value))}>
          <SelectTrigger className="w-full sm:w-[200px] !border-[#E8E8E8] focus:ring-0 focus:ring-offset-0">
            <SelectValue placeholder="Time period" />
          </SelectTrigger>
          <SelectContent>
            {daysOptions.map((option) => (
              <SelectItem key={option.value} value={option.value.toString()}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex gap-2 flex-shrink-0">
        <button
          onClick={() => onShowOnlyWorkDoneChange(true)}
          className="transition-opacity"
        >
          <Badge
            variant={showOnlyWorkDone ? 'default' : 'outline'}
            className="cursor-pointer hover:opacity-80 text-sm whitespace-nowrap"
          >
            Work Done
          </Badge>
        </button>
        <button
          onClick={() => onShowOnlyWorkDoneChange(false)}
          className="transition-opacity"
        >
          <Badge
            variant={!showOnlyWorkDone ? 'default' : 'outline'}
            className="cursor-pointer hover:opacity-80 text-sm whitespace-nowrap"
          >
            Show All
          </Badge>
        </button>
      </div>
    </div>
  )
}

