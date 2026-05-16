import { Database, type SQLQueryBindings } from 'bun:sqlite';
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join, resolve } from 'node:path';

const DEFAULT_INTERVAL = 30;
const DEFAULT_MAX_CYCLES = 10;
const LOCK_TTL_MS = 5 * 60 * 1000;
const LOOP_RETENTION_DAYS = 30;
const EVENT_RETENTION_DAYS = 45;

export type ObserveLoopRow = {
  id: string;
  session_id: string | null;
  target: string;
  interval_secs: number;
  max_cycles: number;
  success_criteria: string;
  active: number;
  cycle_count: number;
  pending: number;
  last_result: string;
  last_summary: string;
  last_trigger: string;
  started_at: string;
  last_checked_at: string | null;
  next_check_at: string | null;
  completed_at: string | null;
  lock_expires_at: number | null;
  created_at: string;
  updated_at: string;
};

export type ObserveEventRow = {
  id: number;
  loop_id: string;
  at: string;
  type: string;
  session_id: string | null;
  result: string | null;
  summary: string | null;
  details: string | null;
};

export type ObserveCounts = {
  activeCount: number;
  inactiveCount: number;
  pendingCount: number;
  nextCheckAt: string | null;
  eventCount: number;
};

export type ObservePruneCounts = {
  loopsRemoved: number;
  eventsRemoved: number;
  remainingLoops: number;
  remainingEvents: number;
};

export type ObserveDbOptions = {
  directory: string;
  baseConfigDir?: string;
  dbPath?: string;
  legacyStatePath?: string;
  legacyHistoryPath?: string;
};

export type ObserveDbContext = {
  db: Database;
  dbPath: string;
  close: () => void;
};

export type CreateLoopInput = {
  id?: string;
  sessionID: string;
  target: string;
  intervalSecs: number;
  maxCycles: number;
  successCriteria: string;
};

export type ListLoopOptions = {
  status?: 'active' | 'inactive' | 'all';
  sessionOnly?: boolean;
  sessionID?: string;
  limit?: number;
};

export type ListEventOptions = {
  loopID?: string;
  sessionID?: string;
  limit?: number;
};

export type InsertEventInput = {
  loopID: string;
  at?: string;
  type: string;
  sessionID?: string | null;
  result?: string | null;
  summary?: string | null;
  details?: unknown;
};

type LegacyState = {
  active?: boolean;
  pending?: boolean;
  target?: string;
  interval?: number;
  maxCycles?: number;
  criteria?: string;
  cycle?: number;
  sessionID?: string;
  startedAt?: string;
  nextCheckAt?: string;
  lastCheckedAt?: string;
  lastResult?: string;
  lastSummary?: string;
  lastTrigger?: string;
};

export function nowIso(): string {
  return new Date().toISOString();
}

export function futureIso(seconds: number): string {
  return new Date(Date.now() + seconds * 1000).toISOString();
}

