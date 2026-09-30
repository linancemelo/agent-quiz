import { CheckCircle2, XCircle, Lightbulb, BookMarked } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { GradeResult, QuestionOption, UserAnswer } from '@/types'

function formatExpected(
  expected: UserAnswer,
  options?: QuestionOption[],
): string | null {
  if (expected === null || expected === undefined) return null
  if (typeof expected === 'boolean') return expected ? '正確（True）' : '錯誤（False）'

  const labelOf = (id: string) => {
    const hit = options?.find((o) => o.id === id)
    return hit ? hit.label : id
  }

  if (Array.isArray(expected)) {
    if (expected.length === 0) return null
    return expected.map((a) => labelOf(String(a))).join(' ／ ')
  }
  return labelOf(String(expected))
}

function correctHeadline(streak: number): string {
  if (streak >= 5) return `連中 ${streak} 題！無人能擋 🚀`
  if (streak >= 3) return `連中 ${streak} 題！燃起來了 🔥`
  if (streak === 2) return '連續答對！節奏來了 ✨'
  return '答對啦！給你一顆星星 ⭐'
}

export function FeedbackPanel({
  result,
  options,
  streak = 0,
}: {
  result: GradeResult
  /** For single/multi/scenario — resolve option ids to labels */
  options?: QuestionOption[]
  /** Consecutive correct count after this submit */
  streak?: number
}) {
  const ok = result.correct
  const expectedText = !ok ? formatExpected(result.expected, options) : null
  // Use mono for fill/code (no options); plain text for choice labels
  const useMono = !options || options.length === 0

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'relative overflow-hidden rounded-2xl border p-4 animate-slide-up',
        ok
          ? 'border-emerald-400/40 bg-emerald-500/10 animate-bounce-in'
          : 'border-rose-400/40 bg-rose-500/10 animate-shake',
      )}
    >
      <div className="flex items-start gap-3">
        {ok ? (
          <CheckCircle2 className="mt-0.5 h-7 w-7 shrink-0 text-emerald-400" />
        ) : (
          <XCircle className="mt-0.5 h-7 w-7 shrink-0 text-rose-400" />
        )}
        <div className="space-y-2">
          <p className={cn('text-lg font-bold', ok ? 'text-emerald-300' : 'text-rose-300')}>
            {ok ? correctHeadline(streak) : '差一點！這題先記進錯題本 💪'}
          </p>
          <div className="flex gap-2 text-sm text-muted-foreground">
            <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
            <p className="leading-relaxed text-foreground/90">{result.explanation}</p>
          </div>
          {result.detail && (
            <pre className="max-h-52 overflow-auto whitespace-pre-wrap rounded-xl border border-border/60 bg-black/30 p-3 font-mono text-xs leading-relaxed text-foreground/90">
              {result.detail}
            </pre>
          )}
          {expectedText && (
            <div className="flex gap-2 rounded-xl border border-amber-400/30 bg-amber-500/10 px-3 py-2 text-sm">
              <BookMarked className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
              <p>
                <span className="font-semibold text-amber-200">可接受答案：</span>
                <span className={cn('text-amber-50', useMono && 'font-mono')}>
                  {expectedText}
                </span>
              </p>
            </div>
          )}
        </div>
      </div>
      {ok && (
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {Array.from({ length: 8 }).map((_, i) => (
            <span
              key={i}
              className="confetti-bit"
              style={{
                left: `${10 + i * 11}%`,
                background: ['#a855f7', '#22d3ee', '#f472b6', '#fbbf24', '#4ade80'][i % 5],
                animationDelay: `${i * 0.05}s`,
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}
