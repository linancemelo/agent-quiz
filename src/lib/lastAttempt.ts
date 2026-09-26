import type { UserAnswer } from '@/types'

export interface LastAttemptWrongItem {
  questionId: string
  prompt: string
  explanation: string
}

export interface LastAttemptSnapshot {
  unitId: string
  mode: 'full' | 'wrong-only' | 'attempt'
  score: number
  total: number
  wrongQuestionIds: string[]
  wrongItems: LastAttemptWrongItem[]
  answers: Record<string, UserAnswer>
  at: string
}

const KEY = 'agent-quiz:lastAttempt'

export function saveLastAttempt(snapshot: LastAttemptSnapshot): void {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(snapshot))
  } catch {
    // ignore
  }
}

export function loadLastAttempt(unitId?: string): LastAttemptSnapshot | null {
  try {
    const raw = sessionStorage.getItem(KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as LastAttemptSnapshot
    if (unitId && parsed.unitId !== unitId) return null
    return parsed
  } catch {
    return null
  }
}

/** Remove cleared wrongs from the saved attempt (keeps result page in sync). */
export function pruneLastAttemptWrongs(removedQuestionIds: string[]): void {
  if (removedQuestionIds.length === 0) return
  const snap = loadLastAttempt()
  if (!snap) return
  const remove = new Set(removedQuestionIds)
  const wrongQuestionIds = snap.wrongQuestionIds.filter((id) => !remove.has(id))
  const wrongItems = snap.wrongItems.filter((w) => !remove.has(w.questionId))
  if (
    wrongQuestionIds.length === snap.wrongQuestionIds.length &&
    wrongItems.length === snap.wrongItems.length
  ) {
    return
  }
  saveLastAttempt({ ...snap, wrongQuestionIds, wrongItems })
}

export function clearLastAttemptWrongs(): void {
  const snap = loadLastAttempt()
  if (!snap) return
  if (snap.wrongQuestionIds.length === 0 && snap.wrongItems.length === 0) return
  saveLastAttempt({ ...snap, wrongQuestionIds: [], wrongItems: [] })
}

/** Wipe the whole last-attempt snapshot (e.g. on resetAll). */
export function clearLastAttempt(): void {
  try {
    sessionStorage.removeItem(KEY)
  } catch {
    // ignore
  }
}

