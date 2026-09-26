import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { curriculum, getUnit, stats } from '@/data'
import { useProgressStore } from '@/stores/progressStore'
import { moduleCompletionRate } from '@/lib/progress'
import { loadQuizDraft } from '@/lib/quizDraft'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ProgressBar } from '@/components/ProgressBar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowRight, Award, Compass, PartyPopper, Play, Rocket } from 'lucide-react'

export function LearningMapPage() {
  const unitProgress = useProgressStore((s) => s.unitProgress)
  const s = stats()
  const overall =
    curriculum.modules.reduce(
      (acc, m) => acc + moduleCompletionRate(m.unitIds, unitProgress),
      0,
    ) / Math.max(curriculum.modules.length, 1)

  const progressKeys = Object.keys(unitProgress)
  const draft = loadQuizDraft()
  const draftUnit = draft ? getUnit(draft.unitId) : undefined
  const isFirstRun = progressKeys.length === 0 && !draft

  let resumeUnitId: string | undefined
  let latestAt = ''
  for (const [id, up] of Object.entries(unitProgress)) {
    if (!up.lastAttemptAt) continue
    if (!latestAt || up.lastAttemptAt > latestAt) {
      latestAt = up.lastAttemptAt
      resumeUnitId = id
    }
  }
  const resumeUnit = resumeUnitId ? getUnit(resumeUnitId) : undefined
  const firstUnitId = curriculum.modules[0]?.unitIds[0]
  const moduleGridRef = useRef<HTMLDivElement>(null)

  const draftQuizTo =
    draft && draftUnit
      ? draft.mode === 'attempt'
        ? `/units/${draft.unitId}/quiz?mode=attempt`
        : draft.mode === 'wrong-only'
          ? `/units/${draft.unitId}/quiz?mode=wrong`
          : `/units/${draft.unitId}/quiz`
      : null

  const scrollToModules = () => {
    moduleGridRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="space-y-8 animate-slide-up">
      <section className="relative overflow-hidden rounded-3xl border border-violet-400/30 bg-gradient-to-br from-violet-600/30 via-fuchsia-600/20 to-cyan-600/20 p-6 sm:p-8">
        <div className="relative z-10 max-w-2xl space-y-3">
          <Badge variant="fun" className="animate-pulse-glow">
            {draft && draftUnit ? (
              <>
                <Play className="mr-1 h-3.5 w-3.5" />
                測驗進行中
              </>
            ) : isFirstRun ? (
              <>
                <Rocket className="mr-1 h-3.5 w-3.5" />
                初次冒險？
              </>
            ) : (
              <>
                <PartyPopper className="mr-1 h-3.5 w-3.5" />
                歡迎回來，冒險者
              </>
            )}
          </Badge>
          <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
            {curriculum.title}
          </h1>
          <p className="text-muted-foreground leading-relaxed">
            {isFirstRun
              ? '第一次來？挑一關開始就好——錯了沒關係，錯題本會陪你練到會。'
              : (curriculum.subtitle ??
                '學習地圖 → 單元說明 → 一步一題 → 即時回饋。錯了沒關係，錯題本會陪你練到會。')}
          </p>
          <div className="flex flex-wrap gap-3 pt-2 text-sm">
            <span className="rounded-full bg-black/30 px-3 py-1">{s.modules} 模組</span>
            <span className="rounded-full bg-black/30 px-3 py-1">{s.units} 單元</span>
            <span className="rounded-full bg-black/30 px-3 py-1">{s.questions} 題</span>
          </div>
          <div className="flex flex-wrap items-center gap-2 pt-3">
            {draftQuizTo && draftUnit ? (
              <Button asChild variant="fun" size="lg">
                <Link to={draftQuizTo}>
                  <Play className="h-4 w-4" />
                  繼續未完成的測驗：{draftUnit.title}
                </Link>
              </Button>
            ) : resumeUnit ? (
              <Button asChild size="lg">
                <Link to={`/units/${resumeUnit.id}`}>
                  <ArrowRight className="h-4 w-4" />
                  繼續上次：{resumeUnit.title}
                </Link>
              </Button>
            ) : isFirstRun && firstUnitId ? (
              <Button asChild variant="fun" size="lg">
                <Link to={`/units/${firstUnitId}`}>
                  <Rocket className="h-4 w-4" />
                  挑第一關出發
                </Link>
              </Button>
            ) : null}
            <Button type="button" variant="secondary" size="lg" onClick={scrollToModules}>
              <Compass className="h-4 w-4" />
              逛學習地圖
            </Button>
          </div>
          <div className="pt-2">
            <ProgressBar value={overall} label="全站完成率" />
          </div>
        </div>
        <div className="pointer-events-none absolute -right-4 bottom-0 text-8xl opacity-30 animate-float">
          🗺️
        </div>
      </section>

      <div ref={moduleGridRef} className="grid gap-4 sm:grid-cols-2">
        {curriculum.modules.map((m) => {
          const rate = moduleCompletionRate(m.unitIds, unitProgress)
          const done = rate === 100
          return (
            <Card
              key={m.id}
              className="h-full transition-all duration-300 hover:-translate-y-1 hover:border-violet-400/60 hover:shadow-violet-500/20"
            >
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <span className="text-3xl">{m.emoji ?? '📘'}</span>
                  {done ? (
                    <Badge variant="success">已通關 🎉</Badge>
                  ) : rate > 0 ? (
                    <Badge variant="warning">進行中</Badge>
                  ) : (
                    <Badge variant="secondary">尚未開始</Badge>
                  )}
                </div>
                <CardTitle className="transition-colors hover:text-fuchsia-200">
                  <Link to={`/modules/${m.id}`} className="stretched-link-safe">
                    {m.order}. {m.title}
                  </Link>
                </CardTitle>
                <CardDescription>{m.blurb}</CardDescription>
              </CardHeader>
              <CardContent className="relative z-10 space-y-3">
                <ProgressBar value={rate} label={`${m.unitIds.length} 個單元`} />
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    to={`/modules/${m.id}`}
                    className="inline-flex items-center text-sm font-medium text-violet-300 hover:text-violet-200"
                  >
                    進入模組
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                  {done && (
                    <Link
                      to={`/certificate/${m.id}`}
                      className="inline-flex items-center gap-1 rounded-full bg-amber-400/20 px-2.5 py-1 text-xs font-semibold text-amber-200 hover:bg-amber-400/30"
                    >
                      <Award className="h-3.5 w-3.5" />
                      領取證明
                    </Link>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
