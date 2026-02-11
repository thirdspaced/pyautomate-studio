// src/lib/db.ts — IndexedDB persistence via Dexie
import Dexie, { type Table } from 'dexie';

// ─── Interfaces ───────────────────────────────────────────────

export interface ILessonState {
  lessonId: string;             // Primary key, e.g. 'm01-l01'
  status: 'not_started' | 'in_progress' | 'completed';
  startedAt?: Date;
  completedAt?: Date;
  timeSpentS: number;           // cumulative seconds
  checkpoints: Record<string, boolean>;
  notes: string;
  reflection: string;
  lastOpened: Date;
}

export interface ICodeArtifact {
  id?: number;                  // Auto-increment
  lessonId: string;
  filename: string;             // e.g. 'main.py'
  content: string;
  version: number;
  isSubmitted: boolean;
  createdAt: Date;
}

export interface IRunResult {
  id?: number;
  artifactId: number;
  lessonId: string;
  stdout: string;
  stderr: string;
  error: string | null;
  tests: TestResult[];
  allPassed: boolean;
  runMode: 'pyodide' | 'docker';
  durationMs: number;
  createdAt: Date;
}

export interface TestResult {
  name: string;
  passed: boolean;
  message?: string;
  points?: number;
}

export interface IRemix {
  id?: number;
  lessonId: string;
  userPrompt: string;
  constraints: {
    requiredSkills: string[];
    acceptanceTests: string[];
  };
  generatedBrief?: string;
  generatedStarterCode?: string;
  generatedTests?: string;
  createdAt: Date;
}

export interface IUserProfile {
  id: string;                    // 'default' for local-only mode
  displayName: string;
  portfolioTheme: string;
  preferences: {
    explainStyle?: 'examples' | 'theory' | 'balanced';
    difficulty?: 'beginner' | 'intermediate' | 'advanced';
    runMode?: 'pyodide' | 'docker';
  };
  createdAt: Date;
}

export interface ISkillMastery {
  id?: number;
  skillTag: string;              // e.g. 'loops', 'regex', 'file_io'
  confidence: number;            // 0.0 – 1.0
  attempts: number;
  lastAssessed?: Date;
}

export interface IExportManifest {
  id?: number;
  lessonId: string;
  projectName: string;
  files: { filename: string; size: number }[];
  portfolioReady: boolean;
  narrative?: string;
  exportedAt: Date;
}

// ─── Database ─────────────────────────────────────────────────

class PyAutomateDB extends Dexie {
  userProfile!: Table<IUserProfile, string>;
  lessonStates!: Table<ILessonState, string>;
  codeArtifacts!: Table<ICodeArtifact, number>;
  runResults!: Table<IRunResult, number>;
  remixes!: Table<IRemix, number>;
  skillMastery!: Table<ISkillMastery, number>;
  exportManifests!: Table<IExportManifest, number>;

  constructor() {
    super('pyautomate-studio');

    this.version(1).stores({
      userProfile: 'id',
      lessonStates: 'lessonId',
      codeArtifacts: '++id, lessonId, [lessonId+filename], [lessonId+filename+version]',
      runResults: '++id, artifactId, lessonId',
      remixes: '++id, lessonId',
      skillMastery: '++id, skillTag',
      exportManifests: '++id, lessonId',
    });
  }
}

export const db = new PyAutomateDB();

// ─── Helpers ──────────────────────────────────────────────────

/** Ensure a default user profile exists */
export async function ensureUserProfile(): Promise<IUserProfile> {
  const existing = await db.userProfile.get('default');
  if (existing) return existing;

  const profile: IUserProfile = {
    id: 'default',
    displayName: 'Learner',
    portfolioTheme: 'general',
    preferences: { runMode: 'pyodide', explainStyle: 'balanced', difficulty: 'beginner' },
    createdAt: new Date(),
  };
  await db.userProfile.put(profile);
  return profile;
}

/** Get the latest code for a lesson+file */
export async function getLatestCode(lessonId: string, filename = 'main.py'): Promise<string | null> {
  const artifacts = await db.codeArtifacts
    .where({ lessonId, filename })
    .reverse()
    .sortBy('version');

  return artifacts.length > 0 ? artifacts[0].content : null;
}

/** Save a new code version */
export async function saveCodeVersion(
  lessonId: string,
  content: string,
  filename = 'main.py',
  isSubmitted = false
): Promise<number> {
  const existing = await db.codeArtifacts
    .where({ lessonId, filename })
    .reverse()
    .sortBy('version');

  const nextVersion = existing.length > 0 ? existing[0].version + 1 : 1;

  return db.codeArtifacts.add({
    lessonId,
    filename,
    content,
    version: nextVersion,
    isSubmitted,
    createdAt: new Date(),
  });
}
