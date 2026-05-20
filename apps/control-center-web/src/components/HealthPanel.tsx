import type { SchedulerHealth } from '../types';
import { StatusBadge } from './StatusBadge';

export function HealthPanel({ health }: { health?: SchedulerHealth }) {
  if (!health) {
    return (
      <section className="panel p-4">
        <h2 className="panel-title">Scheduler health</h2>
        <p className="mt-3 text-sm text-slate-500">Waiting for health data…</p>
      </section>
    );
  }

  return (
    <section className="panel p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="panel-title">Scheduler health</h2>
          <p className="mt-2 text-lg font-medium text-white">
            {health.summary}
          </p>
        </div>
        <StatusBadge
          tone={health.status === 'ok' ? 'completed' : health.status}
        >
          {health.status}
        </StatusBadge>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-4">
        <Metric
          label="Enabled tasks"
          value={`${health.tasks.enabled}/${health.tasks.total}`}
        />
        <Metric label="Invalid files" value={String(health.tasks.invalid)} />
        <Metric
          label="Recent failures"
          value={String(health.recentFailureCount)}
        />
        <Metric
          label="Database"
          value={
            health.database.exists
              ? formatBytes(health.database.sizeBytes)
              : 'missing'
          }
        />
      </div>
      {health.diagnostics.length > 0 ? (
        <div className="mt-4 space-y-2">
          {health.diagnostics.slice(0, 3).map((diagnostic) => (
            <div
              key={`${diagnostic.level}-${diagnostic.message}`}
              className="rounded-xl border border-amber-300/20 bg-amber-400/10 px-3 py-2 text-sm text-amber-100"
            >
              {diagnostic.message}
            </div>
          ))}
        </div>
      ) : null}
    </section>
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

function formatBytes(value?: number): string {
  if (value === undefined) return 'present';
  if (value < 1024) return `${value} B`;
  return `${Math.round(value / 1024)} KB`;
}
