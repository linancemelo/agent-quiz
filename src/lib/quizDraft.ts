import type { GradeResult, UserAnswer } from '@/types'
import type { QuizMode } from '@/stores/quizStore'

export interface QuizDraft {
  unitId: string
  mode: QuizMode
  index: number
  answers: Record<string, UserAnswer>
  grades: Record<string, GradeResult>
  submitted: Record<string, boolean>
  questionIds: string[]
  streak: number
  updatedAt: string
}

const KEY = 'agent-quiz:quizDraft'

export function questionIdsEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false
  return a.every((id, i) => id === b[i])
}

export function saveQuizDraft(draft: QuizDraft): void {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(draft))
  } catch {
    // ignore
  }
}

export function loadQuizDraft(): QuizDraft | null {
  try {
    const raw = sessionStorage.getItem(KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as QuizDraft
    if (!parsed?.unitId || !Array.isArray(parsed.questionIds)) return null
    return parsed
  } catch {
    return null
  }
}

/** Wipe mid-attempt draft (finish, resetAll, unit/mode mismatch). */
export function clearQuizDraft(): void {
  try {
    sessionStorage.removeItem(KEY)
  } catch {
    // ignore
  }
}
