import { useCallback, useEffect, useState } from "react";
import { AppData, loadData, saveData } from "./db";

let cached: AppData | null = null;
const listeners = new Set<() => void>();

async function ensureLoaded() {
  if (!cached) cached = await loadData();
  return cached!;
}

export function useDB() {
  const [data, setData] = useState<AppData | null>(cached);
  const [loading, setLoading] = useState(!cached);

  useEffect(() => {
    const update = () => setData(cached ? { ...cached } : null);
    listeners.add(update);
    if (!cached) {
      ensureLoaded().then((d) => {
        cached = d;
        setData({ ...cached });
        setLoading(false);
        listeners.forEach((l) => l());
      });
    }
    return () => {
      listeners.delete(update);
    };
  }, []);

  const update = useCallback(async (mutator: (d: AppData) => AppData) => {
    // Optimistic update
    const current = cached || await loadData();
    const next = mutator({ ...current });
    cached = next;
    setData({ ...next });
    listeners.forEach((l) => l());

    // Sync with backend in background
    try {
      await saveData(next);
    } catch (err) {
      console.error("Failed to sync data with backend:", err);
      // Optional: you could refresh from server here to rollback on error
    }
  }, []);

  const refresh = useCallback(async () => {
    cached = await loadData();
    listeners.forEach((l) => l());
  }, []);

  return { data, loading, update, refresh };
}
