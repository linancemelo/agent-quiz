import { useEffect, useRef } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { getUnit } from '@/data'
import { useQuizStore, type QuizMode } from '@/stores/quizStore'
import { useProgressStore } from '@/stores/progressStore'
import { isAnswerEmpty } from '@/lib/grade'
import { loadLastAttempt, saveLastAttempt } from '@/lib/lastAttempt'
import {
  clearQuizDraft,
  loadQuizDraft,
  questionIdsEqual,
  saveQuizDraft,
} from '@/lib/quizDraft'
import { QuestionCard } from '@/components/QuestionCard'
import { FeedbackPanel } from '@/components/FeedbackPanel'
import { ProgressBar } from '@/components/ProgressBar'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowLeft, Send, ChevronRight, Loader2 } from 'lucide-react'
import type { Question, UserAnswer } from '@/types'
import { cn } from '@/lib/utils'

function resolveMode(raw: string | null): QuizMode {
  if (raw === 'attempt') return 'attempt'
  if (raw === 'wrong') return 'wrong-only'
  return 'full'
}

function pickQuestions(unitQuestions: Question[], mode: QuizMode, unitId: string): Question[] {
  if (mode === 'full') return unitQuestions
  if (mode === 'attempt') {
    const ids = loadLastAttempt(unitId)?.wrongQuestionIds ?? []
    return unitQuestions.filter((q) => ids.includes(q.id))
  }
  // wrong-only: live merged wrong book for this unit
  const wrongIds =
    useProgressStore.getState().unitProgress[unitId]?.wrongQuestionIds ?? []
  return unitQuestions.filter((q) => wrongIds.includes(q.id))
}

function modeLabel(mode: QuizMode): string {
  if (mode === 'attempt') return '本次錯題'
  if (mode === 'wrong-only') return '錯題特訓'
  return '完整測驗'
}

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  const tag = target.tagName
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true
  if (target.isContentEditable) return true
  return Boolean(target.closest('input, textarea, select, [contenteditable="true"]'))
}

