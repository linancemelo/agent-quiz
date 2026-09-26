import { Link, useNavigate, useParams } from 'react-router-dom'
import { getModule, getUnit } from '@/data'
import { useProgressStore } from '@/stores/progressStore'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Play, RotateCcw } from 'lucide-react'

function renderMarkdownLite(md: string) {
  // very small subset for lesson display
  return md
    .split('\n')
    .map((line) => {
      if (line.startsWith('## ')) return `<h2>${line.slice(3)}</h2>`
      if (line.startsWith('### ')) return `<h3>${line.slice(4)}</h3>`
      if (line.startsWith('- ')) {
        return `<li>${line.slice(2).replace(/`([^`]+)`/g, '<code>$1</code>').replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')}</li>`
      }
      if (line.trim() === '') return '<br/>'
      return `<p>${line.replace(/`([^`]+)`/g, '<code>$1</code>').replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')}</p>`
    })
    .join('\n')
    .replace(/(<li>[\s\S]*?<\/li>\n?)+/g, (m) => `<ul>${m}</ul>`)
}

export function UnitPage() {
  const { unitId = '' } = useParams()
  const unit = getUnit(unitId)
  const navigate = useNavigate()
  const progress = useProgressStore((s) => s.unitProgress[unitId])

  if (!unit) {
    return (
      <div className="rounded-2xl border border-dashed p-10 text-center">
        <p className="text-4xl mb-2">🧩</p>
        <p>這個單元跑丟了。</p>
        <Button asChild className="mt-4" variant="secondary">
          <Link to="/">回地圖</Link>
        </Button>
      </div>
    )
  }

  const mod = getModule(unit.moduleId)
  const wrongCount = progress?.wrongQuestionIds.length ?? 0

  return (
    <div className="space-y-6 animate-slide-up">
      <Button asChild variant="ghost" size="sm">
        <Link to={`/modules/${unit.moduleId}`}>
          <ArrowLeft className="h-4 w-4" />
          {mod?.title ?? '模組'}
        </Link>
      </Button>

      <div className="space-y-2">
        <div className="flex flex-wrap gap-2">
          <Badge variant="fun">{mod?.emoji} {mod?.title}</Badge>
          <Badge variant="secondary">{unit.questions.length} 題</Badge>
          <Badge variant="outline">{unit.difficulty}</Badge>
        </div>
        <h1 className="text-3xl font-black">{unit.title}</h1>
        <p className="text-muted-foreground">{unit.summary}</p>
        <p className="text-xs text-muted-foreground">來源筆記：{unit.sourceNote}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>單元速覽 ✨</CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className="prose-lesson"
            dangerouslySetInnerHTML={{ __html: renderMarkdownLite(unit.lesson.markdown) }}
          />
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-3">
        <Button size="lg" onClick={() => navigate(`/units/${unit.id}/quiz`)}>
          <Play className="h-5 w-5" />
          {progress?.completed ? '再練一次' : '開始測驗'}
        </Button>
        {wrongCount > 0 && (
          <Button
            size="lg"
            variant="outline"
            onClick={() => navigate(`/units/${unit.id}/quiz?mode=wrong`)}
          >
            <RotateCcw className="h-5 w-5" />
            只練錯題（{wrongCount}）
          </Button>
        )}
      </div>

      {progress && progress.bestTotal > 0 && (
        <p className="text-sm text-muted-foreground">
          最佳成績 {progress.bestScore}/{progress.bestTotal}
          {progress.completed ? ' · 已通關 🎊' : ''} · 嘗試 {progress.attempts} 次
        </p>
      )}
    </div>
  )
}
