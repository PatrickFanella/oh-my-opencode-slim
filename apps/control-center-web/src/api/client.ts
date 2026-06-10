import type {
  ControlCenterSnapshot,
  SchedulerHealth,
  SchedulerStatusSnapshot,
  StreamEvent,
  TaskDetail,
  TaskRun,
  TaskSummary,
} from '../types';

const API_BASE = import.meta.env.VITE_CONTROL_CENTER_API_BASE ?? '';

export async function fetchSnapshot(
  selectedTaskName?: string,
): Promise<ControlCenterSnapshot> {
  const params = new URLSearchParams();
  if (selectedTaskName) params.set('selectedTask', selectedTaskName);
  return fetchJson<ControlCenterSnapshot>(`/api/snapshot?${params}`);
}

export async function fetchTasks(): Promise<TaskSummary[]> {
  return fetchJson<TaskSummary[]>('/api/tasks');
}

export async function fetchTask(taskName: string): Promise<TaskDetail> {
  return fetchJson<TaskDetail>(`/api/tasks/${encodeURIComponent(taskName)}`);
}

export async function fetchTaskRuns(
  taskName: string,
  limit = 25,
): Promise<TaskRun[]> {
  return fetchJson<TaskRun[]>(
    `/api/tasks/${encodeURIComponent(taskName)}/runs?limit=${limit}`,
  );
}

export async function fetchSchedulerHealth(): Promise<SchedulerHealth> {
  return fetchJson<SchedulerHealth>('/api/health/scheduler');
}

export async function fetchSchedulerStatus(): Promise<SchedulerStatusSnapshot> {
  return fetchJson<SchedulerStatusSnapshot>('/api/scheduler-status');
}

export function createSchedulerEventSource(): EventSource {
  return new EventSource(toApiUrl('/api/events/scheduler'));
}

async function fetchJson<T>(path: string): Promise<T> {
  const response = await fetch(toApiUrl(path), {
    headers: { accept: 'application/json' },
  });
  if (!response.ok) {
    throw new Error(
      `Request failed: ${response.status} ${response.statusText}`,
    );
  }
  return (await response.json()) as T;
}

function toApiUrl(path: string): string {
  if (!API_BASE) return path;
  return new URL(path, API_BASE).toString();
}

export function parseSchedulerEvent(event: MessageEvent<string>): StreamEvent {
  return JSON.parse(event.data) as StreamEvent;
}
