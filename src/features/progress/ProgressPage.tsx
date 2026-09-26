import { Link } from 'react-router-dom'
import { curriculum, findQuestion, getUnit, stats } from '@/data'
import { useProgressStore } from '@/stores/progressStore'
import { isModuleComplete, moduleCompletionRate } from '@/lib/progress'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ProgressBar } from '@/components/ProgressBar'
import { Badge } from '@/components/ui/badge'
import { Award, Trash2, RotateCcw } from 'lucide-react'
import { useEffect, useState } from 'react'

export function ProgressPage() {
  const {
    unitProgress,
    wrongBook,
    learnerName,
    setLearnerName,
    clearWrong,
    clearAllWrong,
    resetAll,
  } = useProgressStore()
  const [name, setName] = useState(learnerName)
  const s = stats()

  useEffect(() => {
    setName(learnerName)
  }, [learnerName])

  const completedUnits = Object.values(unitProgress).filter((u) => u.completed).length

  return (
    <div className="space-y-6 animate-slide-up">
      <div>
        <h1 className="text-3xl font-black">進度與錯題本 📈</h1>
        <p className="text-muted-foreground">你的冒險日誌存在本機瀏覽器，換電腦可就不在喔。</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>學習者暱稱</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="例如：Agent 練習生"
            className="max-w-xs"
          />
          <Button
            onClick={() => setLearnerName(name.trim() || '學習旅人')}
            variant="secondary"
          >
            儲存
          </Button>
          {learnerName && (
            <span className="self-center text-sm text-muted-foreground">
              目前：{learnerName}
            </span>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-3xl font-black text-fuchsia-300">{completedUnits}</p>
            <p className="text-sm text-muted-foreground">已通關單元 / {s.units}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-3xl font-black text-cyan-300">{wrongBook.length}</p>
            <p className="text-sm text-muted-foreground">錯題本張數</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-3xl font-black text-amber-300">{s.questions}</p>
            <p className="text-sm text-muted-foreground">題庫總題數</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>各模組進度</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {curriculum.modules.map((m) => {
            const rate = moduleCompletionRate(m.unitIds, unitProgress)
            const unlocked = isModuleComplete(m.unitIds, unitProgress)
            return (
              <div key={m.id} className="space-y-1">
                <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                  <Link to={`/modules/${m.id}`} className="hover:text-fuchsia-200">
                    {m.emoji} {m.title}
                  </Link>
                  {unlocked ? (
                    <Link to={`/certificate/${m.id}`}>
                      <Badge variant="success" className="gap-1 text-[10px]">
                        <Award className="h-3 w-3" />
                        可領證明
                      </Badge>
                    </Link>
                  ) : rate === 100 ? (
                    <Badge variant="success" className="text-[10px]">
                      可領證明
                    </Badge>
                  ) : null}
                </div>
                <ProgressBar value={rate} />
              </div>
            )
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle>錯題本 {wrongBook.length === 0 ? '（空空如也 ✨）' : ''}</CardTitle>
          {wrongBook.length > 0 && (
            <Button variant="ghost" size="sm" onClick={clearAllWrong}>
              <Trash2 className="h-4 w-4" />
              清空
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-3">
          {wrongBook.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border p-8 text-center">
              <p className="text-4xl mb-2">🦄</p>
              <p className="text-muted-foreground">
                還沒有錯題——要嘛你超強，要嘛還沒開始練。去地圖挑一關吧！
              </p>
            </div>
          ) : (
            wrongBook.map((w) => {
              const unit = getUnit(w.unitId)
              const question = findQuestion(w.unitId, w.questionId)
              return (
                <div
                  key={`${w.unitId}-${w.questionId}`}
                  className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-border/60 bg-muted/20 p-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-muted-foreground">
                      {unit?.title ?? w.unitId}
                    </p>
                    <p className="text-sm font-medium">
                      {question?.prompt ?? w.questionId}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button asChild size="sm" variant="outline">
                      <Link to={`/units/${w.unitId}/quiz?mode=wrong`}>
                        <RotateCcw className="h-3.5 w-3.5" />
                        重做
                      </Link>
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => clearWrong(w.questionId)}>
                      移除
                    </Button>
                  </div>
                </div>
              )
            })
          )}
        </CardContent>
      </Card>

      <Button
        variant="destructive"
        size="sm"
        onClick={() => {
          if (confirm('確定要清除所有本地進度？此動作無法復原。')) resetAll()
        }}
      >
        重置全部進度
      </Button>
    </div>
  )
}
