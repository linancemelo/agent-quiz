import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]',
  {
    variants: {
      variant: {
        default:
          'bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white shadow-lg shadow-violet-500/30 hover:brightness-110',
        secondary:
          'bg-secondary text-secondary-foreground hover:bg-muted border border-border',
        outline:
          'border-2 border-violet-400/40 bg-transparent hover:bg-violet-500/10 text-foreground',
        ghost: 'hover:bg-muted text-muted-foreground hover:text-foreground',
        success:
          'bg-gradient-to-r from-emerald-500 to-lime-400 text-emerald-950 shadow-lg shadow-emerald-500/25',
        fun: 'bg-gradient-to-r from-cyan-400 via-fuchsia-400 to-orange-400 text-slate-900 shadow-lg',
        destructive: 'bg-rose-500 text-white hover:bg-rose-400',
      },
      size: {
        default: 'h-11 px-5 py-2',
        sm: 'h-9 rounded-lg px-3 text-xs',
        lg: 'h-12 rounded-2xl px-8 text-base',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  },
)
Button.displayName = 'Button'
