import { Link, Navigate, useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { getModule } from '@/data'
import { useProgressStore } from '@/stores/progressStore'
import { isModuleComplete } from '@/lib/progress'
import { CertificateCard } from '@/components/CertificateCard'
import { ConfettiBurst } from '@/components/ConfettiBurst'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowLeft } from 'lucide-react'

export function CertificatePage() {
  const { moduleId = '' } = useParams()
  const mod = getModule(moduleId)
  const unitProgress = useProgressStore((s) => s.unitProgress)
  const learnerName = useProgressStore((s) => s.learnerName)
  const certificates = useProgressStore((s) => s.certificates)
  const issueCertificate = useProgressStore((s) => s.issueCertificate)
  const setLearnerName = useProgressStore((s) => s.setLearnerName)
  const [name, setName] = useState(learnerName || '')
  const [celebrateIssue, setCelebrateIssue] = useState(false)

  useEffect(() => {
    setName(learnerName || '')
  }, [learnerName])

  if (!mod) return <Navigate to="/" replace />

  const complete = isModuleComplete(mod.unitIds, unitProgress)
  const doneCount = mod.unitIds.filter((id) => unitProgress[id]?.completed).length

  if (!complete) {
    return (
      <div className="rounded-2xl border border-dashed p-10 text-center animate-slide-up">
        <p className="text-5xl mb-3">🔒</p>
        <h1 className="text-xl font-bold">還沒通關喔</h1>
        <p className="mt-2 text-muted-foreground">
          完成「{mod.title}」全部單元的<strong className="text-foreground">完整測驗全對</strong>
          後才能領證明。
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          目前進度：{doneCount} / {mod.unitIds.length} 單元通關
          （錯題特訓全對不算通關唷）
        </p>
        <Button asChild className="mt-4">
          <Link to={`/modules/${mod.id}`}>繼續挑戰</Link>
        </Button>
      </div>
    )
  }

  const cert = certificates[mod.id]

  return (
    <div className="mx-auto max-w-xl space-y-6 animate-slide-up">
      {celebrateIssue && (
        <ConfettiBurst onDone={() => setCelebrateIssue(false)} />
      )}
      <Button asChild variant="ghost" size="sm" className="no-print">
        <Link to={`/modules/${mod.id}`}>
          <ArrowLeft className="h-4 w-4" />
          回模組
        </Link>
      </Button>

      {!cert ? (
        <div className="rounded-3xl border border-amber-300/30 bg-card/80 p-6 space-y-4 text-center">
          <p className="text-5xl">🎊</p>
          <h1 className="text-2xl font-black">恭喜通關！留下名字領證明</h1>
          <p className="text-sm text-muted-foreground">
            {mod.emoji} {mod.title} · 全部單元已完美通關
          </p>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="你的名字或暱稱"
            className="mx-auto max-w-xs text-center text-lg"
          />
          <Button
            variant="fun"
            size="lg"
            onClick={() => {
              const n = name.trim() || '學習旅人'
              setLearnerName(n)
              issueCertificate(mod.id, n)
              setCelebrateIssue(true)
            }}
          >
            產生我的證明 ✨
          </Button>
        </div>
      ) : (
        <CertificateCard
          cert={cert}
          moduleTitle={mod.title}
          moduleEmoji={mod.emoji}
        />
      )}
    </div>
  )
}
