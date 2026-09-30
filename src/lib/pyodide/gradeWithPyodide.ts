import type { GradeResult, PyodideCodeQuestion, UserAnswer } from '@/types'
import { normalizePyodideTests, pyodideGradeResult } from '@/lib/pyodide/normalize'
import { executePython, PyodideInfraError } from '@/lib/pyodide/runner'

export async function gradeWithPyodide(
  question: PyodideCodeQuestion,
  userAnswer: UserAnswer,
): Promise<GradeResult> {
  if (typeof userAnswer !== 'string' || userAnswer.trim() === '') {
    return {
      correct: false,
      expected: null,
      explanation: question.explanation,
      detail: '還沒寫程式喔。',
    }
  }
  const result = await executePython({
    code: userAnswer,
    mode: 'grade',
    tests: normalizePyodideTests(question.tests),
    timeoutMs: question.timeout,
  })
  if (result.infraError) throw new PyodideInfraError(result.infraError)
  return pyodideGradeResult(question, result)
}
