'use client';

import { useEffect, useState } from 'react';

import { getOfflineCompletionQueue, type OfflineQueueSnapshot } from './offlineQueue';

export function useOfflineCompletionSnapshot(): OfflineQueueSnapshot {
  const queue = getOfflineCompletionQueue();
  const [snapshot, setSnapshot] = useState<OfflineQueueSnapshot>(() => queue.getSnapshot());

  useEffect(() => {
    let active = true;
    const unsubscribe = queue.subscribe((next) => {
      if (active) {
        setSnapshot(next);
      }
    });
    void queue.hydrate();

    return () => {
      active = false;
      unsubscribe();
    };
  }, [queue]);

  return snapshot;
}
