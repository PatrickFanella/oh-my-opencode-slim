import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { App } from './App';
import { fixtureSnapshot } from './test/fixtures';

class FakeEventSource {
  onerror: (() => void) | null = null;

  constructor(readonly url: string) {}

  addEventListener(_type: string, _listener: EventListener): void {}

  close(): void {}
}

describe('App', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response(JSON.stringify(fixtureSnapshot), {
            headers: { 'content-type': 'application/json' },
          }),
      ),
    );
    vi.stubGlobal('EventSource', FakeEventSource);
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  test('renders scheduler health, tasks, and selected task detail', async () => {
    render(<App />);

    expect(await screen.findByText('scheduler ok')).toBeInTheDocument();
    expect(screen.getAllByText('observe')[0]).toBeInTheDocument();
    expect(screen.getByText('daily-maintenance')).toBeInTheDocument();
    expect(screen.getByText('Observe the system')).toBeInTheDocument();
  });

  test('filters task list', async () => {
    const user = userEvent.setup();
    render(<App />);

    const input = await screen.findByPlaceholderText('Filter tasks…');
    await user.type(input, 'daily');

    expect(screen.getByText('daily-maintenance')).toBeInTheDocument();
  });

  test('switches to session tab and copies the session command', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(await screen.findByRole('button', { name: 'session' }));
    await user.click(
      screen.getByRole('button', { name: 'Copy session command' }),
    );

    await waitFor(() => {
      expect(screen.getByText('copied opencode -s sess-1')).toBeInTheDocument();
    });
  });

  test('supports keyboard shortcuts for tab cycling and filter focus', async () => {
    const user = userEvent.setup();
    render(<App />);

    await screen.findByText('scheduler ok');
    await user.keyboard('{Tab}');
    expect(screen.getByText('opencode -s sess-1')).toBeInTheDocument();

    await user.keyboard('/');
    expect(screen.getByPlaceholderText('Filter tasks…')).toHaveFocus();
  });
});
