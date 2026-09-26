import type { GradeResult, Question, UserAnswer } from '@/types'

function normalizeWs(s: string): string {
  return s.trim().replace(/\s+/g, ' ')
}

function normalizeFill(s: string, caseSensitive: boolean): string {
  const t = s.trim().replace(/\s+/g, ' ')
  return caseSensitive ? t : t.toLowerCase()
}

export function gradeQuestion(q: Question, userAnswer: UserAnswer): GradeResult {
  const explanation = q.explanation

  switch (q.type) {
    case 'single':
    case 'scenario': {
      const ok = userAnswer === q.answer
      return { correct: ok, expected: q.answer, explanation }
    }
    case 'boolean': {
      const ok = userAnswer === q.answer
      return { correct: ok, expected: q.answer, explanation }
    }
    case 'multi': {
      const selected = Array.isArray(userAnswer) ? [...userAnswer].sort() : []
      const expected = [...q.answer].sort()
      const ok =
        selected.length === expected.length &&
        selected.every((id, i) => id === expected[i])
      return { correct: ok, expected: q.answer, explanation }
    }
    case 'fill': {
      if (typeof userAnswer !== 'string') {
        return { correct: false, expected: q.answer, explanation }
      }
      const cs = q.caseSensitive ?? false
      const got = normalizeFill(userAnswer, cs)
      const ok = q.answer.some((a) => normalizeFill(a, cs) === got)
      return { correct: ok, expected: q.answer, explanation }
    }
    case 'code': {
      if (typeof userAnswer !== 'string') {
        return { correct: false, expected: q.answer, explanation }
      }
      const got = normalizeWs(userAnswer)
      const ok = q.answer.some((a) => normalizeWs(a) === got)
      return { correct: ok, expected: q.answer, explanation }
    }
    default:
      return { correct: false, expected: null, explanation }
  }
}

export function isAnswerEmpty(q: Question, answer: UserAnswer): boolean {
  if (answer === null || answer === undefined) return true
  if (q.type === 'multi') return !Array.isArray(answer) || answer.length === 0
  if (q.type === 'fill' || q.type === 'code') {
    return typeof answer !== 'string' || answer.trim() === ''
  }
  if (q.type === 'boolean') return typeof answer !== 'boolean'
  return typeof answer !== 'string' || answer === ''
}
