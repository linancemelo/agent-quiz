import { Link, useParams } from 'react-router-dom'
import { getUnit } from '@/data'
import { loadLastAttempt } from '@/lib/lastAttempt'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ProgressBar } from '@/components/ProgressBar'
import { ConfettiBurst } from '@/components/ConfettiBurst'
import { RotateCcw, Home, BookOpen, Sparkles } from 'lucide-react'

export function ResultPage() {
  const { unitId = '' } = useParams()
  const unit = getUnit(unitId)

  // Fresh read every render so pruneLastAttempt (progress 清除) stays in sync
  const attempt = loadLastAttempt(unitId)

  if (!unit) {
    return (
      <div className="rounded-2xl border border-dashed p-10 text-center animate-slide-up">
        <p className="text-4xl mb-2">🧭</p>
        <p className="font-semibold">找不到這個單元</p>
        <p className="mt-2 text-sm text-muted-foreground">
          也許網址打錯了，或題庫還沒載入。回地圖重新挑一關吧！
        </p>
        <Button asChild className="mt-4">
          <Link to="/">回學習地圖</Link>
        </Button>
      </div>
    )
  }

  if (!attempt) {
    return (
      <div className="rounded-2xl border border-dashed p-10 text-center animate-slide-up">
        <p className="text-4xl mb-2">📭</p>
        <p className="font-semibold">還沒有本次測驗紀錄</p>
        <p className="mt-2 text-sm text-muted-foreground">先去跑一輪測驗，結果會出現在這裡。</p>
        <Button asChild className="mt-4">
          <Link to={`/units/${unit.id}/quiz`}>開始測驗</Link>
        </Button>
      </div>
    )
  }

  // L-v1.1-1: always from THIS attempt snapshot (already pruned if cleared)
  const attemptWrongs = attempt.wrongQuestionIds
  const wrongItems = attempt.wrongItems.filter((w) =>
    attemptWrongs.includes(w.questionId),
  )
  const { score: correct, total, mode } = attempt
  const pct = total ? Math.round((correct / total) * 100) : 0
  const perfect = correct === total && total > 0
  const showAttemptRedo = attemptWrongs.length > 0
  const celebratePerfect = perfect && mode === 'full'

  return (
    <div className="mx-auto max-w-2xl space-y-6 animate-bounce-in">
      {celebratePerfect && <ConfettiBurst />}
      <Card className="overflow-hidden border-violet-400/40">
        <div
          className={
            perfect
              ? 'bg-gradient-to-r from-emerald-500/30 via-lime-400/20 to-cyan-400/30 p-8 text-center'
              : 'bg-gradient-to-r from-violet-500/30 via-fuchsia-500/20 to-orange-400/20 p-8 text-center'
          }
        >
          <p className="text-6xl mb-3">{perfect ? '🏆' : pct >= 60 ? '🌟' : '💪'}</p>
          <h1 className="text-3xl font-black">
            {perfect
              ? mode === 'full'
                ? '全對！你是今日主角！'
                : '錯題全剋！太強了！'
              : pct >= 60
                ? '不錯喔，再補一點就完美'
                : '沒關係，錯題本已備好'}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            本次成績
            {mode === 'full'
              ? '（完整測驗）'
              : mode === 'attempt'
                ? '（本次錯題）'
                : '（錯題特訓）'}
          </p>
          <p className="mt-2 text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-200 to-cyan-200">
            {correct} / {total}
          </p>
          <div className="mx-auto mt-4 max-w-xs">
            <ProgressBar value={pct} label="正確率" />
          </div>
        </div>
        <CardContent className="flex flex-wrap justify-center gap-3 pt-6">
          <Button asChild>
            <Link to={`/units/${unit.id}/quiz`}>
              <RotateCcw className="h-4 w-4" />
              再測一次
            </Link>
          </Button>
          {showAttemptRedo && (
            <Button asChild variant="outline">
              <Link to={`/units/${unit.id}/quiz?mode=attempt`}>
                只練這次的錯題（{attemptWrongs.length}）
              </Link>
            </Button>
          )}
          <Button asChild variant="secondary">
            <Link to={`/units/${unit.id}`}>
              <BookOpen className="h-4 w-4" />
              回單元說明
            </Link>
          </Button>
          <Button asChild variant="ghost">
            <Link to={`/modules/${unit.moduleId}`}>
              <Home className="h-4 w-4" />
              模組列表
            </Link>
          </Button>
        </CardContent>
      </Card>

      {wrongItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-amber-300" />
              本次錯過的題
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {wrongItems.map((item) => (
              <div
                key={item.questionId}
                className="rounded-xl border border-border/60 bg-muted/30 p-3"
              >
                <div className="mb-1 flex gap-2">
                  <Badge variant="warning">需複習</Badge>
                </div>
                <p className="text-sm font-medium">{item.prompt}</p>
                <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                  {item.explanation}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
