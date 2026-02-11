// src/hooks/usePyodide.ts — React hook for managing Pyodide lifecycle
'use client';

import { useState, useEffect, useCallback } from 'react';
import { getPyodide, isPyodideReady, runPython, runTests, type RunResult, type TestOutcome } from '@/lib/pyodide-runner';
import { useStudioStore } from '@/lib/store';

export interface UsePyodideReturn {
  isLoading: boolean;
  isReady: boolean;
  error: string | null;
  run: (code?: string, inputs?: string[]) => Promise<RunResult>;
  test: (code?: string, inputs?: string[]) => Promise<TestOutcome[]>;
}

export function usePyodide(): UsePyodideReturn {
  const [isLoading, setIsLoading] = useState(!isPyodideReady());
  const [isReady, setIsReady] = useState(isPyodideReady());
  const [error, setError] = useState<string | null>(null);

  const store = useStudioStore();

  // Initialize Pyodide on mount
  useEffect(() => {
    if (isPyodideReady()) {
      setIsLoading(false);
      setIsReady(true);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        await getPyodide();
        if (!cancelled) {
          setIsLoading(false);
          setIsReady(true);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Failed to load Python runtime');
          setIsLoading(false);
        }
      }
    })();

    return () => { cancelled = true; };
  }, []);

  // Run user code
  const run = useCallback(async (code?: string, inputs?: string[]): Promise<RunResult> => {
    const codeToRun = code ?? store.code;
    store.setIsRunning(true);
    store.setOutput('');
    store.setError(null);

    try {
      const result = await runPython(codeToRun, inputs);
      store.setOutput(result.stdout);
      if (result.error) store.setError(result.error);
      return result;
    } finally {
      store.setIsRunning(false);
    }
  }, [store]);

  // Run tests
  const test = useCallback(async (code?: string, inputs?: string[]): Promise<TestOutcome[]> => {
    const codeToTest = code ?? store.code;
    const { currentLessonData, activeSectionIndex } = store;

    const section = currentLessonData?.sections[activeSectionIndex];
    const tests = section?.tests ?? [];

    if (tests.length === 0) return [];

    store.setIsTesting(true);
    store.setTestResults([]);

    try {
      const results = await runTests(codeToTest, tests, inputs);
      store.setTestResults(results);
      return results;
    } finally {
      store.setIsTesting(false);
    }
  }, [store]);

  return { isLoading, isReady, error, run, test };
}
