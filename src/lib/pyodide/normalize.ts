import type { GradeResult, PyodideCodeQuestion, PyodideTest, UserAnswer } from '@/types'
import type { PythonRunResult } from '@/lib/pyodide/runner'

export interface NormalizedPyodideTest {
  kind: 'assert' | 'return' | 'stdout'
  name: string
  code?: string
  expr?: string
  expectedJson?: string
  expected?: string
}

export function normalizePyodideTests(tests: PyodideTest[]): NormalizedPyodideTest[] {
  return tests.map((test, index) => {
    const fallback = `第 ${index + 1} 關`
    if (typeof test === 'string') {
      return { kind: 'assert', name: fallback, code: test }
    }
    if (test.kind === 'assert') {
      return { kind: 'assert', name: test.name?.trim() || fallback, code: test.code }
    }
    if (test.kind === 'return') {
      return {
        kind: 'return',
        name: test.name?.trim() || fallback,
        expr: test.expr,
        expectedJson: JSON.stringify(test.expected),
      }
    }
    return {
      kind: 'stdout',
      name: test.name?.trim() || fallback,
      code: test.code,
      expected: test.expected,
    }
  })
}

export function formatPythonRunOutput(result: PythonRunResult): {
  title: string
  body: string
  tone: 'ok' | 'err'
} {
  if (result.infraError) {
    return { title: '小蟒蛇沒叫醒', body: result.infraError, tone: 'err' }
  }
  if (result.timedOut) {
    return {
      title: '逾時',
      body: '跑太久了，小蟒蛇自己喊停。檢查一下有沒有無限迴圈？',
      tone: 'err',
    }
  }
  if (result.error) {
    const extra = [result.stdout.trim() && `標準輸出：\n${result.stdout.trimEnd()}`, result.stderr.trim() && `標準錯誤：\n${result.stderr.trimEnd()}`]
      .filter(Boolean)
      .join('\n\n')
    return {
      title: '執行錯誤',
      body: extra ? `${result.error.trim()}\n\n${extra}` : result.error.trim(),
      tone: 'err',
    }
  }
  const chunks: string[] = []
  if (result.stdout.trim()) chunks.push(result.stdout.trimEnd())
  if (result.stderr.trim()) chunks.push(`標準錯誤：\n${result.stderr.trimEnd()}`)
  if (chunks.length === 0) {
    return {
      title: '跑完了',
      body: '沒有印出東西。函式題可以按「提交看看」，隱藏測試才會上場。',
      tone: 'ok',
    }
  }
  return { title: '跑完了', body: chunks.join('\n\n'), tone: 'ok' }
}

export function formatPyodideGradeDetail(result: PythonRunResult): string {
  if (result.timedOut) {
    return '跑太久了，小蟒蛇自己喊停（逾時）。檢查一下有沒有無限迴圈？'
  }
  const lines: string[] = []
  if (result.error) {
    lines.push('程式跑起來就摔跤了：')
    lines.push(result.error.trim())
  } else if (result.tests.length === 0) {
    lines.push('這題沒有隱藏測試，先不算過。')
  } else {
    const passed = result.tests.filter((test) => test.passed).length
    lines.push(`隱藏關卡 ${passed} / ${result.tests.length}`)
    for (const test of result.tests) {
      lines.push(`${test.passed ? '✅' : '❌'} ${test.name}：${test.message}`)
    }
  }
  if (result.stdout.trim()) {
    lines.push('')
    lines.push('標準輸出：')
    lines.push(result.stdout.trimEnd())
  }
  if (result.stderr.trim()) {
    lines.push('')
    lines.push('標準錯誤：')
    lines.push(result.stderr.trimEnd())
  }
  return lines.join('\n')
}

export function pyodideGradeResult(
  question: PyodideCodeQuestion,
  result: PythonRunResult,
): GradeResult {
  const detail = formatPyodideGradeDetail(result)
  const correct =
    !result.timedOut &&
    !result.error &&
    result.tests.length > 0 &&
    result.tests.every((test) => test.passed)
  const graded: GradeResult = {
    correct,
    expected: null satisfies UserAnswer,
    explanation: question.explanation,
    detail,
  }
  return graded
}
