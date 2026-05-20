import type { StreamTab } from '../hooks/use-control-center';
import type { StreamEvent, TaskDetail, TaskRun } from '../types';

const TABS: StreamTab[] = ['scheduler', 'session', 'runs', 'report'];

export function StreamTabs({
  detail,
  follow,
  liveEvents,
  onCopySession,
  onSelectTab,
  onToggleFollow,
  schedulerEvents,
  tab,
}: {
  detail?: TaskDetail;
  follow: boolean;
  liveEvents: StreamEvent[];
  onCopySession(): void;
  onSelectTab(tab: StreamTab): void;
  onToggleFollow(): void;
  schedulerEvents: StreamEvent[];
  tab: StreamTab;
}) {
  const events = liveEvents.length > 0 ? liveEvents : schedulerEvents;
  return (
    <section className="panel flex min-h-[24rem] flex-col overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 p-4">
        <div className="flex flex-wrap gap-2">
          {TABS.map((entry) => (
            <button
              key={entry}
              className={`rounded-lg px-3 py-1.5 text-sm transition ${
                tab === entry
                  ? 'bg-sky-400/20 text-sky-100'
                  : 'bg-white/[0.05] text-slate-400 hover:text-slate-100'
              }`}
              type="button"
              onClick={() => onSelectTab(entry)}
            >
              {entry}
            </button>
          ))}
        </div>
        <button
          className="control-button"
          type="button"
          onClick={onToggleFollow}
        >
          {follow ? 'Follow on' : 'Follow paused'}
        </button>
      </div>
      <div className="flex-1 overflow-auto p-4 font-mono text-sm">
        {tab === 'scheduler' ? <SchedulerEvents events={events} /> : null}
        {tab === 'session' ? (
          <SessionCommand detail={detail} onCopySession={onCopySession} />
        ) : null}
        {tab === 'runs' ? <RunTable runs={detail?.runs ?? []} /> : null}
        {tab === 'report' ? <ReportViewer detail={detail} /> : null}
      </div>
    </section>
  );
}

function SchedulerEvents({ events }: { events: StreamEvent[] }) {
  if (events.length === 0) {
    return <p className="text-slate-500">No scheduler log events available.</p>;
  }
  return (
    <div className="space-y-2">
      {events.slice(-40).map((event, index) => (
        <p
          key={`${event.text}-${index}`}
          className={
            event.severity === 'warning' ? 'text-amber-200' : 'text-slate-300'
          }
        >
          <span className="mr-2 text-slate-600">
            {event.timestamp ?? 'log'}
          </span>
          {event.text}
        </p>
      ))}
    </div>
  );
}

function SessionCommand({
  detail,
  onCopySession,
}: {
  detail?: TaskDetail;
  onCopySession(): void;
}) {
  const sessionId = detail?.latestRun?.sessionId;
  if (!sessionId)
    return <p className="text-slate-500">No session id for latest run.</p>;
  return (
    <div className="space-y-4">
      <p className="text-slate-400">Open the latest task session:</p>
      <code className="block rounded-xl border border-white/10 bg-black/40 p-4 text-sky-100">
        opencode -s {sessionId}
      </code>
      <button className="control-button" type="button" onClick={onCopySession}>
        Copy session command
      </button>
    </div>
  );
}

function RunTable({ runs }: { runs: TaskRun[] }) {
  if (runs.length === 0)
    return <p className="text-slate-500">No runs recorded.</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[42rem] text-left text-sm">
        <thead className="text-xs uppercase tracking-[0.18em] text-slate-500">
          <tr>
            <th className="pb-3">Status</th>
            <th className="pb-3">Started</th>
            <th className="pb-3">Session</th>
            <th className="pb-3">Error</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/10 text-slate-300">
          {runs.map((run) => (
            <tr key={run.id}>
              <td className="py-3">{run.status}</td>
              <td className="py-3">{run.startedAt ?? 'unknown'}</td>
              <td className="py-3">{run.sessionId ?? 'none'}</td>
              <td className="py-3 text-rose-200">{run.error ?? ''}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ReportViewer({ detail }: { detail?: TaskDetail }) {
  if (!detail?.report)
    return <p className="text-slate-500">No report file found.</p>;
  return (
    <pre className="whitespace-pre-wrap rounded-xl border border-white/10 bg-black/30 p-4 text-slate-300">
      {detail.report.content
        .split(/\r?\n/)
        .filter(Boolean)
        .slice(-80)
        .join('\n')}
    </pre>
  );
}
