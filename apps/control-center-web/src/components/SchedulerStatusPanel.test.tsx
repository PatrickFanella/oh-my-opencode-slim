import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, test } from 'vitest';
import { fixtureSchedulerStatus } from '../test/fixtures';
import { SchedulerStatusPanel } from './SchedulerStatusPanel';

describe('SchedulerStatusPanel', () => {
  afterEach(() => {
    cleanup();
  });

  test('renders host summaries and notices', () => {
    render(
      <SchedulerStatusPanel
        error={undefined}
        isLoading={false}
        snapshot={fixtureSchedulerStatus}
      />,
    );

    expect(screen.getByText('Scheduler status')).toBeInTheDocument();
    expect(screen.getByText('nuc')).toBeInTheDocument();
    expect(screen.getByText('daily-maintenance')).toBeInTheDocument();
    expect(screen.getByText('Notices')).toBeInTheDocument();
  });

  test('renders a loading state when no snapshot is available', () => {
    render(
      <SchedulerStatusPanel error={undefined} isLoading snapshot={undefined} />,
    );

    expect(
      screen.getByText('Waiting for scheduler snapshot…'),
    ).toBeInTheDocument();
  });
});
