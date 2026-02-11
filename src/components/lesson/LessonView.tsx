'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import type { Lesson, LessonSection } from '@/types/lesson';
import { LessonSidebar } from './LessonSidebar';
import { PythonEditor } from '../editor/PythonEditor';
import { OutputPanel } from '../editor/OutputPanel';
import { TestResults } from '../editor/TestResults';
import Link from 'next/link';

interface LessonViewProps {
  lesson: Lesson;
  moduleTitle: string;
  prevLessonId: string | null;
  nextLessonId: string | null;
}

export function LessonView({ lesson, moduleTitle, prevLessonId, nextLessonId }: LessonViewProps) {
  // Find the first section with starterCode
  const codeSections = lesson.sections.filter((s) => s.starterCode);
  const [activeSectionIdx, setActiveSectionIdx] = useState(0);
  const activeCodeSection = codeSections[activeSectionIdx] ?? null;

  const [code, setCode] = useState(activeCodeSection?.starterCode ?? '# Write your code here\n');
  const [output, setOutput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [testResults, setTestResults] = useState<
    { name: string; passed: boolean; message?: string }[]
  >([]);
  const [activeTab, setActiveTab] = useState<'output' | 'tests'>('output');

  // Update code when switching sections
  useEffect(() => {
    const section = codeSections[activeSectionIdx];
    if (section?.starterCode) {
      setCode(section.starterCode);
      setOutput('');
      setError(null);
      setTestResults([]);
    }
  }, [activeSectionIdx]);

  // ─── Run Python code via Pyodide ──────────────
  const runCode = useCallback(async () => {
    setIsRunning(true);
    setOutput('');
    setError(null);
    setTestResults([]);
    setActiveTab('output');

    try {
      // @ts-expect-error - Pyodide loaded via CDN
      const pyodide = await globalThis.loadPyodide({
        indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.26.4/full/',
      });

      // Capture stdout
      pyodide.runPython(`
import sys, io
sys.stdout = io.StringIO()
sys.stderr = io.StringIO()
      `);

      try {
        await pyodide.runPythonAsync(code);
      } catch (e: any) {
        setError(e.message || String(e));
      }

      const stdout = pyodide.runPython('sys.stdout.getvalue()') as string;
      const stderr = pyodide.runPython('sys.stderr.getvalue()') as string;

      pyodide.runPython(`
sys.stdout = sys.__stdout__
sys.stderr = sys.__stderr__
      `);

      setOutput(stdout + (stderr ? '\n' + stderr : ''));
    } catch (e: any) {
      setError(e.message || 'Failed to run Python');
    } finally {
      setIsRunning(false);
    }
  }, [code]);

  // ─── Run Tests ──────────────
  const runTests = useCallback(async () => {
    if (!activeCodeSection?.tests?.length) return;

    setIsRunning(true);
    setTestResults([]);
    setActiveTab('tests');

    try {
      // @ts-expect-error - Pyodide loaded via CDN
      const pyodide = await globalThis.loadPyodide({
        indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.26.4/full/',
      });

      const testAssertions = activeCodeSection.tests
        .map((t) => t.assertion)
        .join('\n');

      const wrappedScript = `
import json, sys
from io import StringIO

# Suppress output during testing
sys.stdout = StringIO()
sys.stderr = StringIO()

# Mock input
def input(prompt=""):
    return ""

# Execute user code
try:
    exec(${JSON.stringify(code)})
except Exception as _user_err:
    pass

sys.stdout = sys.__stdout__
sys.stderr = sys.__stderr__

# Test framework
_test_results = []
def _assert_test(name, condition, msg=""):
    _test_results.append({"name": name, "passed": bool(condition), "message": msg if not bool(condition) else ""})

try:
    ${testAssertions.split('\n').map((l: string) => '    ' + l).join('\n')}
except Exception as _test_err:
    _test_results.append({"name": "test_error", "passed": False, "message": str(_test_err)})

json.dumps(_test_results)
`;

      const resultJson = await pyodide.runPythonAsync(wrappedScript);
      const results = JSON.parse(resultJson);
      setTestResults(results);
    } catch (e: any) {
      setTestResults([
        { name: 'framework_error', passed: false, message: String(e) },
      ]);
    } finally {
      setIsRunning(false);
    }
  }, [code, activeCodeSection]);

  // ─── Reset code ──────────────
  const resetCode = useCallback(() => {
    if (activeCodeSection?.starterCode) {
      setCode(activeCodeSection.starterCode);
      setOutput('');
      setError(null);
      setTestResults([]);
    }
  }, [activeCodeSection]);

  // ─── Show solution ──────────────
  const showSolution = useCallback(() => {
    if (activeCodeSection?.solutionCode) {
      setCode(activeCodeSection.solutionCode);
    }
  }, [activeCodeSection]);

  return (
    <div className="flex flex-col h-[calc(100vh-52px)]">
      {/* Top bar with lesson info + nav */}
      <div
        className="flex items-center justify-between px-4 py-2 border-b text-sm"
        style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)' }}
      >
        <div className="flex items-center gap-2">
          <Link
            href="/"
            className="hover:underline"
            style={{ color: 'var(--text-muted)' }}
          >
            {moduleTitle}
          </Link>
          <span style={{ color: 'var(--text-muted)' }}>/</span>
          <span style={{ color: 'var(--text-primary)' }} className="font-medium">
            {lesson.title}
          </span>
          <span
            className="ml-2 text-xs px-2 py-0.5 rounded-full"
            style={{ background: 'rgba(79,143,247,0.15)', color: 'var(--accent-blue)' }}
          >
            ~{lesson.estimatedMinutes} min
          </span>
        </div>
        <div className="flex items-center gap-2">
          {prevLessonId && (
            <Link
              href={`/lesson/${prevLessonId}`}
              className="px-3 py-1 rounded text-xs border hover:opacity-80"
              style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
            >
              ← Prev
            </Link>
          )}
          {nextLessonId && (
            <Link
              href={`/lesson/${nextLessonId}`}
              className="px-3 py-1 rounded text-xs border hover:opacity-80"
              style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
            >
              Next →
            </Link>
          )}
        </div>
      </div>

      {/* Split pane: sidebar | editor+output */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Lesson content */}
        <div
          className="w-[420px] min-w-[320px] overflow-y-auto border-r p-5"
          style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)' }}
        >
          <LessonSidebar
            lesson={lesson}
            codeSections={codeSections}
            activeSectionIdx={activeSectionIdx}
            onSectionChange={setActiveSectionIdx}
          />
        </div>

        {/* Right: Editor + Output */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Section tab bar (if multiple code sections) */}
          {codeSections.length > 1 && (
            <div
              className="flex gap-1 px-3 py-2 border-b overflow-x-auto"
              style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)' }}
            >
              {codeSections.map((s, i) => (
                <button
                  key={i}
                  onClick={() => setActiveSectionIdx(i)}
                  className="px-3 py-1 rounded text-xs whitespace-nowrap transition-colors"
                  style={{
                    background: i === activeSectionIdx ? 'var(--accent-blue)' : 'transparent',
                    color: i === activeSectionIdx ? '#fff' : 'var(--text-secondary)',
                  }}
                >
                  {s.title}
                </button>
              ))}
            </div>
          )}

          {/* Editor toolbar */}
          <div
            className="flex items-center justify-between px-3 py-2 border-b"
            style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
          >
            <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
              main.py
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={resetCode}
                className="px-3 py-1 rounded text-xs border hover:opacity-80"
                style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
              >
                ↺ Reset
              </button>
              {activeCodeSection?.solutionCode && (
                <button
                  onClick={showSolution}
                  className="px-3 py-1 rounded text-xs border hover:opacity-80"
                  style={{ borderColor: 'var(--accent-yellow)', color: 'var(--accent-yellow)' }}
                >
                  💡 Solution
                </button>
              )}
              {activeCodeSection?.tests && activeCodeSection.tests.length > 0 && (
                <button
                  onClick={runTests}
                  disabled={isRunning}
                  className="px-3 py-1 rounded text-xs font-medium"
                  style={{
                    background: 'var(--accent-purple)',
                    color: '#fff',
                    opacity: isRunning ? 0.6 : 1,
                  }}
                >
                  {isRunning ? '⏳ Testing…' : '🧪 Run Tests'}
                </button>
              )}
              <button
                onClick={runCode}
                disabled={isRunning}
                className="px-3 py-1 rounded text-xs font-medium"
                style={{
                  background: 'var(--accent-green)',
                  color: '#000',
                  opacity: isRunning ? 0.6 : 1,
                }}
              >
                {isRunning ? '⏳ Running…' : '▶ Run'}
              </button>
            </div>
          </div>

          {/* Code editor */}
          <div className="flex-1 min-h-0">
            <PythonEditor
              code={code}
              onChange={setCode}
            />
          </div>

          {/* Output / Test Results */}
          <div
            className="h-[220px] min-h-[120px] border-t flex flex-col"
            style={{ borderColor: 'var(--border)' }}
          >
            {/* Tabs */}
            <div
              className="flex gap-4 px-4 py-2 border-b text-xs"
              style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
            >
              <button
                onClick={() => setActiveTab('output')}
                className="font-medium"
                style={{
                  color: activeTab === 'output' ? 'var(--accent-blue)' : 'var(--text-muted)',
                }}
              >
                Output
              </button>
              {activeCodeSection?.tests && activeCodeSection.tests.length > 0 && (
                <button
                  onClick={() => setActiveTab('tests')}
                  className="font-medium"
                  style={{
                    color: activeTab === 'tests' ? 'var(--accent-purple)' : 'var(--text-muted)',
                  }}
                >
                  Tests {testResults.length > 0 && (
                    <span>
                      ({testResults.filter((t) => t.passed).length}/{testResults.length})
                    </span>
                  )}
                </button>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4" style={{ background: 'var(--bg-primary)' }}>
              {activeTab === 'output' ? (
                <OutputPanel output={output} error={error} isRunning={isRunning} />
              ) : (
                <TestResults results={testResults} />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
