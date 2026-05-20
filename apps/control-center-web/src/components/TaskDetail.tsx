import type { TaskDetail as TaskDetailModel } from '../types';
import { StatusBadge } from './StatusBadge';

export function TaskDetail({ detail }: { detail?: TaskDetailModel }) {
  if (!detail) {
    return (
      <section className="panel p-4">
        <h2 className="panel-title">Selected task</h2>
        <p className="mt-3 text-sm text-slate-500">
          Select a task to inspect schedule, runs, sessions, and reports.
        </p>
      </section>
    );
  }

  return (
    <section className="panel p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="panel-title">Selected task</h2>
          <p className="mt-2 text-2xl font-semibold text-white">
            {detail.name}
          </p>
          <p className="mt-1 text-sm text-slate-400">
            {detail.definition?.description ?? 'No description'}
          </p>
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          {detail.badges.map((badge) => (
            <StatusBadge
              key={badge}
              tone={badge === 'enabled' ? 'enabled' : 'neutral'}
            >
              {badge}
            </StatusBadge>
          ))}
        </div>
      </div>
      <dl className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <Field label="Schedule" value={detail.definition?.schedule ?? 'n/a'} />
        <Field label="Next run" value={formatDate(detail.nextRunAt)} />
        <Field label="Working dir" value={detail.definition?.cwd ?? 'n/a'} />
        <Field
          label="Latest run"
          value={detail.latestRun ? detail.latestRun.status : 'none'}
        />
        <Field
          label="Session"
          value={detail.latestRun?.sessionId ?? 'no session id'}
        />
        <Field label="Report" value={detail.report?.path ?? 'no report file'} />
      </dl>
      {detail.warnings.length > 0 ? (
        <div className="mt-4 space-y-2">
          {detail.warnings.slice(0, 3).map((warning) => (
            <p
              key={warning}
              className="rounded-xl border border-amber-300/20 bg-amber-400/10 px-3 py-2 text-sm text-amber-100"
            >
              {warning}
            </p>
          ))}
        </div>
      ) : null}
    </section>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-xl border border-white/10 bg-black/20 p-3">
      <dt className="text-xs uppercase tracking-[0.18em] text-slate-500">
        {label}
      </dt>
      <dd className="mt-1 truncate text-sm text-slate-100" title={value}>
        {value}
      </dd>
    </div>
  );
}

function formatDate(value?: string): string {
  if (!value) return 'unknown';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}
