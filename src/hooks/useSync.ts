/**
 * Sync hook — watches auth state and triggers pull/push automatically.
 */
import { useEffect, useRef } from 'react';
import { useAuth, useUser } from '@clerk/clerk-expo';
import { useAppStore } from '../stores/appStore';
import { syncPull, syncPush, setSyncToken, isApiReachable } from '../lib/sync/engine';

export function useSync() {
  const { isSignedIn, getToken } = useAuth();
  const { user } = useUser();
  const hasPulledRef = useRef(false);

  const recipes = useAppStore((s) => s.recipes);
  const batches = useAppStore((s) => s.batches);
  const setRecipes = useAppStore((s) => s.setRecipes);
  const setBatches = useAppStore((s) => s.setBatches);
  const syncQueue = useAppStore((s) => s.syncQueue);
  const clearSyncQueue = useAppStore((s) => s.clearSyncQueue);
  const isOnline = useAppStore((s) => s.isOnline);
  const setIsOnline = useAppStore((s) => s.setIsOnline);
  const lastSyncedAt = useAppStore((s) => s.lastSyncedAt);
  const setLastSyncedAt = useAppStore((s) => s.setLastSyncedAt);

  // Keep token fresh
  useEffect(() => {
    if (!isSignedIn) {
      setSyncToken(null);
      hasPulledRef.current = false;
      return;
    }

    let cancelled = false;

    async function refreshToken() {
      const token = await getToken();
      if (!cancelled && token) {
        setSyncToken(token);
      }
    }

    refreshToken();
    const interval = setInterval(refreshToken, 1000 * 60 * 5); // Refresh every 5 min

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [isSignedIn, getToken]);

  // Check online status
  useEffect(() => {
    async function check() {
      const reachable = await isApiReachable();
      setIsOnline(reachable);
    }
    check();
    const interval = setInterval(check, 1000 * 30); // Every 30s
    return () => clearInterval(interval);
  }, [setIsOnline]);

  // Pull on first sign-in
  useEffect(() => {
    if (!isSignedIn || !isOnline || hasPulledRef.current) return;

    async function doPull() {
      try {
        const result = await syncPull(lastSyncedAt ?? undefined);

        // Merge cloud data with local (cloud wins on conflict for now)
        if (result.recipes.length > 0) {
          const existingIds = new Set(recipes.map((r) => r.id));
          const newRecipes = result.recipes.filter((r) => !existingIds.has(r.id));
          if (newRecipes.length > 0) {
            setRecipes([...recipes, ...newRecipes]);
          }
        }

        if (result.batches.length > 0) {
          const existingIds = new Set(batches.map((b) => b.id));
          const newBatches = result.batches.filter((b) => !existingIds.has(b.id));
          if (newBatches.length > 0) {
            setBatches([...batches, ...newBatches]);
          }
        }

        setLastSyncedAt(result.syncedAt);
        hasPulledRef.current = true;
      } catch (err) {
        console.warn('Sync pull failed:', err);
      }
    }

    doPull();
  }, [isSignedIn, isOnline, lastSyncedAt, recipes, batches, setRecipes, setBatches, setLastSyncedAt]);

  // Process sync queue when online
  useEffect(() => {
    if (!isSignedIn || !isOnline || syncQueue.length === 0) return;

    async function processQueue() {
      try {
        const recipesToPush = syncQueue
          .filter((q) => q.type === 'recipe')
          .map((q) => q.payload as import('../lib/beerjson/types').Recipe);

        const batchesToPush = syncQueue
          .filter((q) => q.type === 'batch')
          .map((q) => q.payload as import('../lib/beerjson/types').Batch);

        const measurementsToPush = syncQueue
          .filter((q) => q.type === 'measurement')
          .map((q) => q.payload as { measurement: import('../lib/beerjson/types').BatchMeasurement; batchId: string });

        await syncPush({
          recipes: recipesToPush,
          batches: batchesToPush,
          measurements: measurementsToPush,
        });

        clearSyncQueue();
      } catch (err) {
        console.warn('Sync push failed:', err);
      }
    }

    processQueue();
  }, [isSignedIn, isOnline, syncQueue, clearSyncQueue]);

  return { isOnline, lastSyncedAt, queueLength: syncQueue.length };
}
