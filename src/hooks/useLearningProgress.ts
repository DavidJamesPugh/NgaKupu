import { useCallback, useEffect, useMemo, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import type { LearningPath } from '../data/learningPaths';

const STORAGE_KEY = 'ngakupu.learning-progress.v1';

interface PersistedProgress {
  completedStageIds: string[];
}

const makeStageKey = (pathId: string, stageId: string) => `${pathId}::${stageId}`;
const memoryStorage = new Map<string, string>();

const safeGetItem = async (key: string) => {
  try {
    const value = await SecureStore.getItemAsync(key);
    if (value != null) {
      return value;
    }
  } catch {
    // Native storage may be unavailable in some runtimes.
  }
  return memoryStorage.get(key) ?? null;
};

const safeSetItem = async (key: string, value: string) => {
  memoryStorage.set(key, value);
  try {
    await SecureStore.setItemAsync(key, value);
  } catch {
    // Keep working with in-memory fallback when native storage is unavailable.
  }
};

const safeDeleteItem = async (key: string) => {
  memoryStorage.delete(key);
  try {
    await SecureStore.deleteItemAsync(key);
  } catch {
    // noop
  }
};

export const useLearningProgress = () => {
  const [completedStageIds, setCompletedStageIds] = useState<Set<string>>(new Set());
  const [isLoaded, setIsLoaded] = useState(false);

  const refreshProgress = useCallback(async () => {
    try {
      const raw = await safeGetItem(STORAGE_KEY);
      if (!raw) {
        setCompletedStageIds(new Set());
        return;
      }
      const parsed = JSON.parse(raw) as PersistedProgress;
      setCompletedStageIds(new Set(parsed.completedStageIds ?? []));
    } catch {
      // noop: progress is optional
    } finally {
      setIsLoaded(true);
    }
  }, []);

  useEffect(() => {
    refreshProgress();
  }, [refreshProgress]);

  const saveProgress = useCallback(async (next: Set<string>) => {
    const payload: PersistedProgress = {
      completedStageIds: Array.from(next),
    };
    await safeSetItem(STORAGE_KEY, JSON.stringify(payload));
  }, []);

  const markStageComplete = useCallback(
    async (pathId: string, stageId: string) => {
      const key = makeStageKey(pathId, stageId);
      setCompletedStageIds((prev) => {
        if (prev.has(key)) {
          return prev;
        }
        const nextSet = new Set(prev);
        nextSet.add(key);
        // Fire-and-forget persistence so UI updates immediately.
        void saveProgress(nextSet);
        return nextSet;
      });
    },
    [saveProgress],
  );

  const clearProgress = useCallback(async () => {
    setCompletedStageIds(new Set());
    await safeDeleteItem(STORAGE_KEY);
  }, []);

  const isStageComplete = useCallback(
    (pathId: string, stageId: string) => completedStageIds.has(makeStageKey(pathId, stageId)),
    [completedStageIds],
  );

  const getPathProgress = useCallback(
    (path: LearningPath) => {
      const completionStages = path.stages.filter((stage) => stage.countsTowardCompletion !== false);
      const totalStages = completionStages.length;
      const completeStages = completionStages.filter((stage) =>
        completedStageIds.has(makeStageKey(path.id, stage.id)),
      ).length;
      const isComplete = totalStages > 0 && completeStages === totalStages;
      return { completeStages, totalStages, isComplete };
    },
    [completedStageIds],
  );

  return useMemo(
    () => ({
      isLoaded,
      refreshProgress,
      markStageComplete,
      clearProgress,
      isStageComplete,
      getPathProgress,
    }),
    [
      isLoaded,
      refreshProgress,
      markStageComplete,
      clearProgress,
      isStageComplete,
      getPathProgress,
    ],
  );
};
