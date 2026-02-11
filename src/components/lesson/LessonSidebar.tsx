'use client';

import { useState } from 'react';
import type { Lesson, LessonSection } from '@/types/lesson';
import { HintAccordion } from './HintAccordion';
import { CheckpointList } from './CheckpointList';

interface LessonSidebarProps {
  lesson: Lesson;
  codeSections: LessonSection[];
  activeSectionIdx: number;
  onSectionChange: (idx: number) => void;
}

export function LessonSidebar({
  lesson,
  codeSections,
  activeSectionIdx,
  onSectionChange,
}: LessonSidebarProps) {
  return (
    <div className="space-y-6">
      {/* Objectives */}
      <div>
        <h2
          className="text-xl font-bold mb-1"
          style={{ color: 'var(--text-primary)' }}
        >
          {lesson.title}
        </h2>
        <div className="flex flex-wrap gap-1.5 mb-3">
          {lesson.tags.map((tag) => (
            <span
              key={tag}
              className="text-[10px] px-2 py-0.5 rounded-full"
              style={{ background: 'rgba(79,143,247,0.12)', color: 'var(--accent-blue)' }}
            >
              {tag}
            </span>
          ))}
        </div>
        <div
          className="text-sm p-3 rounded-lg border"
          style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
        >
          <p className="font-medium mb-1.5" style={{ color: 'var(--text-primary)', fontSize: '0.8rem' }}>
            🎯 Learning Objectives
          </p>
          <ul className="space-y-1">
            {lesson.objectives.map((obj, i) => (
              <li
                key={i}
                className="text-xs flex gap-2"
                style={{ color: 'var(--text-secondary)' }}
              >
                <span style={{ color: 'var(--accent-green)' }}>✓</span>
                {obj}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* All sections rendered in order */}
      {lesson.sections.map((section, i) => (
        <SectionBlock
          key={i}
          section={section}
          index={i}
          isActiveCode={
            codeSections.indexOf(section) === activeSectionIdx &&
            codeSections.includes(section)
          }
          onActivate={() => {
            const codeIdx = codeSections.indexOf(section);
            if (codeIdx >= 0) onSectionChange(codeIdx);
          }}
        />
      ))}
    </div>
  );
}

function SectionBlock({
  section,
  index,
  isActiveCode,
  onActivate,
}: {
  section: LessonSection;
  index: number;
  isActiveCode: boolean;
  onActivate: () => void;
}) {
  const typeColors: Record<string, string> = {
    concept: 'var(--accent-blue)',
    guided_code: 'var(--accent-green)',
    exercise: 'var(--accent-yellow)',
    checkpoint: 'var(--accent-purple)',
    reflection: 'var(--text-muted)',
    portfolio_project: 'var(--accent-red)',
  };

  const typeIcons: Record<string, string> = {
    concept: '📖',
    guided_code: '🔬',
    exercise: '💪',
    checkpoint: '✅',
    reflection: '🤔',
    portfolio_project: '🎯',
  };

  return (
    <div>
      {/* Section header */}
      <div className="flex items-center gap-2 mb-2">
        <span>{typeIcons[section.type] ?? '📄'}</span>
        <h3
          className="text-sm font-semibold"
          style={{ color: typeColors[section.type] ?? 'var(--text-primary)' }}
        >
          {section.title}
        </h3>
        {section.starterCode && (
          <button
            onClick={onActivate}
            className="text-[10px] px-2 py-0.5 rounded ml-auto"
            style={{
              background: isActiveCode ? 'var(--accent-blue)' : 'var(--bg-hover)',
              color: isActiveCode ? '#fff' : 'var(--text-muted)',
            }}
          >
            {isActiveCode ? '● Active' : '→ Open'}
          </button>
        )}
      </div>

      {/* Content (rendered as simple HTML from markdown-ish content) */}
      {section.content && (
        <div
          className="lesson-content text-sm"
          dangerouslySetInnerHTML={{ __html: markdownToHtml(section.content) }}
        />
      )}

      {/* Hints */}
      {section.hints && section.hints.length > 0 && (
        <HintAccordion hints={section.hints} />
      )}

      {/* Checkpoints */}
      {section.checkpoints && section.checkpoints.length > 0 && (
        <CheckpointList checkpoints={section.checkpoints} />
      )}

      {/* Reflection prompts */}
      {section.prompts && section.prompts.length > 0 && (
        <div
          className="mt-2 p-3 rounded-lg border"
          style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
        >
          {section.prompts.map((prompt, i) => (
            <p key={i} className="text-xs italic mb-1.5" style={{ color: 'var(--text-secondary)' }}>
              💭 {prompt}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

/** Very simple markdown-to-HTML converter for lesson content */
function markdownToHtml(md: string): string {
  return md
    // Code blocks
    .replace(/```(\w*)\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>')
    // Inline code
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    // Bold
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    // Italic
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    // Headers
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    // Table support (simple)
    .replace(/\|(.+)\|\n\|[-| ]+\|\n((?:\|.+\|\n?)*)/g, (_match, header, body) => {
      const ths = header.split('|').map((h: string) => `<th>${h.trim()}</th>`).join('');
      const rows = body.trim().split('\n').map((row: string) => {
        const tds = row.split('|').filter(Boolean).map((c: string) => `<td>${c.trim()}</td>`).join('');
        return `<tr>${tds}</tr>`;
      }).join('');
      return `<table><thead><tr>${ths}</tr></thead><tbody>${rows}</tbody></table>`;
    })
    // Unordered lists
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>')
    // Paragraphs (lines separated by double newline)
    .replace(/\n\n/g, '</p><p>')
    .replace(/^(?!<)(.+)/gm, '<p>$1</p>')
    // Clean up nested <p> inside other elements
    .replace(/<p>(<h3|<pre|<table|<ul)/g, '$1')
    .replace(/(<\/h3>|<\/pre>|<\/table>|<\/ul>)<\/p>/g, '$1');
}
