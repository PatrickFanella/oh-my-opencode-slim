export function Header({
  generatedAt,
  isLoading,
  message,
  onRefresh,
}: {
  generatedAt?: string;
  isLoading: boolean;
  message?: string;
  onRefresh(): void;
}) {
  return (
    <header className="flex flex-col gap-4 border-b border-white/10 px-5 py-5 md:flex-row md:items-center md:justify-between">
      <div>
        <p className="panel-title">oh-my-opencode-slim</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white md:text-3xl">
          Scheduled Task Control Center
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          Read-only browser dashboard for scheduled tasks, runs, scheduler
          health, and reports.
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-3 text-sm text-slate-400">
        {message ? <span className="text-sky-200">{message}</span> : null}
        <span>
          {generatedAt ? `Updated ${formatTime(generatedAt)}` : 'Loading'}
        </span>
        <button className="control-button" type="button" onClick={onRefresh}>
          {isLoading ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>
    </header>
  );
}

function formatTime(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleTimeString();
}
