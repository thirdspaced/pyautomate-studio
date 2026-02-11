// src/types/lesson.ts — TypeScript interfaces matching the lesson JSON schema

export interface LessonTest {
  name: string;
  assertion: string;
  points?: number;
}

export interface RemixConstraints {
  requiredSkills: string[];
  acceptanceTests: string[];
  exampleRemixes?: string[];
}

export interface Checkpoint {
  id: string;
  text: string;
}

export interface LessonSection {
  type: 'concept' | 'guided_code' | 'exercise' | 'checkpoint' | 'reflection' | 'portfolio_project';
  title: string;
  content?: string;
  starterCode?: string;
  solutionCode?: string;
  tests?: LessonTest[];
  hints?: string[];
  checkpoints?: Checkpoint[];
  prompts?: string[];
  remixable?: boolean;
  remixConstraints?: RemixConstraints;
}

export interface Lesson {
  id: string;                // e.g. 'm01-l01'
  moduleId: string;          // e.g. 'm01'
  title: string;
  order: number;
  estimatedMinutes: number;
  objectives: string[];
  prerequisites: string[];
  sections: LessonSection[];
  tags: string[];
}

export interface Module {
  id: string;                // e.g. 'm01'
  title: string;
  order: number;
  description: string;
  lessons: string[];         // lesson IDs in order
  portfolioProjects: string[];
}

export interface Curriculum {
  title: string;
  version: string;
  modules: Module[];
}

// ─── Progress Types ───────────────────────────────────────────

export type LessonStatus = 'not_started' | 'in_progress' | 'completed';

export interface ModuleProgress {
  moduleId: string;
  totalLessons: number;
  completedLessons: number;
  percentComplete: number;
}
