import curriculumJson from './curriculum.json'
import type { Curriculum, Unit } from '@/types'

const unitModules = import.meta.glob('./units/*.json', { eager: true }) as Record<
  string,
  { default: Unit }
>

export const curriculum = curriculumJson as Curriculum

export const unitsById: Record<string, Unit> = {}
for (const mod of Object.values(unitModules)) {
  const unit = mod.default
  unitsById[unit.id] = unit
}

export function getUnit(unitId: string): Unit | undefined {
  return unitsById[unitId]
}

export function getModule(moduleId: string) {
  return curriculum.modules.find((m) => m.id === moduleId)
}

export function getModuleUnits(moduleId: string): Unit[] {
  const mod = getModule(moduleId)
  if (!mod) return []
  return mod.unitIds.map((id) => unitsById[id]).filter(Boolean)
}

export function getAllUnits(): Unit[] {
  return Object.values(unitsById).sort((a, b) => {
    const ma = getModule(a.moduleId)?.order ?? 0
    const mb = getModule(b.moduleId)?.order ?? 0
    if (ma !== mb) return ma - mb
    return a.order - b.order
  })
}

export function findQuestion(unitId: string, questionId: string) {
  const unit = getUnit(unitId)
  return unit?.questions.find((q) => q.id === questionId)
}

export function stats() {
  const units = getAllUnits()
  return {
    modules: curriculum.modules.length,
    units: units.length,
    questions: units.reduce((n, u) => n + u.questions.length, 0),
  }
}
