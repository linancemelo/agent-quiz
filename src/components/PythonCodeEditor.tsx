import { useEffect, useRef, useState } from 'react'
import { Play } from 'lucide-react'
import type { PyodideCodeQuestion } from '@/types'
import { Button } from '@/components/ui/button'
import { formatPythonRunOutput } from '@/lib/pyodide/normalize'
import { executePython, prewarmPyodide } from '@/lib/pyodide/runner'
import { cn } from '@/lib/utils'

type Engine = 'loading' | 'ready' | 'error'

interface OutputView {
  title: string
  body: string
  tone: 'ok' | 'err' | 'neutral'
}

export function PythonCodeEditor({
  question,
  code,
  onChange,
  disabled,
  grading,
}: {
  question: PyodideCodeQuestion
  code: string
  onChange: (code: string) => void
  disabled?: boolean
  grading?: boolean
}) {
  const areaRef = useRef<HTMLTextAreaElement>(null)
  const caretRef = useRef<number | null>(null)
  const mountedRef = useRef(true)
  const [engine, setEngine] = useState<Engine>('loading')
  const [running, setRunning] = useState(false)
  const [output, setOutput] = useState<OutputView | null>(null)

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    prewarmPyodide()
      .then(() => {
        if (!cancelled) setEngine('ready')
      })
      .catch(() => {
        if (!cancelled) setEngine('error')
      })
    return () => {
      cancelled = true
    }
  }, [question.id])

  useEffect(() => {
    const pos = caretRef.current
    const el = areaRef.current
    if (pos == null || !el) return
    caretRef.current = null
    el.selectionStart = pos
    el.selectionEnd = pos
  }, [code])

  const run = async () => {
    if (disabled || grading || running) return
    setRunning(true)
    setOutput({
      title: engine === 'ready' ? '執行中' : '小蟒蛇進場中',
      body:
        engine === 'ready'
          ? '程式跑起來了，稍等…'
          : '第一次會從 CDN 請 Pyodide 進瀏覽器，喝口水等等 🐍',
      tone: 'neutral',
    })
    try {
      const result = await executePython({
        code,
        mode: 'run',
        timeoutMs: question.timeout,
        onPhase: (phase) => {
          if (phase === 'loading') {
            setOutput({
              title: '小蟒蛇進場中',
              body: '第一次會從 CDN 請 Pyodide 進瀏覽器，喝口水等等 🐍',
              tone: 'neutral',
            })
          }
        },
      })
      const view = formatPythonRunOutput(result)
      setOutput(view)
      if (result.infraError) {
        setEngine('error')
      } else if (result.timedOut) {
        setEngine('loading')
        prewarmPyodide()
          .then(() => {
            if (mountedRef.current) setEngine('ready')
          })
          .catch(() => {
            if (mountedRef.current) setEngine('error')
          })
      } else {
        setEngine('ready')
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Pyodide 載入失敗。'
      setEngine('error')
      setOutput({ title: '小蟒蛇沒叫醒', body: message, tone: 'err' })
    } finally {
      setRunning(false)
    }
  }

  return (
    <div className="space-y-3">
      {question.publicHint && (
        <div className="rounded-xl border border-cyan-400/30 bg-cyan-500/10 p-3 text-sm text-cyan-100">
          <span className="font-semibold text-cyan-300">提示：</span>
          {question.publicHint}
        </div>
      )}
      <textarea
        ref={areaRef}
        value={code}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Tab') {
            event.preventDefault()
            const el = event.currentTarget
            const start = el.selectionStart ?? code.length
            const end = el.selectionEnd ?? start
            const next = `${code.slice(0, start)}    ${code.slice(end)}`
            caretRef.current = start + 4
            onChange(next)
            return
          }
          if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
            event.preventDefault()
            void run()
          }
        }}
        disabled={disabled}
        rows={12}
        spellCheck={false}
        autoCapitalize="off"
        autoCorrect="off"
        aria-label={question.prompt}
        className="w-full resize-y rounded-xl border border-border bg-black/40 p-3 font-mono text-sm leading-relaxed text-cyan-50 placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/50 disabled:opacity-80"
      />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">
          Python · 在你的瀏覽器執行 · 不能連網 · Ctrl/⌘ + Enter 快跑
          {engine === 'loading' && ' · 小蟒蛇進場中…'}
          {engine === 'ready' && ' · 小蟒蛇就位 🐍'}
          {engine === 'error' && ' · 載入失敗，再跑一次會重試'}
        </p>
        <Button
          type="button"
          variant="fun"
          size="sm"
          disabled={disabled || grading || running || code.trim() === ''}
          onClick={() => void run()}
        >
          <Play className="h-3.5 w-3.5" />
          {running ? '跑著…' : '跑跑看'}
        </Button>
      </div>
      <div
        role="status"
        aria-live="polite"
        className={cn(
          'min-h-16 rounded-xl border p-3 font-mono text-xs leading-relaxed whitespace-pre-wrap',
          output?.tone === 'err'
            ? 'border-rose-400/40 bg-rose-500/10 text-rose-100'
            : 'border-border/80 bg-black/30 text-foreground/90',
        )}
      >
        {output ? (
          <>
            <p className="mb-1 font-sans text-xs font-semibold tracking-wide text-muted-foreground">
              {output.title}
            </p>
            {output.body}
          </>
        ) : (
          <p className="font-sans text-muted-foreground">
            按「跑跑看」看輸出。隱藏測試會在你按「提交看看」時才上場。
          </p>
        )}
      </div>
    </div>
  )
}
