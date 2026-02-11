// src/components/progress/ModuleCard.tsx
import Link from 'next/link';

interface ModuleCardProps {
  moduleId: string;
  title: string;
  description: string;
  order: number;
  lessonIds: string[];
  portfolioIds: string[];
  availableCount: number;
  totalCount: number;
}

export function ModuleCard({
  moduleId,
  title,
  description,
  order,
  lessonIds,
  portfolioIds,
  availableCount,
  totalCount,
}: ModuleCardProps) {
  const hasContent = availableCount > 0;

  return (
    <div
      className="rounded-xl p-5 border transition-colors"
      style={{
        background: 'var(--bg-card)',
        borderColor: 'var(--border)',
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <span
            className="flex items-center justify-center w-9 h-9 rounded-lg text-sm font-bold"
            style={{ background: 'var(--accent-blue)', color: '#fff' }}
          >
            {order}
          </span>
          <div>
            <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
              {title}
            </h2>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              {description}
            </p>
          </div>
        </div>
        <span
          className="text-xs px-2 py-1 rounded-full"
          style={{
            background: hasContent ? 'rgba(52,211,153,0.15)' : 'rgba(107,115,148,0.15)',
            color: hasContent ? 'var(--accent-green)' : 'var(--text-muted)',
          }}
        >
          {availableCount}/{totalCount} ready
        </span>
      </div>

      {/* Lesson Links */}
      {hasContent && (
        <div className="flex flex-wrap gap-2 mt-3">
          {lessonIds.map((id, i) => (
            <Link
              key={id}
              href={`/lesson/${id}`}
              className="text-xs px-3 py-1.5 rounded-md border transition-colors hover:border-blue-400"
              style={{
                borderColor: 'var(--border)',
                color: 'var(--text-secondary)',
                background: 'var(--bg-secondary)',
              }}
            >
              Lesson {i + 1}
            </Link>
          ))}
          {portfolioIds.map((id) => (
            <Link
              key={id}
              href={`/lesson/${id}`}
              className="text-xs px-3 py-1.5 rounded-md border transition-colors hover:border-purple-400"
              style={{
                borderColor: 'var(--accent-purple)',
                color: 'var(--accent-purple)',
                background: 'rgba(167,139,250,0.08)',
              }}
            >
              🎯 Portfolio
            </Link>
          ))}
        </div>
      )}

      {!hasContent && (
        <p className="text-xs mt-2 italic" style={{ color: 'var(--text-muted)' }}>
          Coming soon — lessons not yet authored
        </p>
      )}
    </div>
  );
}
