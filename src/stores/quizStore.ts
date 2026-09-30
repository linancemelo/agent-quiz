import { create } from 'zustand'
import { gradeQuestion, gradeQuestionAsync, isAnswerEmpty } from '@/lib/grade'
import type { GradeResult, Question, UserAnswer } from '@/types'

export type QuizMode = 'full' | 'wrong-only' | 'attempt'

interface QuizState {
  unitId: string | null
  questions: Question[]
  index: number
  answers: Record<string, UserAnswer>
  grades: Record<string, GradeResult>
  submitted: Record<string, boolean>
  mode: QuizMode
  finished: boolean
  streak: number
  /** Bumped on start / hydrate / reset so an in-flight Pyodide grade cannot land on the next session. */
  session: number
  grading: boolean
  submitError: string | null
}

interface HydratePayload {
  unitId: string
  questions: Question[]
  mode: QuizMode
  index: number
  answers: Record<string, UserAnswer>
  grades: Record<string, GradeResult>
  submitted: Record<string, boolean>
  streak?: number
}

interface QuizActions {
  start: (unitId: string, questions: Question[], mode?: QuizMode) => void
  hydrate: (payload: HydratePayload) => void
  setAnswer: (answer: UserAnswer) => void
  submitCurrent: () => Promise<GradeResult | null>
  next: () => void
  reset: () => void
  currentQuestion: () => Question | null
  score: () => { correct: number; total: number }
}

const initial: QuizState = {
  unitId: null,
  questions: [],
  index: 0,
  answers: {},
  grades: {},
  submitted: {},
  mode: 'full',
  finished: false,
  streak: 0,
  session: 0,
  grading: false,
  submitError: null,
}

function seedPyodideStarters(
  questions: Question[],
  answers: Record<string, UserAnswer>,
): Record<string, UserAnswer> {
  let next: Record<string, UserAnswer> | null = null
  for (const q of questions) {
    if (q.type !== 'code' || q.runner !== 'pyodide' || !q.starter) continue
    if (answers[q.id] != null) continue
    next ??= { ...answers }
    next[q.id] = q.starter
  }
  return next ?? answers
}

export const useQuizStore = create<QuizState & QuizActions>((set, get) => ({
  ...initial,

  start: (unitId, questions, mode = 'full') => {
    set({
      unitId,
      questions,
      index: 0,
      answers: seedPyodideStarters(questions, {}),
      grades: {},
      submitted: {},
      mode,
      finished: false,
      streak: 0,
      session: get().session + 1,
      grading: false,
      submitError: null,
    })
  },

  hydrate: ({ unitId, questions, mode, index, answers, grades, submitted, streak = 0 }) => {
    set({
      unitId,
      questions,
      index,
      answers: seedPyodideStarters(questions, answers),
      grades,
      submitted,
      mode,
      finished: false,
      streak,
      session: get().session + 1,
      grading: false,
      submitError: null,
    })
  },

  setAnswer: (answer) => {
    const q = get().currentQuestion()
    if (!q) return
    set((s) => ({
      answers: { ...s.answers, [q.id]: answer },
      submitError: null,
    }))
  },

  submitCurrent: async () => {
    if (get().grading) return null
    const session = get().session
    const q = get().currentQuestion()
    if (!q) return null
    if (get().submitted[q.id]) return get().grades[q.id] ?? null
    const answer = get().answers[q.id] ?? null
    if (isAnswerEmpty(q, answer)) return null

    set({ grading: true, submitError: null })
    let result: GradeResult
    try {
      result =
        q.type === 'code' && q.runner === 'pyodide'
          ? await gradeQuestionAsync(q, answer)
          : gradeQuestion(q, answer)
    } catch (err) {
      if (get().session !== session) return null
      const message = err instanceof Error ? err.message : '判題時發生意外，再試一次？'
      set({ grading: false, submitError: message })
      return null
    }
    if (get().session !== session) return null
    set((s) => ({
      grades: { ...s.grades, [q.id]: result },
      submitted: { ...s.submitted, [q.id]: true },
      streak: result.correct ? s.streak + 1 : 0,
      grading: false,
      submitError: null,
    }))
    return result
  },

  next: () => {
    const { index, questions } = get()
    if (index + 1 >= questions.length) {
      set({ finished: true })
    } else {
      set({ index: index + 1 })
    }
  },

  reset: () => set({ ...initial, session: get().session + 1 }),

  currentQuestion: () => {
    const { questions, index } = get()
    return questions[index] ?? null
  },

  score: () => {
    const { questions, grades } = get()
    const total = questions.length
    const correct = questions.filter((q) => grades[q.id]?.correct).length
    return { correct, total }
  },
}))
