import type { RefObject } from 'react';
import type { TaskSummary } from '../types';
import { StatusBadge } from './StatusBadge';

export function TaskList({
  filter,
  inputRef,
  onFilterChange,
  onSelectTask,
  selectedTaskName,
  tasks,
}: {
  filter: string;
  inputRef: RefObject<HTMLInputElement | null>;
  onFilterChange(value: string): void;
  onSelectTask(taskName: string): void;
  selectedTaskName?: string;
  tasks: TaskSummary[];
}) {
  return (
    <aside className="panel flex min-h-[26rem] flex-col overflow-hidden">
      <div className="border-b border-white/10 p-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="panel-title">Tasks</h2>
          <span className="text-xs text-slate-500">{tasks.length} visible</span>
        </div>
        <label className="mt-3 block">
          <span className="sr-only">Filter tasks</span>
          <input
            ref={inputRef}
            className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-sky-300/60"
            placeholder="Filter tasks…"
            value={filter}
            onChange={(event) => onFilterChange(event.currentTarget.value)}
          />
        </label>
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        {tasks.length === 0 ? (
          <p className="p-3 text-sm text-slate-500">No tasks found.</p>
        ) : (
          tasks.map((task) => (
            <button
              key={task.name}
              className={`mb-2 w-full rounded-xl border p-3 text-left transition ${
                task.name === selectedTaskName
                  ? 'border-sky-300/60 bg-sky-400/10'
                  : 'border-transparent bg-white/[0.025] hover:border-white/10 hover:bg-white/[0.055]'
              }`}
              type="button"
              onClick={() => onSelectTask(task.name)}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-medium text-slate-100">
                    <span className="mr-2 text-slate-500">
                      {task.definition?.enabled
                        ? '✓'
                        : task.definition
                          ? '·'
                          : '○'}
                    </span>
                    {task.name}
                  </p>
                  <p className="mt-1 truncate text-xs text-slate-500">
                    {task.definition?.schedule ?? 'run history only'}
                  </p>
                </div>
                {task.latestRun ? (
                  <StatusBadge tone={task.latestRun.status}>
                    {task.latestRun.status}
                  </StatusBadge>
                ) : (
                  <StatusBadge>none</StatusBadge>
                )}
              </div>
              {task.warnings.length > 0 ? (
                <p className="mt-2 truncate text-xs text-amber-200/80">
                  {task.warnings[0]}
                </p>
              ) : null}
            </button>
          ))
        )}
      </div>
    </aside>
  );
}
