import { Award, Printer } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { ModuleCertificate } from '@/types'

export function CertificateCard({
  cert,
  moduleTitle,
  moduleEmoji,
}: {
  cert: ModuleCertificate
  moduleTitle: string
  moduleEmoji?: string
}) {
  const date = new Date(cert.completedAt)
  const dateStr = date.toLocaleString('zh-TW', {
    timeZone: 'Asia/Taipei',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <div className="relative overflow-hidden rounded-3xl border-2 border-amber-300/40 bg-gradient-to-br from-violet-950 via-fuchsia-950 to-cyan-950 p-8 shadow-2xl animate-bounce-in">
      <div className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-amber-400/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-cyan-400/20 blur-3xl" />

      <div className="relative space-y-6 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-300 to-orange-400 text-3xl shadow-lg animate-wiggle">
          {moduleEmoji ?? <Award className="h-8 w-8 text-amber-950" />}
        </div>
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-amber-200/80">
            Certificate of Completion
          </p>
          <h1 className="mt-2 text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-pink-200 to-cyan-200">
            學習證明
          </h1>
        </div>
        <p className="text-muted-foreground">茲證明</p>
        <p className="text-4xl font-black text-white drop-shadow">{cert.name}</p>
        <p className="text-muted-foreground">
          已完成本模組全部單元測驗
        </p>
        <p className="text-2xl font-bold text-fuchsia-200">
          {moduleEmoji} {moduleTitle}
        </p>
        <div className="mx-auto max-w-sm rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm">
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">序號</span>
            <span className="font-mono text-amber-200">{cert.serial}</span>
          </div>
          <div className="mt-1 flex justify-between gap-4">
            <span className="text-muted-foreground">完成時間（台北）</span>
            <span>{dateStr}</span>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Agent 速成班｜互動測驗 · 本證明僅存於本機瀏覽器
        </p>
        <Button
          variant="fun"
          className="no-print"
          onClick={() => window.print()}
        >
          <Printer className="h-4 w-4" />
          列印／另存 PDF
        </Button>
      </div>
    </div>
  )
}
