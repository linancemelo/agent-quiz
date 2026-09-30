/** Classic workers + importScripts. Pyodide 0.28+ dropped pyodide.js / classic workers. */
export const PYODIDE_VERSION = '0.27.7'

export const PYODIDE_INDEX_URL = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`

export const DEFAULT_PYODIDE_TIMEOUT_MS = 8000

export const MIN_PYODIDE_TIMEOUT_MS = 500

export const MAX_PYODIDE_TIMEOUT_MS = 30_000

export const MAX_LEARNER_CODE_CHARS = 20_000

export function resolvePyodideTimeout(timeout: number | undefined): number {
  if (typeof timeout !== 'number' || !Number.isFinite(timeout)) {
    return DEFAULT_PYODIDE_TIMEOUT_MS
  }
  return Math.min(MAX_PYODIDE_TIMEOUT_MS, Math.max(MIN_PYODIDE_TIMEOUT_MS, Math.round(timeout)))
}