export function makeLoopID(): string {
  return `obs-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function hashString(value: string): string {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16);
}

export function projectKey(directory: string): string {
  return hashString(resolve(directory));
}

export function resolveObserveDbPath({
  directory,
  baseConfigDir,
  dbPath,
}: ObserveDbOptions): string {
  if (dbPath) {
    return dbPath;
  }
  const configDir = baseConfigDir ?? join(homedir(), '.config', 'opencode');
  return join(configDir, 'observe', `${projectKey(directory)}.db`);
}

function legacyStatePath(options: ObserveDbOptions): string {
  if (options.legacyStatePath) {
    return options.legacyStatePath;
  }
  const configDir =
    options.baseConfigDir ?? join(homedir(), '.config', 'opencode');
  return join(configDir, 'observe-state.json');
}

function legacyHistoryPath(options: ObserveDbOptions): string {
  if (options.legacyHistoryPath) {
    return options.legacyHistoryPath;
  }
  const configDir =
    options.baseConfigDir ?? join(homedir(), '.config', 'opencode');
  return join(configDir, 'observe-history.jsonl');
}

function getSetting(db: Database, key: string): string | null {
  const row = db
    .query<{ value: string }, [string]>(
      'select value from settings where key = ?',
    )
    .get(key);
  return row?.value ?? null;
}

function setSetting(db: Database, key: string, value: string): void {
  db.query(
    'insert into settings(key, value) values (?, ?) on conflict(key) do update set value = excluded.value',
  ).run(key, value);
}

function parseJson<T>(raw: string): T | null {
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function migrateLegacyObserveState(
  db: Database,
  options: ObserveDbOptions,
): void {
  if (getSetting(db, 'legacy_migrated') === '1') {
    return;
  }

  const statePath = legacyStatePath(options);
  const historyPath = legacyHistoryPath(options);

  try {
    const raw = readFileSync(statePath, 'utf8');
    const legacy = parseJson<LegacyState>(raw);
    if (legacy?.active && legacy.target) {
      const loopID = makeLoopID();
      const startedAt = legacy.startedAt ?? nowIso();
      const interval = Number(legacy.interval ?? DEFAULT_INTERVAL);
      const maxCycles = Number(legacy.maxCycles ?? DEFAULT_MAX_CYCLES);
      const nextCheckAt = legacy.nextCheckAt ?? futureIso(interval);
      db.query(
        `
        insert or ignore into loops (
          id, session_id, target, interval_secs, max_cycles, success_criteria,
          active, cycle_count, pending, last_result, last_summary, last_trigger,
          started_at, last_checked_at, next_check_at, completed_at, created_at,
          updated_at
        ) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      ).run(
        loopID,
        legacy.sessionID ?? null,
        legacy.target,
        interval,
        maxCycles,
        legacy.criteria ?? '',
        legacy.active ? 1 : 0,
        Number(legacy.cycle ?? 0),
        legacy.pending ? 1 : 0,
        legacy.lastResult ?? 'scheduled',
        legacy.lastSummary ?? '',
        legacy.lastTrigger ?? 'legacy-migrate',
        startedAt,
        legacy.lastCheckedAt ?? null,
        nextCheckAt,
        legacy.active ? null : (legacy.lastCheckedAt ?? nowIso()),
        startedAt,
        nowIso(),
      );

      insertEvent(db, {
        loopID,
        type: 'legacy-migrate',
        sessionID: legacy.sessionID ?? null,
        result: legacy.lastResult ?? null,
        summary:
          legacy.lastSummary ?? 'Imported from legacy observe-state.json',
        at: nowIso(),
      });
    }
  } catch {
    // best effort
  }

  try {
    const lines = readFileSync(historyPath, 'utf8')
      .split(/\r?\n/)
      .filter(Boolean)
      .slice(-50);

    for (const line of lines) {
      const entry =
        parseJson<
          Partial<{
            at: string;
            type: string;
            sessionID: string;
            result: string;
            summary: string;
            target: string;
          }>
        >(line);
      if (!entry) {
        continue;
      }

      insertEvent(db, {
        loopID: 'legacy-history',
        type: entry.type ?? 'legacy-history',
        sessionID: entry.sessionID ?? null,
        result: entry.result ?? null,
        summary: entry.summary ?? entry.target ?? 'Imported legacy history',
        at: entry.at ?? nowIso(),
        details: entry,
      });
    }
  } catch {
    // best effort
  }

  setSetting(db, 'legacy_migrated', '1');
}

export function pruneObserveDb(db: Database): void {
  const loopCutoff = new Date(
    Date.now() - LOOP_RETENTION_DAYS * 24 * 60 * 60 * 1000,
  ).toISOString();
  const eventCutoff = new Date(
    Date.now() - EVENT_RETENTION_DAYS * 24 * 60 * 60 * 1000,
  ).toISOString();

  db.query('delete from loop_events where at < ?').run(eventCutoff);
  db.query(
    'delete from loops where active = 0 and coalesce(completed_at, updated_at, created_at) < ?',
  ).run(loopCutoff);
  db.query(
    'update loops set pending = 0, lock_expires_at = null where pending = 1 and lock_expires_at is not null and lock_expires_at < ?',
  ).run(Date.now());
}

export function pruneObserveDbWithCounts(db: Database): ObservePruneCounts {
  const beforeLoops = Number(
    db.query<{ count: number }, []>('select count(*) as count from loops').get()
      ?.count ?? 0,
  );
  const beforeEvents = Number(
    db
      .query<{ count: number }, []>('select count(*) as count from loop_events')
      .get()?.count ?? 0,
  );

  pruneObserveDb(db);

  const afterLoops = Number(
    db.query<{ count: number }, []>('select count(*) as count from loops').get()
      ?.count ?? 0,
  );
  const afterEvents = Number(
    db
      .query<{ count: number }, []>('select count(*) as count from loop_events')
      .get()?.count ?? 0,
  );

  return {
    loopsRemoved: beforeLoops - afterLoops,
    eventsRemoved: beforeEvents - afterEvents,
    remainingLoops: afterLoops,
    remainingEvents: afterEvents,
  };
}

