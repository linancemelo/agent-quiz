import harness from '@/lib/pyodide/harness.py?raw'
import { PYODIDE_INDEX_URL } from '@/lib/pyodide/constants'

const WORKER_BOOT = `
let pyodide = null;
let booting = null;

function boot() {
  if (!booting) {
    booting = (async () => {
      pyodide = await loadPyodide({ indexURL: INDEX_URL });
      pyodide.runPython(HARNESS);
      self.postMessage({ type: "ready" });
    })();
  }
  return booting;
}

self.onmessage = async (event) => {
  const data = event.data || {};
  try {
    await boot();
  } catch (err) {
    self.postMessage({
      type: "boot-error",
      message: err && err.message ? String(err.message) : String(err),
    });
    return;
  }
  if (data.type === "warmup") return;
  const id = data.id;
  try {
    const payload = JSON.stringify({
      code: typeof data.code === "string" ? data.code : "",
      mode: data.mode === "grade" ? "grade" : "run",
      tests: Array.isArray(data.tests) ? data.tests : [],
    });
    pyodide.globals.set("_aq_payload", payload);
    let raw = pyodide.runPython("_aq_run(_aq_payload)");
    let text = typeof raw === "string" ? raw : String(raw);
    if (raw && typeof raw.destroy === "function") raw.destroy();
    raw = null;
    const parsed = JSON.parse(text);
    self.postMessage({
      type: "result",
      id: id,
      stdout: parsed.stdout || "",
      stderr: parsed.stderr || "",
      error: parsed.error || null,
      tests: Array.isArray(parsed.tests) ? parsed.tests : [],
    });
  } catch (err) {
    self.postMessage({
      type: "result",
      id: id,
      stdout: "",
      stderr: "",
      error: null,
      tests: [],
      infra: err && err.message ? String(err.message) : String(err),
    });
  }
};
`

/** Classic worker (blob + importScripts). Kept off the MCQ path via dynamic import. */
export function buildPyodideWorkerSource(): string {
  const pyodideJs = `${PYODIDE_INDEX_URL}pyodide.js`
  return [
    `importScripts(${JSON.stringify(pyodideJs)});`,
    `const INDEX_URL = ${JSON.stringify(PYODIDE_INDEX_URL)};`,
    `const HARNESS = ${JSON.stringify(harness)};`,
    WORKER_BOOT,
  ].join('\n')
}
