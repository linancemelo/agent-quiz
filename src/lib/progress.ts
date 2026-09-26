import type { ModuleCertificate, ProgressState, UnitProgress } from '@/types'
import { loadJSON, saveJSON } from './storage'

const KEY = 'progress'

export function defaultProgress(): ProgressState {
  return {
    unitProgress: {},
    wrongBook: [],
    certificates: {},
    learnerName: '',
  }
}

export function loadProgress(): ProgressState {
  return loadJSON(KEY, defaultProgress())
}

export function saveProgress(state: ProgressState): void {
  saveJSON(KEY, state)
}

export function emptyUnitProgress(unitId: string): UnitProgress {
  return {
    unitId,
    attempts: 0,
    bestScore: 0,
    bestTotal: 0,
    completed: false,
    wrongQuestionIds: [],
  }
}

export function makeSerial(): string {
  const t = Date.now().toString(36).toUpperCase()
  const r = Math.random().toString(36).slice(2, 6).toUpperCase()
  return `AQ-${t}-${r}`
}

export function moduleCompletionRate(
  unitIds: string[],
  unitProgress: Record<string, UnitProgress>,
): number {
  if (unitIds.length === 0) return 0
  const done = unitIds.filter((id) => unitProgress[id]?.completed).length
  return Math.round((done / unitIds.length) * 100)
}

export function isModuleComplete(
  unitIds: string[],
  unitProgress: Record<string, UnitProgress>,
): boolean {
  return unitIds.length > 0 && unitIds.every((id) => unitProgress[id]?.completed)
}

export function ensureCertificate(
  state: ProgressState,
  moduleId: string,
  name: string,
): ModuleCertificate {
  const existing = state.certificates[moduleId]
  if (existing) return existing
  return {
    moduleId,
    name: name || '學習旅人',
    serial: makeSerial(),
    completedAt: new Date().toISOString(),
  }
}
