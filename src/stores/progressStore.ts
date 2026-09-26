import { create } from 'zustand'
import {
  defaultProgress,
  emptyUnitProgress,
  ensureCertificate,
  loadProgress,
  saveProgress,
} from '@/lib/progress'
import { clearLastAttempt, clearLastAttemptWrongs, pruneLastAttemptWrongs } from '@/lib/lastAttempt'
import { clearQuizDraft } from '@/lib/quizDraft'
import type { ProgressState, QuestionAttempt, UserAnswer } from '@/types'
import type { QuizMode } from '@/stores/quizStore'

interface ProgressActions {
  hydrate: () => void
  setLearnerName: (name: string) => void
  recordQuizResult: (payload: {
    unitId: string
    score: number
    total: number
    wrongQuestionIds: string[]
    attempts: { questionId: string; correct: boolean; answer: UserAnswer }[]
    mode?: QuizMode
  }) => void
  clearWrong: (questionId: string) => void
  clearAllWrong: () => void
  issueCertificate: (moduleId: string, name?: string) => void
  resetAll: () => void
}

function ratio(score: number, total: number): number {
  return total === 0 ? 0 : score / total
}

function isFullMode(mode: QuizMode): boolean {
  return mode === 'full'
}

export const useProgressStore = create<ProgressState & ProgressActions>((set, get) => ({
  ...defaultProgress(),

  hydrate: () => {
    set(loadProgress())
  },

  setLearnerName: (name) => {
    const state = get()
    const next = { ...state, learnerName: name }
    saveProgress(next)
    set({ learnerName: name })
  },

  recordQuizResult: ({
    unitId,
    score,
    total,
    wrongQuestionIds,
    attempts,
    mode = 'full',
  }) => {
    const state = get()
    const prev = state.unitProgress[unitId] ?? emptyUnitProgress(unitId)
    const isFull = isFullMode(mode)
    // Completion only for full-unit perfect
    const completed = isFull && score === total && total > 0
    const keepPrevBest =
      !isFull || ratio(prev.bestScore, prev.bestTotal) > ratio(score, total)

    const mergedWrongIds = Array.from(
      new Set([
        ...prev.wrongQuestionIds.filter(
          (id) => !attempts.some((a) => a.questionId === id && a.correct),
        ),
        ...wrongQuestionIds,
      ]),
    )

    const unitProgress = {
      ...state.unitProgress,
      [unitId]: {
        ...prev,
        // L-v1.1-3: wrong-only / attempt must NOT increment attempts
        attempts: isFull ? prev.attempts + 1 : prev.attempts,
        bestScore: keepPrevBest ? prev.bestScore : score,
        bestTotal: keepPrevBest
          ? prev.bestTotal || (isFull ? total : prev.bestTotal)
          : total,
        completed: prev.completed || completed,
        lastAttemptAt: new Date().toISOString(),
        wrongQuestionIds: mergedWrongIds,
      },
    }

    const newWrongEntries: QuestionAttempt[] = attempts
      .filter((a) => !a.correct)
      .map((a) => ({
        questionId: a.questionId,
        unitId,
        correct: false,
        answer: a.answer,
        at: new Date().toISOString(),
      }))

    const cleared = state.wrongBook.filter(
      (w) =>
        !(
          w.unitId === unitId &&
          attempts.some((a) => a.questionId === w.questionId && a.correct)
        ),
    )

    const wrongBook = [...cleared]
    for (const n of newWrongEntries) {
      const idx = wrongBook.findIndex(
        (w) => w.questionId === n.questionId && w.unitId === n.unitId,
      )
      if (idx >= 0) wrongBook[idx] = n
      else wrongBook.push(n)
    }

    const next: ProgressState = {
      unitProgress,
      wrongBook,
      certificates: state.certificates,
      learnerName: state.learnerName,
    }
    saveProgress(next)
    set(next)
  },

  clearWrong: (questionId) => {
    const state = get()
    const unitProgress = { ...state.unitProgress }
    for (const [uid, up] of Object.entries(unitProgress)) {
      if (up.wrongQuestionIds.includes(questionId)) {
        unitProgress[uid] = {
          ...up,
          wrongQuestionIds: up.wrongQuestionIds.filter((id) => id !== questionId),
        }
      }
    }
    pruneLastAttemptWrongs([questionId])
    const next = {
      ...state,
      wrongBook: state.wrongBook.filter((w) => w.questionId !== questionId),
      unitProgress,
    }
    saveProgress(next)
    set(next)
  },

  clearAllWrong: () => {
    const state = get()
    const unitProgress = { ...state.unitProgress }
    for (const [uid, up] of Object.entries(unitProgress)) {
      if (up.wrongQuestionIds.length > 0) {
        unitProgress[uid] = { ...up, wrongQuestionIds: [] }
      }
    }
    clearLastAttemptWrongs()
    const next = { ...state, wrongBook: [], unitProgress }
    saveProgress(next)
    set(next)
  },

  issueCertificate: (moduleId, name) => {
    const state = get()
    const learner = name ?? state.learnerName
    const cert = ensureCertificate(state, moduleId, learner)
    const next = {
      ...state,
      learnerName: learner || state.learnerName,
      certificates: { ...state.certificates, [moduleId]: cert },
    }
    saveProgress(next)
    set(next)
  },

  resetAll: () => {
    clearLastAttempt()
    clearQuizDraft()
    const next = defaultProgress()
    saveProgress(next)
    set(next)
  },
}))
