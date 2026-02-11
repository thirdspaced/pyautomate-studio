'use client';

interface OutputPanelProps {
  output: string;
  error: string | null;
  isRunning: boolean;
}

export function OutputPanel({ output, error, isRunning }: OutputPanelProps) {
  if (isRunning) {
    return (
      <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-muted)' }}>
        <span className="animate-pulse">⏳</span>
        Loading Python runtime…
      </div>
    );
  }

  if (!output && !error) {
    return (
      <p className="text-xs italic" style={{ color: 'var(--text-muted)' }}>
        Click ▶ Run to see output here
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {output && (
        <pre
          className="text-sm whitespace-pre-wrap font-mono"
          style={{ color: 'var(--text-primary)' }}
        >
          {output}
        </pre>
      )}
      {error && (
        <pre
          className="text-sm whitespace-pre-wrap font-mono p-2 rounded border"
          style={{
            color: 'var(--accent-red)',
            borderColor: 'rgba(248,113,113,0.3)',
            background: 'rgba(248,113,113,0.06)',
          }}
        >
          {formatError(error)}
        </pre>
      )}
    </div>
  );
}

/** Clean up Pyodide error traces for readability */
function formatError(err: string): string {
  // Remove Pyodide internal frames, keep the user-relevant parts
  const lines = err.split('\n');
  const relevantLines = lines.filter(
    (line) =>
      !line.includes('pyodide') &&
      !line.includes('wasm') &&
      !line.includes('JsProxy')
  );
  return relevantLines.length > 0 ? relevantLines.join('\n') : err;
}
