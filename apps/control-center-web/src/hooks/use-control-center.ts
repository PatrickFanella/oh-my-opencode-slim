import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  createSchedulerEventSource,
  fetchSnapshot,
  parseSchedulerEvent,
} from '../api/client';
import type { ControlCenterSnapshot, StreamEvent, TaskSummary } from '../types';

export type StreamTab = 'scheduler' | 'session' | 'runs' | 'report';

const TABS: StreamTab[] = ['scheduler', 'session', 'runs', 'report'];

export interface ControlCenterState {
  error?: string;
  filter: string;
  follow: boolean;
  generatedAt?: string;
  isLoading: boolean;
  liveEvents: StreamEvent[];
  message?: string;
  selectedTaskName?: string;
  snapshot?: ControlCenterSnapshot;
  streamTab: StreamTab;
  visibleTasks: TaskSummary[];
}

export interface ControlCenterActions {
  clearMessage(): void;
  cycleStreamTab(): void;
  refresh(message?: string): Promise<void>;
  selectDelta(delta: number): void;
  selectTask(taskName: string): void;
  setFilter(value: string): void;
  setStreamTab(tab: StreamTab): void;
  toggleFollow(): void;
}

export function useControlCenter(
  refreshIntervalMs = 5000,
): ControlCenterState & ControlCenterActions {
  const [snapshot, setSnapshot] = useState<ControlCenterSnapshot>();
  const [selectedTaskName, setSelectedTaskName] = useState<string>();
  const [filter, setFilter] = useState('');
  const [streamTab, setStreamTab] = useState<StreamTab>('scheduler');
  const [follow, setFollow] = useState(true);
  const [liveEvents, setLiveEvents] = useState<StreamEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>();
  const [message, setMessage] = useState<string>();

  const refresh = useCallback(
    async (nextMessage?: string) => {
      setIsLoading(true);
      try {
        const nextSnapshot = await fetchSnapshot(selectedTaskName);
        setSnapshot(nextSnapshot);
        setSelectedTaskName(
          nextSnapshot.selectedTask?.name ?? nextSnapshot.tasks[0]?.name,
        );
        setError(undefined);
        setMessage(nextMessage);
      } catch (refreshError) {
        setError(
          refreshError instanceof Error
            ? refreshError.message
            : String(refreshError),
        );
      } finally {
        setIsLoading(false);
      }
    },
    [selectedTaskName],
  );

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const timer = setInterval(() => {
      if (follow) void refresh();
    }, refreshIntervalMs);
    return () => clearInterval(timer);
  }, [follow, refresh, refreshIntervalMs]);

  useEffect(() => {
    if (!follow || typeof EventSource === 'undefined') return;
    const source = createSchedulerEventSource();
    const handleEvent = (event: MessageEvent<string>) => {
      setLiveEvents((events) =>
        [...events, parseSchedulerEvent(event)].slice(-80),
      );
    };
    source.addEventListener('scheduler', handleEvent);
    source.onerror = () => source.close();
    return () => source.close();
  }, [follow]);

  const visibleTasks = useMemo(
    () => filterTasks(snapshot?.tasks ?? [], filter),
    [filter, snapshot?.tasks],
  );

  const selectTask = useCallback((taskName: string) => {
    setSelectedTaskName(taskName);
  }, []);

  const selectDelta = useCallback(
    (delta: number) => {
      if (visibleTasks.length === 0) return;
      const currentIndex = Math.max(
        0,
        visibleTasks.findIndex((task) => task.name === selectedTaskName),
      );
      const nextIndex = clamp(currentIndex + delta, 0, visibleTasks.length - 1);
      setSelectedTaskName(visibleTasks[nextIndex].name);
    },
    [selectedTaskName, visibleTasks],
  );

  const cycleStreamTab = useCallback(() => {
    setStreamTab((tab) => TABS[(TABS.indexOf(tab) + 1) % TABS.length]);
  }, []);

  const toggleFollow = useCallback(() => {
    setFollow((value) => {
      const next = !value;
      setMessage(next ? 'follow on' : 'follow paused');
      return next;
    });
  }, []);

  return {
    clearMessage: () => setMessage(undefined),
    cycleStreamTab,
    error,
    filter,
    follow,
    generatedAt: snapshot?.generatedAt,
    isLoading,
    liveEvents,
    message,
    refresh,
    selectedTaskName,
    selectDelta,
    selectTask,
    setFilter,
    setStreamTab,
    snapshot,
    streamTab,
    toggleFollow,
    visibleTasks,
  };
}

function filterTasks(
  tasks: readonly TaskSummary[],
  filter: string,
): TaskSummary[] {
  const needle = filter.trim().toLowerCase();
  if (!needle) return [...tasks];
  return tasks.filter((task) => task.name.toLowerCase().includes(needle));
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
