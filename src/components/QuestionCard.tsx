import { lazy, Suspense } from 'react'
import type { Question, UserAnswer } from '@/types'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

const PythonCodeEditor = lazy(() => import('@/components/PythonCodeEditor').then((m) => ({ default: m.PythonCodeEditor })))

const typeLabel: Record<string, string> = {
  single: '單選',
  multi: '多選',
  boolean: '是非',
  fill: '填空',
  scenario: '情境',
  code: '程式碼',
}

const INDEX_HINTS = ['①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧', '⑨'] as const

function IndexHint({ n }: { n: number }) {
  if (n < 1 || n > 9) return null
  return (
    <span
      className="mt-0.5 w-5 shrink-0 select-none text-center text-xs font-medium text-muted-foreground/45"
      aria-hidden="true"
    >
      {INDEX_HINTS[n - 1]}
    </span>
  )
}

export function QuestionCard({
  question,
  answer,
  onChange,
  disabled,
  grading,
}: {
  question: Question
  answer: UserAnswer
  onChange: (a: UserAnswer) => void
  disabled?: boolean
  grading?: boolean
}) {
  return (
    <div className="space-y-4 animate-pop">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="fun">{typeLabel[question.type] ?? question.type}</Badge>
        {question.type === 'code' && question.runner === 'pyodide' && (
          <Badge variant="success">瀏覽器執行</Badge>
        )}
        {question.difficulty && (
          <Badge variant="secondary">
            {question.difficulty === 'beginner'
              ? '入門'
              : question.difficulty === 'intermediate'
                ? '進階'
                : '挑戰'}
          </Badge>
        )}
      </div>

      {question.type === 'scenario' && (
        <div className="rounded-xl border border-cyan-400/30 bg-cyan-500/10 p-3 text-sm text-cyan-100">
          <span className="font-semibold text-cyan-300">情境：</span>
          {question.context}
        </div>
      )}

      <h2 className="text-xl font-bold leading-snug text-foreground">{question.prompt}</h2>

      {(question.type === 'single' || question.type === 'scenario') && (
        <RadioGroup
          value={typeof answer === 'string' ? answer : ''}
          onValueChange={(v) => onChange(v)}
          disabled={disabled}
          className="gap-3"
          aria-label={question.prompt}
        >
          {question.options.map((opt, i) => (
            <label
              key={opt.id}
              className={cn(
                'flex cursor-pointer items-start gap-3 rounded-xl border border-border/80 bg-muted/30 p-3 transition-all hover:border-violet-400/50 hover:bg-violet-500/10',
                answer === opt.id && 'border-violet-400 bg-violet-500/15',
                disabled && 'cursor-default opacity-80',
              )}
            >
              <IndexHint n={i + 1} />
              <RadioGroupItem value={opt.id} id={opt.id} className="mt-0.5" />
              <span className="text-sm leading-relaxed">{opt.label}</span>
            </label>
          ))}
        </RadioGroup>
      )}

      {question.type === 'multi' && (
        <div className="grid gap-3" role="group" aria-label={question.prompt}>
          {question.options.map((opt, i) => {
            const selected = Array.isArray(answer) && answer.includes(opt.id)
            return (
              <label
                key={opt.id}
                className={cn(
                  'flex cursor-pointer items-start gap-3 rounded-xl border border-border/80 bg-muted/30 p-3 transition-all hover:border-fuchsia-400/50',
                  selected && 'border-fuchsia-400 bg-fuchsia-500/15',
                  disabled && 'cursor-default opacity-80',
                )}
              >
                <IndexHint n={i + 1} />
                <Checkbox
                  checked={selected}
                  disabled={disabled}
                  onCheckedChange={(c) => {
                    const prev = Array.isArray(answer) ? answer : []
                    if (c) onChange([...prev, opt.id])
                    else onChange(prev.filter((x) => x !== opt.id))
                  }}
                  className="mt-0.5"
                />
                <span className="text-sm leading-relaxed">{opt.label}</span>
              </label>
            )
          })}
        </div>
      )}

      {question.type === 'boolean' && (
        <RadioGroup
          value={typeof answer === 'boolean' ? String(answer) : ''}
          onValueChange={(v) => onChange(v === 'true')}
          disabled={disabled}
          className="grid grid-cols-2 gap-3"
          aria-label={question.prompt}
        >
          {[
            { id: 'true', label: '⭕ 正確（True）' },
            { id: 'false', label: '❌ 錯誤（False）' },
          ].map((opt, i) => (
            <label
              key={opt.id}
              className={cn(
                'flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-border/80 bg-muted/30 p-4 text-sm font-semibold transition-all hover:border-violet-400/50',
                String(answer) === opt.id && 'border-violet-400 bg-violet-500/15',
              )}
            >
              <IndexHint n={i + 1} />
              <RadioGroupItem value={opt.id} className="sr-only" />
              {opt.label}
            </label>
          ))}
        </RadioGroup>
      )}

      {question.type === 'fill' && (
        <Input
          value={typeof answer === 'string' ? answer : ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={question.placeholder ?? '在這裡輸入答案…'}
          disabled={disabled}
          className="text-base"
          aria-label={question.prompt}
        />
      )}

      {question.type === 'code' && question.runner === 'pyodide' && (
        <Suspense
          fallback={
            <p className="text-sm text-muted-foreground">程式編輯器準備中…</p>
          }
        >
          <PythonCodeEditor
            question={question}
            code={typeof answer === 'string' ? answer : (question.starter ?? '')}
            onChange={(next) => onChange(next)}
            disabled={disabled}
            grading={grading}
          />
        </Suspense>
      )}

      {question.type === 'code' && question.runner !== 'pyodide' && (
        <div className="space-y-2">
          {question.starter && (
            <pre className="overflow-x-auto rounded-xl bg-black/40 p-3 text-xs text-cyan-200">
              {question.starter}
            </pre>
          )}
          <textarea
            value={typeof answer === 'string' ? answer : ''}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            rows={3}
            placeholder="補上程式碼片段…"
            aria-label={question.prompt}
            className="w-full rounded-xl border border-border bg-muted/50 p-3 font-mono text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/50"
          />
          <p className="text-xs text-muted-foreground">
            語言：{question.language} · 空白會被正規化後比對
          </p>
        </div>
      )}
    </div>
  )
}
