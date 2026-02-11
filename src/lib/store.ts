// src/lib/store.ts — Global state management via Zustand
import { create } from 'zustand';
import { db, getLatestCode, saveCodeVersion, type ILessonState } from './db';
import type { TestOutcome } from './pyodide-runner';

// ─── Types ────────────────────────────────────────────────────

interface LessonSection {
  type: 'concept' | 'guided_code' | 'exercise' | 'checkpoint' | 'reflection' | 'portfolio_project';
  title: string;
  content?: string;
  starterCode?: string;
  solutionCode?: string;
  hints?: string[];
  tests?: { name: string; assertion: string; points?: number }[];
  remixable?: boolean;
}

interface LessonData {
  id: string;
  moduleId: string;
  title: string;
  order: number;
  estimatedMinutes: number;
  objectives: string[];
  sections: LessonSection[];
  tags: string[];
}

// ─── Store ────────────────────────────────────────────────────

interface StudioState {
  // Navigation
  currentLessonId: string | null;
  currentLessonData: LessonData | null;
  activeSectionIndex: number;

  // Editor
  code: string;
  output: string;
  error: string | null;
  testResults: TestOutcome[];
  isRunning: boolean;
  isTesting: boolean;

  // Settings
  runMode: 'pyodide' | 'docker';
  portfolioTheme: string;

  // Hints
  hintsRevealed: number; // 0 = none, 1 = first hint, etc.

  // Timer
  sessionStartTime: number | null;
  accumulatedTimeS: number;

  // ─── Actions ──────────────────────────────────────────

  // Navigation
  setCurrentLesson: (id: string, data: LessonData) => void;
  setActiveSectionIndex: (idx: number) => void;
  nextSection: () => void;
  prevSection: () => void;

  // Editor
  setCode: (code: string) => void;
  setOutput: (output: string) => void;
  setError: (error: string | null) => void;
  setTestResults: (results: TestOutcome[]) => void;
  setIsRunning: (running: boolean) => void;
  setIsTesting: (testing: boolean) => void;

  // Hints
  revealNextHint: () => void;
  resetHints: () => void;

  // Settings
  setRunMode: (mode: 'pyodide' | 'docker') => void;
  setPortfolioTheme: (theme: string) => void;

  // Timer
  startTimer: () => void;
  stopTimer: () => void;

  // Persistence
  loadLessonState: (lessonId: string) => Promise<void>;
  saveLessonProgress: (updates: Partial<ILessonState>) => Promise<void>;
  saveSnapshot: () => Promise<void>;
  submitCode: () => Promise<void>;
}

export const useStudioStore = create<StudioState>((set, get) => ({
  // Initial state
  currentLessonId: null,
  currentLessonData: null,
  activeSectionIndex: 0,
  code: '',
  output: '',
  error: null,
  testResults: [],
  isRunning: false,
  isTesting: false,
  runMode: 'pyodide',
  portfolioTheme: 'general',
  hintsRevealed: 0,
  sessionStartTime: null,
  accumulatedTimeS: 0,

  // ─── Navigation ─────────────────────────────────────────

  setCurrentLesson: (id, data) => set({
    currentLessonId: id,
    currentLessonData: data,
    activeSectionIndex: 0,
    code: data.sections[0]?.starterCode ?? '',
    output: '',
    error: null,
    testResults: [],
    hintsRevealed: 0,
  }),

  setActiveSectionIndex: (idx) => {
    const { currentLessonData } = get();
    if (!currentLessonData) return;

    const section = currentLessonData.sections[idx];
    set({
      activeSectionIndex: idx,
      code: section?.starterCode ?? get().code,
      output: '',
      error: null,
      testResults: [],
      hintsRevealed: 0,
    });
  },

  nextSection: () => {
    const { activeSectionIndex, currentLessonData } = get();
    if (!currentLessonData) return;
    const next = Math.min(activeSectionIndex + 1, currentLessonData.sections.length - 1);
    get().setActiveSectionIndex(next);
  },

  prevSection: () => {
    const { activeSectionIndex } = get();
    get().setActiveSectionIndex(Math.max(0, activeSectionIndex - 1));
  },

  // ─── Editor ─────────────────────────────────────────────

  setCode: (code) => set({ code }),
  setOutput: (output) => set({ output }),
  setError: (error) => set({ error }),
  setTestResults: (results) => set({ testResults: results }),
  setIsRunning: (running) => set({ isRunning: running }),
  setIsTesting: (testing) => set({ isTesting: testing }),

  // ─── Hints ──────────────────────────────────────────────

  revealNextHint: () => {
    const { hintsRevealed, currentLessonData, activeSectionIndex } = get();
    const section = currentLessonData?.sections[activeSectionIndex];
    const maxHints = section?.hints?.length ?? 0;
    set({ hintsRevealed: Math.min(hintsRevealed + 1, maxHints) });
  },

  resetHints: () => set({ hintsRevealed: 0 }),

  // ─── Settings ───────────────────────────────────────────

  setRunMode: (mode) => set({ runMode: mode }),
  setPortfolioTheme: (theme) => set({ portfolioTheme: theme }),

  // ─── Timer ──────────────────────────────────────────────

  startTimer: () => set({ sessionStartTime: Date.now() }),

  stopTimer: () => {
    const { sessionStartTime, accumulatedTimeS } = get();
    if (!sessionStartTime) return;
    const elapsed = Math.round((Date.now() - sessionStartTime) / 1000);
    set({
      sessionStartTime: null,
      accumulatedTimeS: accumulatedTimeS + elapsed,
    });
  },

  // ─── Persistence ────────────────────────────────────────

  loadLessonState: async (lessonId) => {
    const state = await db.lessonStates.get(lessonId);
    if (state) {
      set({ accumulatedTimeS: state.timeSpentS });
    }

    const latestCode = await getLatestCode(lessonId);
    if (latestCode !== null) {
      set({ code: latestCode });
    }
  },

  saveLessonProgress: async (updates) => {
    const { currentLessonId, accumulatedTimeS } = get();
    if (!currentLessonId) return;

    const existing = await db.lessonStates.get(currentLessonId);
    await db.lessonStates.put({
      lessonId: currentLessonId,
      status: 'in_progress',
      timeSpentS: accumulatedTimeS,
      checkpoints: {},
      notes: '',
      reflection: '',
      lastOpened: new Date(),
      ...existing,
      ...updates,
    });
  },

  saveSnapshot: async () => {
    const { currentLessonId, code } = get();
    if (!currentLessonId || !code) return;
    await saveCodeVersion(currentLessonId, code);
  },

  submitCode: async () => {
    const { currentLessonId, code } = get();
    if (!currentLessonId || !code) return;
    await saveCodeVersion(currentLessonId, code, 'main.py', true);
  },
}));
