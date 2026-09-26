import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

export function ProgressBar({
  value,
  label,
  className,
}: {
  value: number
  label?: string
  className?: string
}) {
  return (
    <div className={cn('space-y-1.5', className)}>
      {label && (
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{label}</span>
          <span className="font-semibold text-fuchsia-300">{Math.round(value)}%</span>
        </div>
      )}
      <Progress value={value} />
    </div>
  )
}
