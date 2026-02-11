'use client';

import { useState } from 'react';
import type { Checkpoint } from '@/types/lesson';

interface CheckpointListProps {
  checkpoints: Checkpoint[];
}

export function CheckpointList({ checkpoints }: CheckpointListProps) {
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  const toggle = (id: string) => {
    setChecked((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const doneCount = Object.values(checked).filter(Boolean).length;

  return (
    <div
      className="mt-2 p-3 rounded-lg border"
      style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
    >
      <p className="text-xs font-medium mb-2" style={{ color: 'var(--accent-purple)' }}>
        ✅ Self-Check ({doneCount}/{checkpoints.length})
      </p>
      <div className="space-y-1.5">
        {checkpoints.map((cp) => (
          <label
            key={cp.id}
            className="flex items-start gap-2 cursor-pointer text-xs group"
          >
            <input
              type="checkbox"
              checked={checked[cp.id] ?? false}
              onChange={() => toggle(cp.id)}
              className="mt-0.5 accent-[#a78bfa]"
            />
            <span
              style={{
                color: checked[cp.id] ? 'var(--text-muted)' : 'var(--text-secondary)',
                textDecoration: checked[cp.id] ? 'line-through' : 'none',
              }}
            >
              {cp.text}
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}