export function openObserveDb(options: ObserveDbOptions): ObserveDbContext {
  const dbPath = resolveObserveDbPath(options);
  mkdirSync(dirname(dbPath), { recursive: true });

  const db = new Database(dbPath);
  db.exec('PRAGMA journal_mode = WAL;');
  db.exec('PRAGMA busy_timeout = 5000;');
  db.exec(`
    create table if not exists loops (
      id text primary key,
      session_id text,
      target text not null,
      interval_secs integer not null,
      max_cycles integer not null,
      success_criteria text not null default '',
      active integer not null default 1,
      cycle_count integer not null default 0,
      pending integer not null default 0,
      last_result text not null default 'scheduled',
      last_summary text not null default '',
      last_trigger text not null default '',
      started_at text not null,
      last_checked_at text,
      next_check_at text,
      completed_at text,
      lock_expires_at integer,
      created_at text not null,
      updated_at text not null
    );
    create index if not exists idx_loops_active_session
      on loops(active, session_id, next_check_at);
    create table if not exists loop_events (
      id integer primary key autoincrement,
      loop_id text not null,
      at text not null,
      type text not null,
      session_id text,
      result text,
      summary text,
      details text
    );
    create index if not exists idx_loop_events_loop_id
      on loop_events(loop_id, at desc);
    create table if not exists settings (
      key text primary key,
      value text not null
    );
  `);

  migrateLegacyObserveState(db, options);
  pruneObserveDb(db);

  return {
    db,
    dbPath,
    close: () => db.close(),
  };
}

export function countObserveState(db: Database): ObserveCounts {
  const activeCount = Number(
    db
      .query<{ count: number }, []>(
        'select count(*) as count from loops where active = 1',
      )
      .get()?.count ?? 0,
  );
  const inactiveCount = Number(
    db
      .query<{ count: number }, []>(
        'select count(*) as count from loops where active = 0',
      )
      .get()?.count ?? 0,
  );
  const pendingCount = Number(
    db
      .query<{ count: number }, []>(
        'select count(*) as count from loops where active = 1 and pending = 1',
      )
      .get()?.count ?? 0,
  );
  const nextCheckAt =
    db
      .query<{ next_check_at: string | null }, []>(
        'select next_check_at from loops where active = 1 and next_check_at is not null order by next_check_at asc limit 1',
      )
      .get()?.next_check_at ?? null;
  const eventCount = Number(
    db
      .query<{ count: number }, []>('select count(*) as count from loop_events')
      .get()?.count ?? 0,
  );

  return {
    activeCount,
    inactiveCount,
    pendingCount,
    nextCheckAt,
    eventCount,
  };
}

export function createLoop(
  db: Database,
  input: CreateLoopInput,
): ObserveLoopRow {
  const loopID = input.id ?? makeLoopID();
  const startedAt = nowIso();

  db.query(
    `
    insert into loops (
      id, session_id, target, interval_secs, max_cycles, success_criteria,
      active, cycle_count, pending, last_result, last_summary, last_trigger,
      started_at, next_check_at, created_at, updated_at
    ) values (?, ?, ?, ?, ?, ?, 1, 0, 0, 'scheduled', '', 'observe_start', ?, ?, ?, ?)
  `,
  ).run(
    loopID,
    input.sessionID,
    input.target,
    input.intervalSecs,
    input.maxCycles,
    input.successCriteria,
    startedAt,
    futureIso(input.intervalSecs),
    startedAt,
    startedAt,
  );

  const loop = getLoop(db, loopID);
  if (!loop) {
    throw new Error('Failed to create observe loop.');
  }
  return loop;
}

export function getLoop(db: Database, loopID: string): ObserveLoopRow | null {
  return (
    db
      .query<ObserveLoopRow, [string]>('select * from loops where id = ?')
      .get(loopID) ?? null
  );
}

export function listLoops(
  db: Database,
  options: ListLoopOptions = {},
): ObserveLoopRow[] {
  const clauses: string[] = [];
  const params: SQLQueryBindings[] = [];

  if (options.status === 'active') {
    clauses.push('active = 1');
  }
  if (options.status === 'inactive') {
    clauses.push('active = 0');
  }
  if (options.sessionOnly && options.sessionID) {
    clauses.push('session_id = ?');
    params.push(options.sessionID);
  }

  const where = clauses.length > 0 ? `where ${clauses.join(' and ')}` : '';
  const limit = Number(options.limit ?? 20);

  return db
    .query(
      `
      select * from loops
      ${where}
      order by active desc, pending desc, next_check_at asc, updated_at desc
      limit ?
    `,
    )
    .all(...params, limit) as ObserveLoopRow[];
}

