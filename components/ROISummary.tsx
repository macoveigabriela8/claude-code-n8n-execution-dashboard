'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { getClientROISummary } from '@/lib/supabase'
import { ClientROISummary } from '@/types/supabase'
import { formatCurrency, formatHours } from '@/lib/utils'
import { Clock, Activity, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'

interface ROISummaryProps {
  clientId: string
}

export default function ROISummary({ clientId }: ROISummaryProps) {
  const [data, setData] = useState<ClientROISummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        const result = await getClientROISummary(clientId)
        setData(result)
      } catch (err) {
        console.error('Error loading ROI summary:', err)
        const errorMessage = err instanceof Error ? err.message : String(err)
        setError(`Failed to load ROI summary: ${errorMessage}`)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [clientId])

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-8">
            <Skeleton className="h-16 w-48 mb-4" />
            <Skeleton className="h-4 w-64" />
          </CardContent>
        </Card>
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-8 w-24 mb-2" />
                <Skeleton className="h-4 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
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
          <h3 className="text-lg font-semibold mb-2">No ROI Data Available</h3>
          <p className="text-sm text-muted-foreground text-center max-w-md">
            No ROI configuration found for this client. Configure ROI parameters to see value metrics.
          </p>
        </CardContent>
      </Card>
    )
  }

  const currency = data.currency_code || 'GBP'
  const totalHoursSaved = data.total_hours_saved || 0
  const totalLaborCostSaved = data.total_labor_cost_saved || 0
  const totalValueCreated = data.total_value_created || 0
  const totalImplementationCosts = data.total_implementation_costs || 0
  const totalToolCosts = data.total_tool_costs || 0
  const totalAutomationCost = data.total_automation_cost || 0
  // Net ROI = (Labor Cost Saved + Value Created) - Total Automation Cost
  const netROI = (totalLaborCostSaved + totalValueCreated) - totalAutomationCost

  return (
    <div className="space-y-6">
      {/* Hero Section - Net ROI */}
      <Card className="bg-gradient-to-r from-primary/10 via-primary/5 to-background border-primary/30 shadow-xl">
        <CardContent className="p-8">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-muted-foreground mb-2">ROI Since deployment</p>
              <div className={`text-5xl md:text-6xl font-bold ${netROI >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(netROI, currency)}
              </div>
            </div>
            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="h-10 w-10">
                  <Info className="h-5 w-5" />
                  <span className="sr-only">View breakdown</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-full sm:max-w-md">
                <SheetHeader>
                  <SheetTitle>ROI Breakdown Details</SheetTitle>
                </SheetHeader>
                <div className="mt-6 space-y-6">
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">Labor Cost Saved</p>
                      <p className="text-2xl font-semibold text-green-600">
                        {formatCurrency(totalLaborCostSaved, currency)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">Value Created</p>
                      <p className="text-2xl font-semibold text-green-600">
                        {formatCurrency(totalValueCreated, currency)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">Implementation Costs</p>
                      <p className="text-2xl font-semibold text-destructive">
                        {formatCurrency(totalImplementationCosts, currency)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">Tool Costs</p>
                      <p className="text-2xl font-semibold text-destructive">
                        {formatCurrency(totalToolCosts, currency)}
                      </p>
                    </div>
                  </div>
                  <div className="pt-4 border-t">
                    <div className="flex items-center justify-between">
                      <p className="text-base font-medium">Total Automation Cost</p>
                      <p className="text-xl font-semibold text-destructive">
                        {formatCurrency(totalAutomationCost, currency)}
                      </p>
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </CardContent>
      </Card>

      {/* Metric Cards Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="hover:shadow-lg transition-shadow duration-200 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-muted-foreground">Hours Saved</span>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-3xl font-bold">{formatHours(totalHoursSaved * 60)}</div>
            <p className="text-xs text-muted-foreground mt-1">Since deployment</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow duration-200 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-muted-foreground">Workflows</span>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-3xl font-bold">{data.workflows_with_roi || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">With ROI configured</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

