import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import { Colors } from "@/lib/design-tokens"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
        success:
          "border-transparent bg-green-600 text-white hover:bg-green-700",
        error:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  const baseClasses = badgeVariants({ variant })
  
  // Apply palette colors for success variant using inline styles
  if (variant === 'success') {
    return (
      <div 
        className={cn(baseClasses, className)} 
        style={{
          borderColor: 'transparent',
          backgroundColor: Colors.main.default.green.hex,
          color: Colors.dashboard.header.text.hex,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = Colors.main.default.green.hex + 'DD' // Slightly darker on hover
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = Colors.main.default.green.hex
        }}
        {...props} 
      />
    )
  }
  
  return (
    <div className={cn(baseClasses, className)} {...props} />
  )
}

export { Badge, badgeVariants }

