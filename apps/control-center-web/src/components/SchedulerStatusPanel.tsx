import type {
  SchedulerHostSummary,
  SchedulerStatusSnapshot,
  SchedulerTaskStatusSummary,
} from '../types';
import { StatusBadge } from './StatusBadge';

export function SchedulerStatusPanel({
  error,
  isLoading,
  snapshot,
}: {
  error?: string;
  isLoading: boolean;
  snapshot?: SchedulerStatusSnapshot;
}) {
  return (
    <section className="panel p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="panel-title">Scheduler status</h2>
          <p className="mt-2 text-sm text-slate-400">
            Read-only host snapshot for OpenCode scheduler health.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
          {isLoading ? <span>Refreshing…</span> : null}
          {snapshot ? (
            <span>{formatTimestamp(snapshot.generatedAt)}</span>
          ) : null}
        </div>
      </div>

      {error ? (
        <div className="mt-4 rounded-xl border border-rose-400/20 bg-rose-400/10 px-3 py-2 text-sm text-rose-100">
          {error}
        </div>
      ) : null}

      {!snapshot ? (
        <p className="mt-4 text-sm text-slate-500">
          Waiting for scheduler snapshot…
        </p>
      ) : (
        <div className="mt-4 space-y-4">
          {snapshot.hosts.map((host) => (
            <HostCard key={host.host} host={host} />
          ))}
        </div>
      )}
    </section>
  );
}

function HostCard({ host }: { host: SchedulerHostSummary }) {
  return (
    <article className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-lg font-semibold text-white">{host.host}</p>
          <p className="mt-1 text-sm text-slate-400">
            {host.scheduler.summary}
          </p>
        </div>
        <StatusBadge tone={host.status}>{host.status}</StatusBadge>
      </div>

      <dl className="mt-4 grid gap-3 md:grid-cols-5">
        <Metric label="Enabled" value={String(host.counts.enabledTasks)} />
        <Metric label="Disabled" value={String(host.counts.disabledTasks)} />
        <Metric label="Failed" value={String(host.counts.failedRecentRuns)} />
        <Metric label="Stuck" value={String(host.counts.stuckRuns)} />
        <Metric label="Invalid" value={String(host.counts.invalidTasks)} />
      </dl>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <InfoField
          label="Timer"
          value={host.scheduler.timerActive ? 'active' : 'inactive'}
          detail={host.scheduler.timerEnabled ? 'enabled' : 'disabled'}
        />
        <InfoField
          label="Service"
          value={host.scheduler.serviceActive ? 'active' : 'inactive'}
          detail={host.scheduler.serviceResult ?? 'no result'}
        />
        <InfoField
          label="Database"
          value={host.scheduler.databaseExists ? 'present' : 'missing'}
          detail={host.scheduler.databasePath}
        />
      </div>

      {host.tasks.length > 0 ? (
        <div className="mt-4 space-y-2">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
            Tasks
          </p>
          {host.tasks.slice(0, 5).map((task) => (
            <TaskRow key={`${host.host}-${task.name}`} task={task} />
          ))}
        </div>
      ) : null}

      {host.notices.length > 0 ? (
        <div className="mt-4 space-y-2">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
            Notices
          </p>
          {host.notices.slice(0, 3).map((notice) => (
            <p
              key={notice}
              className="rounded-xl border border-amber-300/20 bg-amber-400/10 px-3 py-2 text-sm text-amber-100"
            >
              {notice}
            </p>
          ))}
        </div>
      ) : null}

      <p className="mt-4 text-xs text-slate-500">
        Checked {formatTimestamp(host.scheduler.checkedAt)}
      </p>
    </article>
  );
}

function TaskRow({ task }: { task: SchedulerTaskStatusSummary }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-medium text-slate-100">{task.name}</p>
          <p className="mt-1 text-xs text-slate-500">
            {task.schedule} · {task.message}
          </p>
        </div>
        <StatusBadge tone={taskTone(task.risk)}>{task.lastStatus}</StatusBadge>
      </div>
      <p className="mt-2 text-xs text-slate-500">
        Next run {formatTimestamp(task.nextRunAt)}
      </p>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/20 p-3">
      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-lg font-semibold text-slate-100">{value}</p>
    </div>
  );
}

function InfoField({
  detail,
  label,
  value,
}: {
  detail: string;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/20 p-3">
      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-sm font-medium text-slate-100">{value}</p>
      <p className="mt-1 truncate text-xs text-slate-500" title={detail}>
        {detail}
      </p>
    </div>
  );
}

function taskTone(
  risk: SchedulerTaskStatusSummary['risk'],
): 'error' | 'warning' | 'info' {
  if (risk === 'alert') return 'error';
  if (risk === 'watch') return 'warning';
  return 'info';
}

function formatTimestamp(value?: string): string {
  if (!value) return 'unknown';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}
