import type { ObserveEventRow, ObserveLoopRow, ObservePruneCounts } from './db';

export function formatLoop(row: ObserveLoopRow): string {
  return `${row.id}: ${row.target} | ${row.last_result} | cycle ${row.cycle_count}/${row.max_cycles} | next ${row.next_check_at || 'none'}${row.pending ? ' | pending' : ''}`;
}

export function formatStartResult(loop: ObserveLoopRow): string {
  return `Loop ${loop.id} active for ${loop.target}. Interval ${loop.interval_secs}s. Next ${loop.next_check_at || 'none'}.`;
}

export function formatStopResult(stopped: number): string {
  return stopped > 0
    ? `Stopped ${stopped} loop(s).`
    : 'No matching active loops.';
}

export function formatStatus(
  loop: ObserveLoopRow,
  events: ObserveEventRow[],
): string {
  return [
    formatLoop(loop),
    events.length > 0
      ? `Recent: ${events
          .map(
            (event) =>
              `${event.at}: ${event.type}${event.result ? ` ${event.result}` : ''}${event.summary ? ` ${event.summary}` : ''}`,
          )
          .join(' | ')}`
      : null,
  ]
    .filter(Boolean)
    .join('\n');
}

export function formatLoopList(
  loops: ObserveLoopRow[],
  empty = 'No matching observe loops.',
): string {
  return loops.length > 0 ? loops.map(formatLoop).join('\n') : empty;
}

export function formatSessionStatus(loops: ObserveLoopRow[]): string {
  return loops.length > 0
    ? loops.map(formatLoop).join('\n')
    : 'Observation idle.';
}

export function formatHistory(events: ObserveEventRow[]): string {
  if (events.length === 0) {
    return 'No observe history found.';
  }

  return events
    .map(
      (event) =>
        `${event.at}: loop=${event.loop_id} ${event.type}${event.result ? ` ${event.result}` : ''}${event.summary ? ` ${event.summary}` : ''}`,
    )
    .join('\n');
}

export function formatPrune(result: ObservePruneCounts): string {
  return `Removed loops=${result.loopsRemoved} events=${result.eventsRemoved}. Remaining loops=${result.remainingLoops} events=${result.remainingEvents}.`;
}

export function renderObservationStateBlock(
  dbPath: string,
  loops: ObserveLoopRow[],
): string {
  return [
    '<observation-state>',
    `db_path=${dbPath}`,
    `active_loops=${loops.length}`,
    ...loops
      .slice(0, 5)
      .map(
        (loop) =>
          `loop=${loop.id} target=${loop.target} cycle=${loop.cycle_count}/${loop.max_cycles} result=${loop.last_result} pending=${Boolean(loop.pending)} next=${loop.next_check_at || 'none'}`,
      ),
    '</observation-state>',
  ].join('\n');
}

export function renderObservationResumeNote(loops: ObserveLoopRow[]): string {
  return [
    '<observation-resume>',
    `Active loops: ${loops.length}.`,
    ...loops
      .slice(0, 5)
      .map(
        (loop) =>
          `Loop ${loop.id}: target=${loop.target}; cycle=${loop.cycle_count}/${loop.max_cycles}; result=${loop.last_result}; next=${loop.next_check_at || 'none'}.`,
      ),
    '</observation-resume>',
  ]
    .filter(Boolean)
    .join(' ');
}
