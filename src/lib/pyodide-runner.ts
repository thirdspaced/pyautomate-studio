// src/lib/pyodide-runner.ts — Browser-based Python execution via Pyodide (WASM)
//
// Usage:
//   const result = await runPython('print("hello")')
//   console.log(result.stdout) // "hello\n"

import type { PyodideInterface } from 'pyodide';

const PYODIDE_CDN = 'https://cdn.jsdelivr.net/pyodide/v0.26.4/full/';

let pyodideInstance: PyodideInterface | null = null;
let loadingPromise: Promise<PyodideInterface> | null = null;

// ─── Lifecycle ────────────────────────────────────────────────

/** Lazy-load Pyodide. First call downloads WASM (~5 MB); subsequent calls return cached instance. */
export async function getPyodide(): Promise<PyodideInterface> {
  if (pyodideInstance) return pyodideInstance;
  if (loadingPromise) return loadingPromise;

  loadingPromise = (async () => {
    // Pyodide script must be loaded in the page <head> or via importScripts
    if (typeof globalThis.loadPyodide === 'undefined') {
      // Dynamically inject the Pyodide loader script
      await new Promise<void>((resolve, reject) => {
        const script = document.createElement('script');
        script.src = `${PYODIDE_CDN}pyodide.js`;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Failed to load Pyodide script'));
        document.head.appendChild(script);
      });
    }

    // @ts-expect-error — loadPyodide is injected globally by the script
    const pyodide: PyodideInterface = await globalThis.loadPyodide({
      indexURL: PYODIDE_CDN,
    });

    pyodideInstance = pyodide;
    return pyodide;
  })();

  return loadingPromise;
}

/** Returns true once Pyodide has been loaded and is ready. */
export function isPyodideReady(): boolean {
  return pyodideInstance !== null;
}

// ─── Run Result Type ──────────────────────────────────────────

export interface RunResult {
  stdout: string;
  stderr: string;
  error: string | null;
  durationMs: number;
}

export interface TestOutcome {
  name: string;
  passed: boolean;
  message?: string;
  points?: number;
}

// ─── Execute Python Code ──────────────────────────────────────

/**
 * Run arbitrary Python code and capture stdout/stderr.
 *
 * For exercises that use `input()`, you can supply mock inputs
 * via the `inputs` parameter — each entry is fed sequentially.
 */
export async function runPython(
  code: string,
  inputs: string[] = []
): Promise<RunResult> {
  const pyodide = await getPyodide();
  const start = performance.now();

  // Set up stream capture + mock input
  const inputQueue = JSON.stringify(inputs);
  pyodide.runPython(`
import sys, io

# Capture stdout and stderr
sys.stdout = io.StringIO()
sys.stderr = io.StringIO()

# Mock input() with a queue
_input_queue = ${inputQueue}
_input_index = 0
def _mock_input(prompt=''):
    global _input_index
    sys.stdout.write(prompt)
    if _input_index < len(_input_queue):
        val = _input_queue[_input_index]
        _input_index += 1
        sys.stdout.write(val + '\\n')
        return val
    return ''

__builtins__['input'] = _mock_input
`);

  let error: string | null = null;

  try {
    await pyodide.runPythonAsync(code);
  } catch (e: unknown) {
    error = e instanceof Error ? e.message : String(e);
  }

  const stdout = pyodide.runPython('sys.stdout.getvalue()') as string;
  const stderr = pyodide.runPython('sys.stderr.getvalue()') as string;

  // Restore standard streams
  pyodide.runPython(`
sys.stdout = sys.__stdout__
sys.stderr = sys.__stderr__
__builtins__['input'] = __builtins__.__dict__.get('_original_input', input)
`);

  return {
    stdout,
    stderr,
    error,
    durationMs: Math.round(performance.now() - start),
  };
}

// ─── Test Runner ──────────────────────────────────────────────

/**
 * Run user code followed by test assertions.
 *
 * Test code should call:
 *   _assert_test('test_name', condition, 'failure message')
 *
 * Returns an array of test outcomes.
 */
export async function runTests(
  userCode: string,
  testAssertions: { name: string; assertion: string; points?: number }[],
  inputs: string[] = []
): Promise<TestOutcome[]> {
  const pyodide = await getPyodide();

  // Build test wrapper
  const inputQueue = JSON.stringify(inputs);
  const assertionBlock = testAssertions
    .map((t) => `
try:
    ${t.assertion}
except Exception as _e:
    _test_results.append({"name": "${t.name}", "passed": False, "message": str(_e), "points": ${t.points ?? 0}})
`)
    .join('\n');

  const fullCode = `
import json, sys, io, traceback

# Capture stdout for assertion checking
sys.stdout = io.StringIO()
sys.stderr = io.StringIO()

_input_queue = ${inputQueue}
_input_index = 0
def _mock_input(prompt=''):
    global _input_index
    sys.stdout.write(prompt)
    if _input_index < len(_input_queue):
        val = _input_queue[_input_index]
        _input_index += 1
        sys.stdout.write(val + '\\n')
        return val
    return ''
__builtins__['input'] = _mock_input

_test_results = []
_source_code = ${JSON.stringify(userCode)}

def _assert_test(name, condition, msg=""):
    _test_results.append({"name": name, "passed": bool(condition), "message": msg if not condition else ""})

# ──── User code ────
try:
${userCode.split('\n').map((line) => '    ' + line).join('\n')}
except Exception as _user_err:
    _test_results.append({"name": "runtime_error", "passed": False, "message": str(_user_err)})

_captured_stdout = sys.stdout.getvalue()

# ──── Test assertions ────
${assertionBlock}

sys.stdout = sys.__stdout__
sys.stderr = sys.__stderr__

json.dumps(_test_results)
`;

  try {
    const resultJson = await pyodide.runPythonAsync(fullCode);
    return JSON.parse(resultJson as string);
  } catch (e: unknown) {
    return [{
      name: 'test_framework_error',
      passed: false,
      message: e instanceof Error ? e.message : String(e),
    }];
  }
}
