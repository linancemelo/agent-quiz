import { create } from 'zustand'
import { gradeQuestion, isAnswerEmpty } from '@/lib/grade'
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
  submitCurrent: () => GradeResult | null
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
}

export const useQuizStore = create<QuizState & QuizActions>((set, get) => ({
  ...initial,

  start: (unitId, questions, mode = 'full') => {
    set({
      unitId,
      questions,
      index: 0,
      answers: {},
      grades: {},
      submitted: {},
      mode,
      finished: false,
      streak: 0,
    })
  },

  hydrate: ({ unitId, questions, mode, index, answers, grades, submitted, streak = 0 }) => {
    set({
      unitId,
      questions,
      index,
      answers,
      grades,
      submitted,
      mode,
      finished: false,
      streak,
    })
  },

  setAnswer: (answer) => {
    const q = get().currentQuestion()
    if (!q) return
    set((s) => ({ answers: { ...s.answers, [q.id]: answer } }))
  },

  submitCurrent: () => {
    const q = get().currentQuestion()
    if (!q) return null
    const answer = get().answers[q.id] ?? null
    if (isAnswerEmpty(q, answer)) return null
    const result = gradeQuestion(q, answer)
    set((s) => ({
      grades: { ...s.grades, [q.id]: result },
      submitted: { ...s.submitted, [q.id]: true },
      streak: result.correct ? s.streak + 1 : 0,
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

  reset: () => set(initial),

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
