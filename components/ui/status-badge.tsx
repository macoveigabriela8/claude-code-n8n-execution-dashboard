import { CheckCircle, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Colors } from '@/lib/design-tokens'

interface StatusBadgeProps {
  status: 'success' | 'error'
  className?: string
}

const statusConfigs = {
  success: { 
    bgColor: Colors.main.default.green.hex,
    textColor: Colors.main.default.green.hex,
    icon: CheckCircle, 
    label: 'Success' 
  },
  error: { 
    bgColor: Colors.main.default.red.hex,
    textColor: Colors.main.default.red.hex,
    icon: XCircle, 
    label: 'Error' 
  },
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfigs[status] || statusConfigs.error
  const Icon = config.icon
  
  return (
    <span 
      className={cn('inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium', className)}
      style={{
        backgroundColor: `${config.bgColor}33`, // 20% opacity (33 in hex = ~20%)
        color: config.textColor,
      }}
    >
      <Icon size={14} />
      {config.label}
    </span>
  )
}

