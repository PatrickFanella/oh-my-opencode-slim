import type {
  ControlCenterSnapshot,
  HealthService,
  SchedulerHealth,
  StreamEvent,
  StreamService,
  TaskDetail,
  TaskRun,
  TaskService,
  TaskSummary,
} from './types';

export interface ControlCenterDashboardServices {
  tasks: TaskService;
  streams: StreamService;
  health: HealthService;
}

export interface ControlCenterDashboardOptions {
  now?: () => Date;
}

export interface ControlCenterDashboard {
  snapshot(selectedTaskName?: string): Promise<ControlCenterSnapshot>;
  listTasks(): Promise<TaskSummary[]>;
  getTask(taskName: string): Promise<TaskDetail>;
  listRuns(taskName: string, limit?: number): Promise<TaskRun[]>;
  getSchedulerHealth(): Promise<SchedulerHealth>;
  listSchedulerEvents(limit?: number): Promise<StreamEvent[]>;
}

export function createControlCenterDashboard(
  services: ControlCenterDashboardServices,
  options: ControlCenterDashboardOptions = {},
): ControlCenterDashboard {
  const now = options.now ?? (() => new Date());
  return {
    snapshot(selectedTaskName?: string) {
      return buildSnapshot(services, now, selectedTaskName);
    },
    listTasks() {
      return services.tasks.listTasks();
    },
    getTask(taskName: string) {
      return services.tasks.getTask(taskName);
    },
    listRuns(taskName: string, limit?: number) {
      return services.tasks.listRuns(taskName, limit);
    },
    getSchedulerHealth() {
      return services.health.getSchedulerHealth();
    },
    listSchedulerEvents(limit?: number) {
      return services.streams.listRecentSchedulerEvents(limit);
    },
  };
}

async function buildSnapshot(
  services: ControlCenterDashboardServices,
  now: () => Date,
  selectedTaskName?: string,
): Promise<ControlCenterSnapshot> {
  const [tasks, health, schedulerEvents] = await Promise.all([
    services.tasks.listTasks(),
    services.health.getSchedulerHealth(),
    services.streams.listRecentSchedulerEvents(50),
  ]);
  const selectedName = selectedTaskName ?? tasks[0]?.name;
  return {
    tasks,
    selectedTask: selectedName
      ? await services.tasks.getTask(selectedName)
      : undefined,
    health,
    schedulerEvents,
    generatedAt: now().toISOString(),
  };
}
