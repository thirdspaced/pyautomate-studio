// src/lib/test-runner.ts
// Runs lesson acceptance tests against user code in Pyodide

export interface TestResult {
  name: string;
  passed: boolean;
  message: string;
  points?: number;
}

/**
 * Build the Python test script that wraps user code + assertion tests.
 * Each test uses: _assert_test(name, condition, failure_message)
 */
export function buildTestScript(
  userCode: string,
  assertions: { name: string; assertion: string; points?: number }[]
): string {
  const testCalls = assertions
    .map((t) => t.assertion)
    .join('\n');

  // We capture input() calls so tests don't hang
  return `
import json, sys
from io import StringIO

# Mock input() to return empty string (tests shouldn't depend on input)
_input_values = []
_input_idx = 0
_original_input = input
def _mock_input(prompt=""):
    global _input_idx
    if _input_idx < len(_input_values):
        val = _input_values[_input_idx]
        _input_idx += 1
        return val
    return ""

# Redirect stdout
_old_stdout = sys.stdout
sys.stdout = StringIO()

# Run user code
try:
    exec(${JSON.stringify(userCode)})
except Exception as _user_err:
    pass

# Capture output
_captured_output = sys.stdout.getvalue()
sys.stdout = _old_stdout

# Test framework
_test_results = []
def _assert_test(name, condition, msg=""):
    _test_results.append({
        "name": name,
        "passed": bool(condition),
        "message": msg if not bool(condition) else ""
    })

# Run assertions
try:
    ${testCalls.split('\n').map(line => '    ' + line).join('\n')}
except Exception as _test_err:
    _test_results.append({
        "name": "test_error",
        "passed": False,
        "message": str(_test_err)
    })

json.dumps(_test_results)
`.trim();
}

/**
 * Parse test results JSON from Pyodide output
 */
export function parseTestResults(
  resultJson: string,
  testDefs: { name: string; points?: number }[]
): TestResult[] {
  try {
    const results: TestResult[] = JSON.parse(resultJson);
    // Merge in points from definitions
    return results.map((r) => {
      const def = testDefs.find((d) => d.name === r.name);
      return { ...r, points: def?.points };
    });
  } catch {
    return [
      { name: 'parse_error', passed: false, message: 'Could not parse test results' },
    ];
  }
}
