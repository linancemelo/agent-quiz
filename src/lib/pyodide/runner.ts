import { buildPyodideWorkerSource } from '@/lib/pyodide/workerSource'
import {
  MAX_LEARNER_CODE_CHARS,
  resolvePyodideTimeout,
} from '@/lib/pyodide/constants'
import type { NormalizedPyodideTest } from '@/lib/pyodide/normalize'

export interface PythonTestResult {
  name: string
  passed: boolean
  message: string
}

export interface PythonRunResult {
  stdout: string
  stderr: string
  error: string | null
  tests: PythonTestResult[]
  timedOut: boolean
  infraError: string | null
}

export class PyodideInfraError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'PyodideInfraError'
  }
}

interface WorkerResultMessage {
  type: 'result'
  id: number
  stdout?: string
  stderr?: string
  error?: string | null
  tests?: PythonTestResult[]
  infra?: string
}

type WorkerMessage =
  | { type: 'ready' }
  | { type: 'boot-error'; message?: string }
  | WorkerResultMessage

export interface ExecutePythonRequest {
  code: string
  mode: 'run' | 'grade'
  tests?: NormalizedPyodideTest[]
  timeoutMs?: number
  onPhase?: (phase: 'loading' | 'running') => void
}

let worker: Worker | null = null
let ready = false
let readyPromise: Promise<void> | null = null
let seq = 0
let tail: Promise<void> = Promise.resolve()

const pending = new Map<number, (message: WorkerResultMessage) => void>()

function emptyResult(partial: Partial<PythonRunResult>): PythonRunResult {
  return {
    stdout: '',
    stderr: '',
    error: null,
    tests: [],
    timedOut: false,
    infraError: null,
    ...partial,
  }
}

function detachWorker(current: Worker | null) {
  if (!current) return
  current.onerror = null
  current.onmessage = null
  current.terminate()
}

/** Drop the worker. Does not reject an in-flight boot — callers do that. */
function killWorker() {
  const current = worker
  worker = null
  ready = false
  readyPromise = null
  detachWorker(current)
}

function ensureReady(): Promise<void> {
  if (worker && ready) return Promise.resolve()
  if (worker && readyPromise) return readyPromise

  const pendingBoot = new Promise<void>((resolve, reject) => {
    const source = buildPyodideWorkerSource()
    const blob = new Blob([source], { type: 'application/javascript' })
    const url = URL.createObjectURL(blob)
    const created = new Worker(url)
    worker = created
    let settled = false

    const failBoot = (err: Error) => {
      if (settled) return
      settled = true
      window.clearTimeout(timer)
      if (worker === created) {
        worker = null
        ready = false
        readyPromise = null
      }
      detachWorker(created)
      const wrapped = err instanceof PyodideInfraError ? err : new PyodideInfraError(err.message)
      reject(wrapped)
    }

    const timer = window.setTimeout(() => {
      failBoot(new PyodideInfraError('Pyodide 載入逾時。檢查網路後再試一次。'))
    }, 120_000)

    created.onerror = () => {
      if (!settled) {
        failBoot(new PyodideInfraError('Pyodide 載入失敗。檢查網路後再試一次。'))
        return
      }
      const waiters = [...pending.values()]
      pending.clear()
      killWorker()
      for (const callback of waiters) {
        callback({
          type: 'result',
          id: -1,
          infra: '小蟒蛇執行時出錯了，再跑一次看看。',
          tests: [],
        })
      }
    }

    created.onmessage = (event: MessageEvent<WorkerMessage>) => {
      const data = event.data
      if (!data || typeof data !== 'object') return
      if (data.type === 'ready') {
        if (settled) return
        settled = true
        window.clearTimeout(timer)
        ready = true
        resolve()
        return
      }
      if (data.type === 'boot-error') {
        failBoot(new PyodideInfraError(data.message || 'Pyodide 載入失敗。'))
        return
      }
      if (data.type === 'result') {
        const callback = pending.get(data.id)
        if (callback) callback(data)
      }
    }

    created.postMessage({ type: 'warmup' })
  })

  readyPromise = pendingBoot
  return pendingBoot
}

/** Start the CDN download without running learner code. */
export function prewarmPyodide(): Promise<void> {
  return ensureReady()
}

async function executePythonUnlocked(request: ExecutePythonRequest): Promise<PythonRunResult> {
  if (request.code.length > MAX_LEARNER_CODE_CHARS) {
    return emptyResult({
      error: `程式太長了（上限 ${MAX_LEARNER_CODE_CHARS} 字）。`,
    })
  }

  request.onPhase?.(ready ? 'running' : 'loading')
  try {
    await ensureReady()
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Pyodide 載入失敗。'
    throw err instanceof PyodideInfraError ? err : new PyodideInfraError(message)
  }
  request.onPhase?.('running')

  const timeoutMs = resolvePyodideTimeout(request.timeoutMs)
  const id = ++seq
  const current = worker
  if (!current) {
    throw new PyodideInfraError('小蟒蛇不在場，再試一次？')
  }

  return new Promise<PythonRunResult>((resolve) => {
    let settled = false
    const finish = (result: PythonRunResult) => {
      if (settled) return
      settled = true
      window.clearTimeout(timer)
      pending.delete(id)
      resolve(result)
    }

    const timer = window.setTimeout(() => {
      pending.delete(id)
      killWorker()
      finish(emptyResult({ timedOut: true }))
    }, timeoutMs)

    pending.set(id, (message) => {
      if (message.infra) {
        finish(emptyResult({ infraError: message.infra }))
        return
      }
      const tests = Array.isArray(message.tests)
        ? message.tests.map((test) => ({
            name: String(test.name ?? '測試'),
            passed: Boolean(test.passed),
            message: String(test.message ?? ''),
          }))
        : []
      finish(
        emptyResult({
          stdout: String(message.stdout ?? ''),
          stderr: String(message.stderr ?? ''),
          error: message.error ? String(message.error) : null,
          tests,
        }),
      )
    })

    current.postMessage({
      type: 'run',
      id,
      code: request.code,
      mode: request.mode,
      tests: request.tests ?? [],
    })
  })
}

export function executePython(request: ExecutePythonRequest): Promise<PythonRunResult> {
  const job = tail.then(() => executePythonUnlocked(request))
  tail = job.then(
    () => undefined,
    () => undefined,
  )
  return job
}
