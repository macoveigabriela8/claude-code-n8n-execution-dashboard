'use client'

import { useEffect, useState } from 'react'
import { getClientSummary } from '@/lib/supabase'
import { Skeleton } from '@/components/ui/skeleton'

interface ClientNameProps {
  clientId: string
}

export default function ClientName({ clientId }: ClientNameProps) {
  const [clientName, setClientName] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const result = await getClientSummary(clientId)
        setClientName(result?.client_name || null)
      } catch (err) {
        console.error('Error loading client name:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [clientId])

  if (loading) {
    return <Skeleton className="h-5 w-48" />
  }

  return (
    <span style={{ color: 'white', fontSize: '14px' }}>
      {clientName || clientId}
    </span>
  )
}