export function listEvents(
  db: Database,
  options: ListEventOptions = {},
): ObserveEventRow[] {
  const clauses: string[] = [];
  const params: SQLQueryBindings[] = [];

  if (options.loopID) {
    clauses.push('loop_id = ?');
    params.push(options.loopID);
  } else if (options.sessionID) {
    clauses.push('session_id = ?');
    params.push(options.sessionID);
  }

  const where = clauses.length > 0 ? `where ${clauses.join(' and ')}` : '';
  const limit = Number(options.limit ?? 10);

  return db
    .query(
      `
      select * from loop_events
      ${where}
      order by id desc
      limit ?
    `,
    )
    .all(...params, limit) as ObserveEventRow[];
}

export function insertEvent(db: Database, entry: InsertEventInput): void {
  db.query(
    `
    insert into loop_events (loop_id, at, type, session_id, result, summary, details)
    values (?, ?, ?, ?, ?, ?, ?)
  `,
  ).run(
    entry.loopID,
    entry.at ?? nowIso(),
    entry.type,
    entry.sessionID ?? null,
    entry.result ?? null,
    entry.summary ?? null,
    entry.details ? JSON.stringify(entry.details) : null,
  );
}

export function stopLoops(
  db: Database,
  options: { sessionID: string; all?: boolean; loopID?: string },
): ObserveLoopRow[] {
  const loops = options.all
    ? db
        .query<ObserveLoopRow, []>(
          'select * from loops where active = 1 order by started_at asc',
        )
        .all()
    : options.loopID
      ? db
          .query<ObserveLoopRow, [string]>(
            'select * from loops where active = 1 and id = ?',
          )
          .all(options.loopID)
      : db
          .query<ObserveLoopRow, [string]>(
            'select * from loops where active = 1 and session_id = ? order by started_at asc',
          )
          .all(options.sessionID);

  if (loops.length === 0) {
    return loops;
  }

  const stoppedAt = nowIso();
  for (const loop of loops) {
    db.query(
      `
      update loops
      set active = 0,
          pending = 0,
          lock_expires_at = null,
          completed_at = ?,
          last_trigger = ?,
          updated_at = ?
      where id = ?
    `,
    ).run(
      stoppedAt,
      options.all ? 'observe_stop:all' : 'observe_stop',
      stoppedAt,
      loop.id,
    );

    insertEvent(db, {
      loopID: loop.id,
      type: 'stop',
      sessionID: options.sessionID,
      result: loop.last_result,
      summary: loop.last_summary,
      at: stoppedAt,
    });
  }

  return loops;
}

export function bindUnclaimedLoops(db: Database, sessionID: string): void {
  db.query(
    'update loops set session_id = ?, updated_at = ? where active = 1 and session_id is null',
  ).run(sessionID, nowIso());
}

export function activeLoopsForSession(
  db: Database,
  sessionID: string,
): ObserveLoopRow[] {
  return db
    .query<ObserveLoopRow, [string]>(
      `
      select * from loops
      where active = 1 and session_id = ?
      order by pending desc, next_check_at asc, updated_at desc
    `,
    )
    .all(sessionID);
}

export function pendingLoopForSession(
  db: Database,
  sessionID: string,
): ObserveLoopRow | null {
  return (
    db
      .query<ObserveLoopRow, [string, number]>(
        `
        select * from loops
        where active = 1 and session_id = ? and pending = 1
          and (lock_expires_at is null or lock_expires_at >= ?)
        order by updated_at desc
        limit 1
      `,
      )
      .get(sessionID, Date.now()) ?? null
  );
}

export function nextDueLoop(
  db: Database,
  sessionID: string,
): ObserveLoopRow | null {
  db.query(
    'update loops set pending = 0, lock_expires_at = null where active = 1 and session_id = ? and pending = 1 and lock_expires_at is not null and lock_expires_at < ?',
  ).run(sessionID, Date.now());

  return (
    db
      .query<ObserveLoopRow, [string, string]>(
        `
        select * from loops
        where active = 1 and session_id = ? and pending = 0
          and next_check_at is not null and next_check_at <= ?
        order by next_check_at asc, updated_at asc
        limit 1
      `,
      )
      .get(sessionID, nowIso()) ?? null
  );
}

