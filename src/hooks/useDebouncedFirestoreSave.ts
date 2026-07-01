import { useCallback, useRef, useState } from 'react';

interface UseDebouncedFirestoreSaveOptions<T> {
  delayMs?: number;
  /** Persists the patch (e.g. Firestore update) and applies it to local state. */
  persist: (id: string, patch: Partial<T>) => Promise<void>;
}

/**
 * Accumulates patches and persists them after a quiet period, to avoid
 * thrashing Firestore on rapid sequential edits.
 */
export function useDebouncedFirestoreSave<T>({
  delayMs = 1500,
  persist,
}: UseDebouncedFirestoreSaveOptions<T>) {
  const [isSaving, setIsSaving] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingPatchRef = useRef<Partial<T>>({});

  const cancelPending = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    pendingPatchRef.current = {};
  }, []);

  const save = useCallback(
    (id: string | undefined, patch: Partial<T>) => {
      if (!id) return;
      pendingPatchRef.current = { ...pendingPatchRef.current, ...patch };
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(async () => {
        const accumulated = { ...pendingPatchRef.current };
        pendingPatchRef.current = {};
        setIsSaving(true);
        try {
          await persist(id, accumulated);
        } finally {
          setIsSaving(false);
        }
      }, delayMs);
    },
    [delayMs, persist]
  );

  /** Cancels any pending debounce and persists the pending patch merged with extraPatch immediately. */
  const flushNow = useCallback(
    async (id: string | undefined, extraPatch: Partial<T>) => {
      if (!id) return;
      if (debounceRef.current) clearTimeout(debounceRef.current);
      const merged = { ...pendingPatchRef.current, ...extraPatch };
      setIsSaving(true);
      try {
        await persist(id, merged);
        pendingPatchRef.current = {};
      } finally {
        setIsSaving(false);
      }
    },
    [persist]
  );

  return { isSaving, save, flushNow, cancelPending };
}