export function QuizPage() {
  const { unitId = '' } = useParams()
  const [params] = useSearchParams()
  const mode = resolveMode(params.get('mode'))
  const unit = getUnit(unitId)
  const navigate = useNavigate()
  const finishGuard = useRef(false)

  const start = useQuizStore((s) => s.start)
  const hydrate = useQuizStore((s) => s.hydrate)
  const reset = useQuizStore((s) => s.reset)
  const questions = useQuizStore((s) => s.questions)
  const index = useQuizStore((s) => s.index)
  const answers = useQuizStore((s) => s.answers)
  const grades = useQuizStore((s) => s.grades)
  const submitted = useQuizStore((s) => s.submitted)
  const finished = useQuizStore((s) => s.finished)
  const streak = useQuizStore((s) => s.streak)
  const grading = useQuizStore((s) => s.grading)
  const submitError = useQuizStore((s) => s.submitError)
  const setAnswer = useQuizStore((s) => s.setAnswer)
  const submitCurrent = useQuizStore((s) => s.submitCurrent)
  const next = useQuizStore((s) => s.next)
  const currentQuestion = useQuizStore((s) => s.currentQuestion)
  const score = useQuizStore((s) => s.score)
  const recordQuizResult = useProgressStore((s) => s.recordQuizResult)

  useEffect(() => {
    if (!unit) return
    finishGuard.current = false
    // Clear leftover session (e.g. finished===true after Result → Quiz client nav)
    reset()
    const qs = pickQuestions(unit.questions, mode, unit.id)
    const ids = qs.map((q) => q.id)
    const draft = loadQuizDraft()

    if (
      draft &&
      draft.unitId === unit.id &&
      draft.mode === mode &&
      questionIdsEqual(draft.questionIds, ids)
    ) {
      hydrate({
        unitId: unit.id,
        questions: qs,
        mode,
        index: Math.min(Math.max(draft.index, 0), Math.max(qs.length - 1, 0)),
        answers: draft.answers ?? {},
        grades: draft.grades ?? {},
        submitted: draft.submitted ?? {},
        streak: draft.streak ?? 0,
      })
    } else {
      // unit/mode mismatch or stale question set → drop draft, start fresh
      if (draft) clearQuizDraft()
      start(unit.id, qs, mode)
    }

    return () => {
      // Always reset so client-side Result → Quiz remount never inherits finished
      reset()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unitId, mode])

  // Debounced mid-attempt draft (UI-only — never calls recordQuizResult)
  useEffect(() => {
    if (!unit || finished) return
    const state = useQuizStore.getState()
    if (!state.unitId || state.questions.length === 0) return
    const t = window.setTimeout(() => {
      const s = useQuizStore.getState()
      if (!s.unitId || s.finished || s.questions.length === 0) return
      saveQuizDraft({
        unitId: s.unitId,
        mode: s.mode,
        index: s.index,
        answers: s.answers,
        grades: s.grades,
        submitted: s.submitted,
        questionIds: s.questions.map((q) => q.id),
        streak: s.streak,
        updatedAt: new Date().toISOString(),
      })
    }, 200)
    return () => window.clearTimeout(t)
  }, [unit, finished, index, answers, grades, submitted, streak, questions])

  useEffect(() => {
    if (!unit) return
    // Gate on live store (not only render closure) so boot reset() wins races
    if (!useQuizStore.getState().finished) return
    if (finishGuard.current) return
    finishGuard.current = true

    const { correct, total } = score()
    const quizMode = useQuizStore.getState().mode
    const attemptRows = questions.map((q) => ({
      questionId: q.id,
      correct: !!grades[q.id]?.correct,
      answer: answers[q.id] ?? null,
    }))
    const wrongQuestionIds = attemptRows.filter((a) => !a.correct).map((a) => a.questionId)
    const wrongItems = questions
      .filter((q) => wrongQuestionIds.includes(q.id))
      .map((q) => ({
        questionId: q.id,
        prompt: q.prompt,
        explanation: grades[q.id]?.explanation ?? '',
      }))

    clearQuizDraft()

    saveLastAttempt({
      unitId: unit.id,
      mode: quizMode,
      score: correct,
      total,
      wrongQuestionIds,
      wrongItems,
      answers: { ...answers },
      at: new Date().toISOString(),
    })

    recordQuizResult({
      unitId: unit.id,
      score: correct,
      total,
      wrongQuestionIds,
      attempts: attemptRows,
      mode: quizMode,
    })
    navigate(`/units/${unit.id}/result`, { replace: true })
    // Clean store before Result mounts so Result → Quiz never rebounds
    reset()
  }, [finished]) // eslint-disable-line react-hooks/exhaustive-deps

  // Keyboard: 1–9 select / toggle; Enter submit or next
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (isTypingTarget(e.target)) return
      if (finished) return
      if (useQuizStore.getState().grading) return
      const q = useQuizStore.getState().currentQuestion()
      if (!q) return

      const state = useQuizStore.getState()
      const isSubmitted = !!state.submitted[q.id]

      if (e.key === 'Enter' || e.key === 'NumpadEnter') {
        e.preventDefault()
        if (!isSubmitted) {
          const ans = state.answers[q.id] ?? null
          if (!isAnswerEmpty(q, ans)) submitCurrent()
        } else {
          next()
        }
        return
      }

      if (isSubmitted) return
      if (e.key.length !== 1 || e.key < '1' || e.key > '9') return
      const n = Number(e.key)
      if (n < 1 || n > 9) return

      if (q.type === 'boolean') {
        if (n === 1) {
          e.preventDefault()
          setAnswer(true)
        } else if (n === 2) {
          e.preventDefault()
          setAnswer(false)
        }
        return
      }

      if (q.type === 'single' || q.type === 'scenario') {
        const opt = q.options[n - 1]
        if (!opt) return
        e.preventDefault()
        setAnswer(opt.id)
        return
      }

      if (q.type === 'multi') {
        const opt = q.options[n - 1]
        if (!opt) return
        e.preventDefault()
        const prev = Array.isArray(state.answers[q.id])
          ? (state.answers[q.id] as string[])
          : []
        const nextAns: UserAnswer = prev.includes(opt.id)
          ? prev.filter((x) => x !== opt.id)
          : [...prev, opt.id]
        setAnswer(nextAns)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [finished, submitCurrent, next, setAnswer])

  const handleLeave = () => {
    const ok = window.confirm('進度會先暫存在這個分頁喔，確定離開？')
    if (!ok || !unit) return
    // Prefer keep draft so refresh + leave both resume
    navigate(`/units/${unit.id}`)
  }

  if (!unit) {
    return (
      <div className="text-center p-10">
        <p className="text-4xl mb-2">😵</p>
        <p>單元不存在</p>
        <Button asChild className="mt-4">
          <Link to="/">回地圖</Link>
        </Button>
      </div>
    )
  }

  const q = currentQuestion()
  if (!q || questions.length === 0) {
    const isRedo = mode === 'wrong-only' || mode === 'attempt'
    return (
      <div className="rounded-2xl border border-dashed p-10 text-center animate-slide-up">
        <p className="text-4xl mb-2">🎯</p>
        <p className="font-semibold">
          {isRedo ? '目前沒有錯題可練' : '目前沒有可練的題目'}
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          {mode === 'attempt'
            ? '本次測驗沒有留下錯題，或已從錯題本移除。'
            : mode === 'wrong-only'
              ? '錯題本是空的——要嘛你超強，要嘛還沒開始練。'
              : '也許題庫還沒載入？'}
        </p>
        <Button asChild className="mt-4" variant="secondary">
          <Link to={`/units/${unit.id}`}>回單元</Link>
        </Button>
      </div>
    )
  }

  const isSubmitted = !!submitted[q.id]
  const grade = grades[q.id]
  const answer = answers[q.id] ?? null
  const progressPct = ((index + (isSubmitted ? 1 : 0)) / questions.length) * 100
  const choiceOptions =
    q.type === 'single' || q.type === 'multi' || q.type === 'scenario'
      ? q.options
      : undefined

  return (
    <div
      className={cn(
        'mx-auto space-y-5 animate-slide-up',
        q.type === 'code' && q.runner === 'pyodide' ? 'max-w-3xl' : 'max-w-2xl',
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <Button variant="ghost" size="sm" type="button" onClick={handleLeave}>
          <ArrowLeft className="h-4 w-4" />
          先存著離開
        </Button>
        <span className="text-sm text-muted-foreground">
          {modeLabel(mode)} · {index + 1} / {questions.length}
        </span>
      </div>

      <ProgressBar value={progressPct} label="本題進度" />

      <Card className="animate-pulse-glow">
        <CardContent className="space-y-6 pt-6">
          <QuestionCard
            question={q}
            answer={answer}
            onChange={setAnswer}
            disabled={isSubmitted}
            grading={grading}
          />

          {grade && (
            <FeedbackPanel result={grade} options={choiceOptions} streak={streak} />
          )}

          {submitError && (
            <p role="alert" className="rounded-xl border border-amber-400/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-100">
              {submitError}
            </p>
          )}

          <div className="flex justify-end gap-2">
            {!isSubmitted ? (
              <Button
                size="lg"
                disabled={isAnswerEmpty(q, answer) || grading}
                onClick={() => void submitCurrent()}
              >
                {grading && q.type === 'code' && q.runner === 'pyodide' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                {grading && q.type === 'code' && q.runner === 'pyodide' ? '小蟒蛇判題中…' : '提交看看'}
              </Button>
            ) : (
              <Button size="lg" variant="success" onClick={() => next()}>
                {index + 1 >= questions.length ? '看結果 🎉' : '下一題'}
                <ChevronRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
