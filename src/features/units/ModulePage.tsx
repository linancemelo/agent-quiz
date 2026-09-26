import { Link, useParams } from 'react-router-dom'
import { getModule, getModuleUnits } from '@/data'
import { useProgressStore } from '@/stores/progressStore'
import { isModuleComplete, moduleCompletionRate } from '@/lib/progress'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ProgressBar } from '@/components/ProgressBar'
import { ArrowLeft, Award, CheckCircle2, Circle } from 'lucide-react'

export function ModulePage() {
  const { moduleId = '' } = useParams()
  const mod = getModule(moduleId)
  const units = getModuleUnits(moduleId)
  const unitProgress = useProgressStore((s) => s.unitProgress)

  if (!mod) {
    return (
      <div className="rounded-2xl border border-dashed border-border p-10 text-center">
        <p className="text-4xl mb-2">👻</p>
        <p>找不到這個模組耶。回地圖看看？</p>
        <Button asChild className="mt-4" variant="secondary">
          <Link to="/">回學習地圖</Link>
        </Button>
      </div>
    )
  }

  const rate = moduleCompletionRate(mod.unitIds, unitProgress)
  const complete = isModuleComplete(mod.unitIds, unitProgress)

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex flex-wrap items-center gap-3">
        <Button asChild variant="ghost" size="sm">
          <Link to="/">
            <ArrowLeft className="h-4 w-4" />
            地圖
          </Link>
        </Button>
        {complete && (
          <Button asChild variant="fun" size="sm">
            <Link to={`/certificate/${mod.id}`}>
              <Award className="h-4 w-4" />
              領取證明
            </Link>
          </Button>
        )}
      </div>

      <div className="rounded-3xl border border-border/60 bg-card/60 p-6">
        <div className="flex items-center gap-3">
          <span className="text-4xl">{mod.emoji}</span>
          <div>
            <h1 className="text-2xl font-black">
              {mod.order}. {mod.title}
            </h1>
            <p className="text-muted-foreground">{mod.blurb}</p>
          </div>
        </div>
        <div className="mt-4">
          <ProgressBar value={rate} label="模組進度" />
        </div>
      </div>

      <div className="grid gap-3">
        {units.map((u) => {
          const p = unitProgress[u.id]
          const done = p?.completed
          return (
            <Link key={u.id} to={`/units/${u.id}`}>
              <Card className="transition-all hover:border-fuchsia-400/50 hover:bg-fuchsia-500/5">
                <CardHeader className="flex-row items-center gap-4 space-y-0 py-4">
                  {done ? (
                    <CheckCircle2 className="h-6 w-6 shrink-0 text-emerald-400" />
                  ) : (
                    <Circle className="h-6 w-6 shrink-0 text-muted-foreground" />
                  )}
                  <div className="min-w-0 flex-1">
                    <CardTitle className="text-base">
                      {u.order}. {u.title}
                    </CardTitle>
                    <p className="mt-1 truncate text-sm text-muted-foreground">{u.summary}</p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <Badge variant="secondary">{u.questions.length} 題</Badge>
                    {p && p.bestTotal > 0 && (
                      <span className="text-xs text-muted-foreground">
                        最佳 {p.bestScore}/{p.bestTotal}
                      </span>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="pt-0 pb-3 pl-14 text-xs text-muted-foreground">
                  來源：{u.sourceNote}
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
