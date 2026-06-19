import {
  type CliRenderer,
  createCliRenderer,
  TextRenderable,
} from '@opentui/core';
import type { ControlCenterDashboard } from './dashboard';
import {
  type ControlCenterServices,
  createControlCenterServices,
} from './services';
import {
  type ControlCenterViewState,
  createDefaultViewState,
  getNextStreamTab,
  getVisibleTasks,
  renderControlCenterText,
} from './tui-render';
import type { ControlCenterSnapshot } from './types';

type ControlCenterScreen = { content: string };

export interface ControlCenterTuiOptions {
  configDir?: string;
  refreshIntervalMs?: number;
  renderer?: CliRenderer;
  createScreen?: (
    renderer: CliRenderer,
    content: string,
  ) => ControlCenterScreen;
  dashboard?: ControlCenterDashboard;
  services?: ControlCenterServices;
}

export async function runControlCenterTui(
  options: ControlCenterTuiOptions = {},
): Promise<void> {
  const renderer =
    options.renderer ??
    (await createCliRenderer({
      exitOnCtrlC: true,
      targetFps: 12,
      openConsoleOnError: false,
    }));
  const services = options.dashboard
    ? undefined
    : (options.services ??
      createControlCenterServices({ configDir: options.configDir }));
  const dashboard = options.dashboard ?? services?.dashboard;
  if (!dashboard) throw new Error('Control center dashboard unavailable');
  const state = createDefaultViewState();
  let snapshot = await dashboard.snapshot();
  const screen = options.createScreen
    ? options.createScreen(renderer, render(renderer, snapshot, state))
    : new TextRenderable(renderer, {
        content: render(renderer, snapshot, state),
        height: '100%',
        width: '100%',
      });
  renderer.root.add(screen);

  const refresh = async (message?: string) => {
    const visible = getVisibleTasks(snapshot.tasks, state.filter);
    const selected = visible[Math.min(state.selectedIndex, visible.length - 1)];
    snapshot = await dashboard.snapshot(selected?.name);
    state.selectedIndex = clampIndex(
      state.selectedIndex,
      getVisibleTasks(snapshot.tasks, state.filter).length,
    );
    state.message = message;
    screen.content = render(renderer, snapshot, state);
    renderer.requestRender();
  };

  const timer = setInterval(() => {
    if (state.follow) void refresh();
  }, options.refreshIntervalMs ?? 5000);

  renderer.keyInput.on('keypress', (key) => {
    if (state.filterMode) {
      handleFilterKey(state, key.name, key.sequence);
      void refresh();
      return;
    }

    if (key.name === 'q' || (key.ctrl && key.name === 'c')) {
      renderer.destroy();
      return;
    }
    if (key.name === 'j' || key.name === 'down') {
      state.selectedIndex = clampIndex(
        state.selectedIndex + 1,
        getVisibleTasks(snapshot.tasks, state.filter).length,
      );
      void refresh();
    } else if (key.name === 'k' || key.name === 'up') {
      state.selectedIndex = clampIndex(
        state.selectedIndex - 1,
        getVisibleTasks(snapshot.tasks, state.filter).length,
      );
      void refresh();
    } else if (key.name === 'tab') {
      state.streamTab = getNextStreamTab(state.streamTab);
      void refresh();
    } else if (key.name === '/') {
      state.filterMode = true;
      void refresh('typing filter');
    } else if (key.name === 'r') {
      void refresh('refreshed');
    } else if (key.name === 'f') {
      state.follow = !state.follow;
      void refresh(state.follow ? 'follow on' : 'follow paused');
    } else if (key.name === 'o') {
      const sessionId = snapshot.selectedTask?.latestRun?.sessionId;
      void refresh(sessionId ? `opencode -s ${sessionId}` : 'no session id');
    }
  });

  await new Promise<void>((resolve) => {
    renderer.on('destroy', () => {
      clearInterval(timer);
      resolve();
    });
  });
}

function render(
  renderer: CliRenderer,
  snapshot: ControlCenterSnapshot,
  state: ControlCenterViewState,
): string {
  return renderControlCenterText(
    snapshot,
    state,
    renderer.width,
    renderer.height,
  );
}

function clampIndex(index: number, length: number): number {
  if (length <= 0) return 0;
  return Math.max(0, Math.min(index, length - 1));
}

function handleFilterKey(
  state: ControlCenterViewState,
  name: string,
  sequence: string,
): void {
  if (name === 'escape' || name === 'return' || name === 'enter') {
    state.filterMode = false;
    state.message = undefined;
    return;
  }
  if (name === 'backspace') {
    state.filter = state.filter.slice(0, -1);
    return;
  }
  if (sequence.length === 1 && /^[\w ._-]$/.test(sequence)) {
    state.filter += sequence;
  }
}
