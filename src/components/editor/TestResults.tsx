'use client';

interface TestResult {
  name: string;
  passed: boolean;
  message?: string;
}

interface TestResultsProps {
  results: TestResult[];
}

export function TestResults({ results }: TestResultsProps) {
  if (results.length === 0) {
    return (
      <p className="text-xs italic" style={{ color: 'var(--text-muted)' }}>
        Click 🧪 Run Tests to check your solution
      </p>
    );
  }

  const passed = results.filter((r) => r.passed).length;
  const allPassed = passed === results.length;

  return (
    <div className="space-y-2">
      {/* Summary */}
      <div
        className="text-sm font-medium px-3 py-2 rounded-lg"
        style={{
          background: allPassed ? 'rgba(52,211,153,0.1)' : 'rgba(248,113,113,0.1)',
          color: allPassed ? 'var(--accent-green)' : 'var(--accent-red)',
        }}
      >
        {allPassed
          ? `🎉 All ${results.length} tests passed!`
          : `${passed}/${results.length} tests passing`}
      </div>

      {/* Individual results */}
      {results.map((r, i) => (
        <div
          key={i}
          className="flex items-start gap-2 text-xs px-3 py-2 rounded border"
          style={{
            borderColor: r.passed ? 'rgba(52,211,153,0.2)' : 'rgba(248,113,113,0.2)',
            background: r.passed ? 'rgba(52,211,153,0.04)' : 'rgba(248,113,113,0.04)',
          }}
        >
          <span className="mt-px">{r.passed ? '✅' : '❌'}</span>
          <div className="flex-1">
            <span
              className="font-mono"
              style={{ color: r.passed ? 'var(--accent-green)' : 'var(--accent-red)' }}
            >
              {r.name}
            </span>
            {r.message && !r.passed && (
              <p className="mt-0.5 font-mono" style={{ color: 'var(--text-muted)' }}>
                {r.message}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
