import { useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { HealthPanel } from './components/HealthPanel';
import { StreamTabs } from './components/StreamTabs';
import { TaskDetail } from './components/TaskDetail';
import { TaskList } from './components/TaskList';
import { useControlCenter } from './hooks/use-control-center';

export function App() {
  const filterRef = useRef<HTMLInputElement>(null);
  const state = useControlCenter();
  const selectedTask = state.snapshot?.selectedTask;
  const schedulerEvents = state.snapshot?.schedulerEvents ?? [];

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isTyping =
        target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA';

      if (event.key === '/' && !isTyping) {
        event.preventDefault();
        filterRef.current?.focus();
      } else if (
        (event.key === 'j' || event.key === 'ArrowDown') &&
        !isTyping
      ) {
        event.preventDefault();
        state.selectDelta(1);
      } else if ((event.key === 'k' || event.key === 'ArrowUp') && !isTyping) {
        event.preventDefault();
        state.selectDelta(-1);
      } else if (event.key === 'Tab' && !isTyping) {
        event.preventDefault();
        state.cycleStreamTab();
      } else if (event.key === 'r' && !isTyping) {
        void state.refresh('refreshed');
      } else if (event.key === 'f' && !isTyping) {
        state.toggleFollow();
      } else if (event.key === 'o' && !isTyping) {
        void copySessionCommand(
          selectedTask?.latestRun?.sessionId,
          state.refresh,
        );
      } else if (event.key === 'q') {
        state.clearMessage();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [selectedTask?.latestRun?.sessionId, state]);

  const handleCopySession = () => {
    void copySessionCommand(selectedTask?.latestRun?.sessionId, state.refresh);
  };

  return (
    <main className="min-h-screen text-slate-100">
      <Header
        generatedAt={state.generatedAt}
        isLoading={state.isLoading}
        message={state.message}
        onRefresh={() => void state.refresh('refreshed')}
      />
      {state.error ? (
        <div className="mx-5 mt-5 rounded-2xl border border-rose-400/30 bg-rose-400/10 p-4 text-rose-100">
          {state.error}
        </div>
      ) : null}
      <section className="grid gap-5 p-5 xl:grid-cols-[22rem_minmax(0,1fr)]">
        <TaskList
          filter={state.filter}
          inputRef={filterRef}
          selectedTaskName={state.selectedTaskName}
          tasks={state.visibleTasks}
          onFilterChange={state.setFilter}
          onSelectTask={state.selectTask}
        />
        <div className="grid min-w-0 gap-5">
          <HealthPanel health={state.snapshot?.health} />
          <TaskDetail detail={selectedTask} />
          <StreamTabs
            detail={selectedTask}
            follow={state.follow}
            liveEvents={state.liveEvents}
            schedulerEvents={schedulerEvents}
            tab={state.streamTab}
            onCopySession={handleCopySession}
            onSelectTab={state.setStreamTab}
            onToggleFollow={state.toggleFollow}
          />
        </div>
      </section>
      <KeyboardHint />
    </main>
  );
}

function KeyboardHint() {
  return (
    <footer className="px-5 pb-6 text-xs text-slate-500">
      <span className="kbd">j/k</span> move · <span className="kbd">Tab</span>{' '}
      stream · <span className="kbd">/</span> filter ·{' '}
      <span className="kbd">r</span> refresh · <span className="kbd">f</span>{' '}
      follow · <span className="kbd">o</span> session command
    </footer>
  );
}

async function copySessionCommand(
  sessionId: string | undefined,
  refresh: (message?: string) => Promise<void>,
) {
  if (!sessionId) {
    await refresh('no session id');
    return;
  }
  const command = `opencode -s ${sessionId}`;
  try {
    await navigator.clipboard?.writeText(command);
    await refresh(`copied ${command}`);
  } catch {
    await refresh(command);
  }
}
