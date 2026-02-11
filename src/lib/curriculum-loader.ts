// src/lib/curriculum-loader.ts
// Loads curriculum and lesson data from JSON files (server-side only)
import { promises as fs } from 'fs';
import path from 'path';
import type { Curriculum, Lesson } from '@/types/lesson';

const CONTENT_DIR = path.join(process.cwd(), 'content');

let curriculumCache: Curriculum | null = null;

/** Load the master curriculum manifest */
export async function getCurriculum(): Promise<Curriculum> {
  if (curriculumCache) return curriculumCache;

  const raw = await fs.readFile(path.join(CONTENT_DIR, 'curriculum.json'), 'utf-8');
  curriculumCache = JSON.parse(raw) as Curriculum;
  return curriculumCache;
}

/** Load a single lesson by ID */
export async function getLesson(lessonId: string): Promise<Lesson | null> {
  try {
    const filePath = path.join(CONTENT_DIR, 'lessons', `${lessonId}.json`);
    const raw = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(raw) as Lesson;
  } catch {
    return null;
  }
}

/** Load all lessons for a module */
export async function getModuleLessons(moduleId: string): Promise<Lesson[]> {
  const curriculum = await getCurriculum();
  const mod = curriculum.modules.find((m) => m.id === moduleId);
  if (!mod) return [];

  const allIds = [...mod.lessons, ...mod.portfolioProjects];
  const lessons = await Promise.all(allIds.map(getLesson));
  return lessons.filter((l): l is Lesson => l !== null);
}

/** Get all available lesson IDs by scanning the filesystem */
export async function getAllLessonIds(): Promise<string[]> {
  const dir = path.join(CONTENT_DIR, 'lessons');
  const files = await fs.readdir(dir);
  return files
    .filter((f) => f.endsWith('.json'))
    .map((f) => f.replace('.json', ''));
}

/** Get prev/next lesson IDs for navigation */
export async function getLessonNavigation(lessonId: string) {
  const curriculum = await getCurriculum();

  // Flatten all lesson IDs in order
  const allIds: string[] = [];
  for (const mod of curriculum.modules) {
    allIds.push(...mod.lessons, ...mod.portfolioProjects);
  }

  const idx = allIds.indexOf(lessonId);
  return {
    prev: idx > 0 ? allIds[idx - 1] : null,
    next: idx < allIds.length - 1 ? allIds[idx + 1] : null,
  };
}
