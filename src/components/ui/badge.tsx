import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-violet-500/20 text-violet-200',
        secondary: 'border-transparent bg-muted text-muted-foreground',
        success: 'border-transparent bg-emerald-500/20 text-emerald-300',
        warning: 'border-transparent bg-amber-500/20 text-amber-300',
        fun: 'border-transparent bg-gradient-to-r from-pink-500/30 to-cyan-500/30 text-pink-100',
        outline: 'text-foreground border-border',
      },
    },
    defaultVariants: { variant: 'default' },
  },
)

export function Badge({
  className,
  variant,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof badgeVariants>) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}
