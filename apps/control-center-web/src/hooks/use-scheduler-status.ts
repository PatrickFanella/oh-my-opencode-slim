import { useCallback, useEffect, useState } from 'react';
import { fetchSchedulerStatus } from '../api/client';
import type { SchedulerStatusSnapshot } from '../types';

export interface SchedulerStatusState {
  error?: string;
  isLoading: boolean;
  snapshot?: SchedulerStatusSnapshot;
}

export interface SchedulerStatusActions {
  refresh(): Promise<void>;
}

export function useSchedulerStatus(
  refreshIntervalMs = 5000,
): SchedulerStatusState & SchedulerStatusActions {
  const [snapshot, setSnapshot] = useState<SchedulerStatusSnapshot>();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>();

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const nextSnapshot = await fetchSchedulerStatus();
      setSnapshot(nextSnapshot);
      setError(undefined);
    } catch (refreshError) {
      setError(
        refreshError instanceof Error
          ? refreshError.message
          : String(refreshError),
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const timer = setInterval(() => {
      void refresh();
    }, refreshIntervalMs);

    return () => clearInterval(timer);
  }, [refresh, refreshIntervalMs]);

  return {
    error,
    isLoading,
    refresh,
    snapshot,
  };
}
