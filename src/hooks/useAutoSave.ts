// src/hooks/useAutoSave.ts — Debounced autosave to IndexedDB
'use client';

import { useRef, useCallback, useEffect } from 'react';
import { db } from '@/lib/db';

const DEBOUNCE_MS = 1000;

export function useAutoSave(lessonId: string) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestCodeRef = useRef<string>('');

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const save = useCallback((code: string) => {
    latestCodeRef.current = code;

    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(async () => {
      try {
        // Upsert latest autosave (version 0 = autosave, version 1+ = explicit snapshots)
        const existing = await db.codeArtifacts
          .where({ lessonId, filename: 'main.py' })
          .filter((a) => a.version === 0)
          .first();

        if (existing?.id) {
          await db.codeArtifacts.update(existing.id, {
            content: latestCodeRef.current,
            createdAt: new Date(),
          });
        } else {
          await db.codeArtifacts.add({
            lessonId,
            filename: 'main.py',
            content: latestCodeRef.current,
            version: 0, // 0 = autosave slot
            isSubmitted: false,
            createdAt: new Date(),
          });
        }

        // Update lesson state
        await db.lessonStates.where({ lessonId }).modify({
          status: 'in_progress',
          lastOpened: new Date(),
        });
      } catch (err) {
        console.error('Autosave failed:', err);
      }
    }, DEBOUNCE_MS);
  }, [lessonId]);

  return { save };
}
