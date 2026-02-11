'use client';

import { useState } from 'react';

interface HintAccordionProps {
  hints: string[];
}

export function HintAccordion({ hints }: HintAccordionProps) {
  const [revealedCount, setRevealedCount] = useState(0);

  const labels = ['💡 Nudge', '🔦 Direction', '🎯 Near-answer'];

  return (
    <div
      className="mt-2 rounded-lg border overflow-hidden"
      style={{ borderColor: 'var(--border)' }}
    >
      <div
        className="flex items-center justify-between px-3 py-2"
        style={{ background: 'var(--bg-card)' }}
      >
        <span className="text-xs font-medium" style={{ color: 'var(--accent-yellow)' }}>
          Hints ({revealedCount}/{hints.length})
        </span>
        {revealedCount < hints.length && (
          <button
            onClick={() => setRevealedCount((c) => c + 1)}
            className="text-[10px] px-2 py-0.5 rounded border hover:opacity-80"
            style={{ borderColor: 'var(--accent-yellow)', color: 'var(--accent-yellow)' }}
          >
            Reveal next hint
          </button>
        )}
      </div>

      {hints.slice(0, revealedCount).map((hint, i) => (
        <div
          key={i}
          className="px-3 py-2 border-t text-xs"
          style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
        >
          <span className="font-medium mr-1" style={{ color: 'var(--accent-yellow)' }}>
            {labels[i] ?? `Hint ${i + 1}`}:
          </span>
          {hint}
        </div>
      ))}
    </div>
  );
}