export function markLoopPending(
  db: Database,
  loopID: string,
  trigger: string,
): void {
  db.query(
    `
    update loops
    set pending = 1,
        lock_expires_at = ?,
        last_trigger = ?,
        updated_at = ?
    where id = ?
  `,
  ).run(Date.now() + LOCK_TTL_MS, trigger, nowIso(), loopID);
}

export function resolveLoopForResult(
  db: Database,
  sessionID: string,
  loopID?: string,
): ObserveLoopRow | null {
  if (loopID) {
    return (
      db
        .query<ObserveLoopRow, [string, string]>(
          'select * from loops where id = ? and session_id = ?',
        )
        .get(loopID, sessionID) ?? null
    );
  }

  const pending = db
    .query<ObserveLoopRow, [string]>(
      'select * from loops where active = 1 and session_id = ? and pending = 1 order by updated_at desc',
    )
    .all(sessionID);

  return pending.length === 1 ? pending[0] : null;
}

export function completeLoopCycle(
  db: Database,
  loop: ObserveLoopRow,
  result: { status: string; summary: string },
): void {
  const checkedAt = nowIso();
  const nextCycle = Number(loop.cycle_count) + 1;
  const shouldStop =
    result.status === 'healthy' || nextCycle >= Number(loop.max_cycles);
  const nextCheckAt = shouldStop ? null : futureIso(Number(loop.interval_secs));

  db.query(
    `
    update loops
    set cycle_count = ?,
        pending = 0,
        lock_expires_at = null,
        last_result = ?,
        last_summary = ?,
        last_checked_at = ?,
        last_trigger = ?,
        active = ?,
        next_check_at = ?,
        completed_at = ?,
        updated_at = ?
    where id = ?
  `,
  ).run(
    nextCycle,
    result.status || 'unknown',
    result.summary || '',
    checkedAt,
    'message.part.updated',
    shouldStop ? 0 : 1,
    nextCheckAt,
    shouldStop ? checkedAt : null,
    checkedAt,
    loop.id,
  );

  insertEvent(db, {
    loopID: loop.id,
    type: shouldStop ? 'complete' : 'cycle',
    sessionID: loop.session_id,
    result: result.status || 'unknown',
    summary: result.summary || '',
    at: checkedAt,
    details: { cycle: nextCycle, nextCheckAt },
  });
}

export function detachSessionLoops(db: Database, sessionID: string): number {
  const loops = activeLoopsForSession(db, sessionID);
  if (loops.length === 0) {
    return 0;
  }

  const detachedAt = nowIso();
  for (const loop of loops) {
    db.query(
      `
      update loops
      set session_id = null,
          pending = 0,
          lock_expires_at = null,
          last_trigger = ?,
          updated_at = ?
      where id = ?
    `,
    ).run('session.deleted', detachedAt, loop.id);

    insertEvent(db, {
      loopID: loop.id,
      type: 'session-detached',
      sessionID,
      result: loop.last_result,
      summary: loop.last_summary,
      at: detachedAt,
    });
  }

  return loops.length;
}

export function extractObserveResult(
  text: string,
): { loopID: string; status: string; summary: string } | null {
  const match = text.match(/<observe-result\b([^>]*)\/>/i);
  if (!match?.[1]) {
    return null;
  }

  const attrs = match[1];
  const attr = (name: string): string =>
    attrs.match(new RegExp(`${name}="([^"]*)"`, 'i'))?.[1]?.trim() || '';

  return {
    loopID: attr('loop_id') || attr('loop'),
    status: attr('status').toLowerCase(),
    summary: attr('summary'),
  };
}

export function safeObserveCounts(options: ObserveDbOptions): ObserveCounts {
  try {
    const context = openObserveDb(options);
    try {
      return countObserveState(context.db);
    } finally {
      context.close();
    }
  } catch {
    return {
      activeCount: 0,
      inactiveCount: 0,
      pendingCount: 0,
      nextCheckAt: null,
      eventCount: 0,
    };
  }
}

export function safeReadObserveCounts(
  options: ObserveDbOptions,
): ObserveCounts {
  const dbPath = resolveObserveDbPath(options);
  if (!existsSync(dbPath)) {
    return {
      activeCount: 0,
      inactiveCount: 0,
      pendingCount: 0,
      nextCheckAt: null,
      eventCount: 0,
    };
  }

  try {
    const db = new Database(dbPath, { readonly: true });
    try {
      return countObserveState(db);
    } finally {
      db.close();
    }
  } catch {
    return {
      activeCount: 0,
      inactiveCount: 0,
      pendingCount: 0,
      nextCheckAt: null,
      eventCount: 0,
    };
  }
}
