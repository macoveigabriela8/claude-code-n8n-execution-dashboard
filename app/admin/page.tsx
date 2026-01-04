'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import ROIWorkflowList from '@/components/admin/ROIWorkflowList'
import ToolCostManager from '@/components/admin/ToolCostManager'
import ClientName from '@/components/ClientName'

function AdminContent() {
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
            Example: /admin?clientId=your-client-id
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="p-4 md:p-6">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">ROI Configuration Admin</h1>
            <div className="mt-2">
              <Suspense fallback={<div className="h-5 w-48 bg-muted animate-pulse rounded" />}>
                <ClientName clientId={clientId} />
              </Suspense>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 md:p-6 space-y-6">
          <Suspense fallback={<div>Loading tool costs...</div>}>
            <ToolCostManager clientId={clientId} />
          </Suspense>
          <Suspense fallback={<div>Loading workflows...</div>}>
            <ROIWorkflowList clientId={clientId} />
          </Suspense>
        </div>
      </div>
    </div>
  )
}

export default function AdminPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center">Loading...</div>}>
      <AdminContent />
    </Suspense>
  )
}

