'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import KPICards from '@/components/KPICards'
import WorkflowROIContribution from '@/components/WorkflowROIContribution'
import SuccessRateGauge from '@/components/SuccessRateGauge'
import ExecutionTrendChart from '@/components/ExecutionTrendChart'
import ExecutionHistoryTable from '@/components/ExecutionHistoryTable'
import ClientName from '@/components/ClientName'
import { User } from 'lucide-react'
import { Colors } from '@/lib/design-tokens'

function DashboardContent() {
  const searchParams = useSearchParams()
  const clientId = searchParams.get('clientId')

  if (!clientId) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive mb-2">Missing Client ID</h1>
          <p className="text-muted-foreground">
            Please provide a clientId query parameter in the URL.
            <br />
            Example: /dashboard?clientId=your-client-id
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto" style={{ maxWidth: '1600px', width: '100%', padding: '0 16px' }}>
        {/* Header */}
        <div className="sticky top-0 z-10" style={{ backgroundColor: Colors.dashboard.header.background.rgb, color: Colors.dashboard.header.text.rgb }}>
          <div style={{ height: '30px', display: 'flex', alignItems: 'center', paddingLeft: '16px', paddingRight: '16px' }}>
            <div className="flex items-center justify-between w-full" style={{ gap: '16px' }}>
              <div style={{ minWidth: 0, flexShrink: 1 }}>
                <h1 className="text-base font-medium" style={{ fontSize: '18px', lineHeight: '25px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>AI Automation ROI</h1>
              </div>
              <div className="flex items-center gap-2" style={{ minWidth: 0, flexShrink: 0 }}>
                <Suspense fallback={<div className="h-5 w-32 bg-white/20 animate-pulse rounded" />}>
                  <div className="flex items-center gap-2 text-sm md:text-base text-white" style={{ whiteSpace: 'nowrap' }}>
                    <User className="h-4 w-4 md:h-5 md:w-5 flex-shrink-0" />
                    <ClientName clientId={clientId} />
                  </div>
                </Suspense>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div>
          <div>
            {/* KPI Cards */}
            <section>
              <Suspense fallback={<div>Loading KPI cards...</div>}>
                <KPICards clientId={clientId} />
              </Suspense>
            </section>

            {/* Workflow ROI Contribution */}
            <section>
              <Suspense fallback={<div>Loading workflow ROI contribution...</div>}>
                <WorkflowROIContribution clientId={clientId} />
              </Suspense>
            </section>

            {/* Success Rate Gauge and Execution Trend - Side by Side */}
            <section style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '8px', marginTop: '8px', alignItems: 'stretch' }}>
              <Suspense fallback={<div style={{ minWidth: 0 }}>Loading success rate...</div>}>
                <div style={{ minWidth: 0 }}>
                  <SuccessRateGauge clientId={clientId} />
                </div>
              </Suspense>
              <Suspense fallback={<div style={{ minWidth: 0 }}>Loading execution trend...</div>}>
                <div style={{ minWidth: 0 }}>
                  <ExecutionTrendChart clientId={clientId} />
                </div>
              </Suspense>
            </section>

            {/* Execution History Table */}
            <section>
              <Suspense fallback={<div>Loading execution history...</div>}>
                <ExecutionHistoryTable clientId={clientId} />
              </Suspense>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center">Loading...</div>}>
      <DashboardContent />
    </Suspense>
  )
}

