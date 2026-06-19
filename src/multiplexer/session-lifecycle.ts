import { POLL_INTERVAL_BACKGROUND_MS } from '../config';
import { log } from '../utils/logger';
import { isServerRunning, type Multiplexer } from './types';

export interface TrackedSession {
  sessionId: string;
  paneId: string;
  parentId: string;
  title: string;
  directory: string;
  createdAt: number;
  lastSeenAt: number;
  hasBeenBusy?: boolean;
  idleSince?: number;
  missingSince?: number;
}

export interface KnownSession {
  parentId: string;
  title: string;
  directory: string;
  hasBeenBusy?: boolean;
}

export type CloseReason = 'idle' | 'deleted' | 'missing' | 'timeout';

const SESSION_TIMEOUT_MS = 10 * 60 * 1000;
const SESSION_IDLE_GRACE_MS = POLL_INTERVAL_BACKGROUND_MS * 3;
const SESSION_MISSING_GRACE_MS = POLL_INTERVAL_BACKGROUND_MS * 3;

export class SessionLifecycle {
  private sessions = new Map<string, TrackedSession>();
  private knownSessions = new Map<string, KnownSession>();
  private spawningSessions = new Set<string>();
  private spawnTokens = new Map<string, symbol>();
  private spawnPromises = new Set<Promise<void>>();
  private closingSessions = new Map<string, Promise<void>>();
  private cleaningUp = false;

  constructor(
    private readonly multiplexer: Multiplexer,
    private readonly serverUrl: string,
    private readonly startPolling: () => void,
    private readonly stopPolling: () => void,
    private readonly updatePolling: () => void,
  ) {}

  get trackedSessions(): ReadonlyMap<string, TrackedSession> {
    return this.sessions;
  }

  get shouldPoll(): boolean {
    return this.sessions.size > 0 || this.closingSessions.size > 0;
  }

  async handleCreated(args: {
    sessionId: string;
    parentId: string;
    title: string;
    directory: string;
  }): Promise<void> {
    const { sessionId, parentId, title, directory } = args;
    if (this.cleaningUp) return;

    if (this.isTrackedOrSpawning(sessionId)) return;

    const closing = this.closingSessions.get(sessionId);
    if (closing) await closing;

    if (this.cleaningUp) return;
    if (this.isTrackedOrSpawning(sessionId)) return;

    const previousKnown = this.knownSessions.get(sessionId);
    this.knownSessions.set(sessionId, {
      parentId,
      title,
      directory,
      hasBeenBusy: previousKnown?.hasBeenBusy,
    });

    await this.trackSpawn(sessionId, async (spawnToken) => {
      await this.spawnCreatedPane({
        sessionId,
        parentId,
        title,
        directory,
        spawnToken,
      });
    });
  }

  async handleStatus(args: {
    sessionId: string;
    status: string;
  }): Promise<void> {
    const { sessionId, status } = args;
    if (status === 'idle') {
      this.markSessionIdle(sessionId);
      return;
    }
    if (status === 'busy') {
      this.markSessionBusy(sessionId);
      await this.respawnIfKnown(sessionId);
    }
  }

  async handleDeleted(sessionId: string): Promise<void> {
    log('[multiplexer-session-manager] session deleted, closing pane', {
      sessionId,
    });
    await this.closeSession(sessionId, 'deleted');
  }

  async pollSessions(): Promise<void> {
    if (this.sessions.size === 0) {
      this.stopPolling();
      return;
    }

    try {
      const allStatuses = await this.fetchSessionStatuses();
      const now = Date.now();
      const sessionsToClose: Array<{ sessionId: string; reason: CloseReason }> =
        [];

      for (const [sessionId, tracked] of this.sessions.entries()) {
        const status = allStatuses[sessionId];
        const isIdle = status?.type === 'idle';

        if (status) {
          tracked.lastSeenAt = now;
          tracked.missingSince = undefined;
          if (isIdle) tracked.idleSince ??= now;
          else if (status.type === 'busy') {
            this.markSessionBusy(sessionId);
            tracked.idleSince = undefined;
          } else tracked.idleSince = undefined;
        } else if (!tracked.missingSince) tracked.missingSince = now;

        const idleTooLong =
          tracked.hasBeenBusy &&
          !!tracked.idleSince &&
          now - tracked.idleSince >= SESSION_IDLE_GRACE_MS;
        const missingTooLong =
          !!tracked.missingSince &&
          now - tracked.missingSince >= SESSION_MISSING_GRACE_MS;
        const isTimedOut = now - tracked.createdAt > SESSION_TIMEOUT_MS;

        if (idleTooLong || missingTooLong || isTimedOut) {
          sessionsToClose.push({
            sessionId,
            reason: idleTooLong ? 'idle' : isTimedOut ? 'timeout' : 'missing',
          });
        }
      }

      for (const { sessionId, reason } of sessionsToClose) {
        await this.closeSession(sessionId, reason);
      }
    } catch (err) {
      log('[multiplexer-session-manager] poll error', { error: String(err) });
    }
  }

  async cleanup(): Promise<void> {
    this.cleaningUp = true;
    this.stopPolling();
    this.knownSessions.clear();
    this.spawningSessions.clear();
    this.spawnTokens.clear();

    if (this.spawnPromises.size > 0) {
      await Promise.all(this.spawnPromises);
    }

    if (this.closingSessions.size > 0) {
      await Promise.all(this.closingSessions.values());
    }

    if (this.sessions.size > 0) {
      log('[multiplexer-session-manager] closing all panes', {
        count: this.sessions.size,
      });
      const closePromises = Array.from(this.sessions.values()).map((s) =>
        this.multiplexer.closePane(s.paneId).catch((err) =>
          log('[multiplexer-session-manager] cleanup error for pane', {
            paneId: s.paneId,
            error: String(err),
          }),
        ),
      );
      await Promise.all(closePromises);
      this.sessions.clear();
    }

    this.closingSessions.clear();
    this.cleaningUp = false;
    this.updatePolling();
    log('[multiplexer-session-manager] cleanup complete');
  }

  private async trackSpawn(
    sessionId: string,
    spawn: (spawnToken: symbol) => Promise<void>,
  ): Promise<void> {
    if (this.cleaningUp) return;

    this.spawningSessions.add(sessionId);
    const spawnToken = Symbol(sessionId);
    this.spawnTokens.set(sessionId, spawnToken);

    let spawnPromise: Promise<void>;
    spawnPromise = spawn(spawnToken).finally(() => {
      if (this.spawnTokens.get(sessionId) === spawnToken) {
        this.spawnTokens.delete(sessionId);
        this.spawningSessions.delete(sessionId);
      }
      this.spawnPromises.delete(spawnPromise);
    });

    this.spawnPromises.add(spawnPromise);
    await spawnPromise;
  }

  private async spawnCreatedPane(args: {
    sessionId: string;
    parentId: string;
    title: string;
    directory: string;
    spawnToken: symbol;
  }): Promise<void> {
    const { sessionId, parentId, title, directory, spawnToken } = args;

    if (!(await isServerRunning(this.serverUrl))) return;
    if (this.closingSessions.has(sessionId) || this.sessions.has(sessionId)) {
      return;
    }

    const paneResult = await this.multiplexer
      .spawnPane(sessionId, title, this.serverUrl, directory)
      .catch((err) => {
        log('[multiplexer-session-manager] failed to spawn pane', {
          error: String(err),
        });
        return { success: false, paneId: undefined };
      });

    if (!paneResult.success || !paneResult.paneId) return;

    if (this.isStaleSpawn(sessionId, spawnToken)) {
      await this.closeStalePane(sessionId, paneResult.paneId, 'spawned');
      return;
    }

    const now = Date.now();
    this.sessions.set(sessionId, {
      sessionId,
      paneId: paneResult.paneId,
      parentId,
      title,
      directory,
      createdAt: now,
      hasBeenBusy: this.knownSessions.get(sessionId)?.hasBeenBusy,
      lastSeenAt: now,
    });
    this.startPolling();
  }

  private async spawnKnownPane(
    sessionId: string,
    known: KnownSession,
    spawnToken: symbol,
  ): Promise<void> {
    if (!(await isServerRunning(this.serverUrl))) return;
    if (this.sessions.has(sessionId) || this.closingSessions.has(sessionId)) {
      return;
    }

    const paneResult = await this.multiplexer
      .spawnPane(sessionId, known.title, this.serverUrl, known.directory)
      .catch((err) => {
        log('[multiplexer-session-manager] failed to respawn pane', {
          error: String(err),
        });
        return { success: false, paneId: undefined };
      });

    if (!paneResult.success || !paneResult.paneId) return;

    if (this.isStaleSpawn(sessionId, spawnToken)) {
      await this.closeStalePane(sessionId, paneResult.paneId, 'respawned');
      return;
    }

    const now = Date.now();
    this.sessions.set(sessionId, {
      sessionId,
      paneId: paneResult.paneId,
      parentId: known.parentId,
      title: known.title,
      directory: known.directory,
      createdAt: now,
      hasBeenBusy: known.hasBeenBusy,
      lastSeenAt: now,
    });
    this.startPolling();
  }

  private async closeStalePane(
    sessionId: string,
    paneId: string,
    staleType: 'spawned' | 'respawned',
  ): Promise<void> {
    await this.multiplexer.closePane(paneId).catch((err) =>
      log(
        `[multiplexer-session-manager] closing stale ${staleType} pane failed`,
        {
          sessionId,
          paneId,
          error: String(err),
        },
      ),
    );
  }

  private isStaleSpawn(sessionId: string, spawnToken: symbol): boolean {
    return (
      this.spawnTokens.get(sessionId) !== spawnToken ||
      !this.knownSessions.has(sessionId) ||
      this.closingSessions.has(sessionId)
    );
  }

  private async fetchSessionStatuses(): Promise<
    Record<string, { type: string }>
  > {
    const url = new URL('/session/status', this.serverUrl);
    const response = await fetch(url, { signal: AbortSignal.timeout(2_000) });
    if (!response.ok) {
      throw new Error(
        `session status request failed: ${response.status} ${response.statusText}`,
      );
    }
    return (await response.json()) as Record<string, { type: string }>;
  }

  private async closeSession(
    sessionId: string,
    reason: CloseReason,
  ): Promise<void> {
    if (reason === 'deleted') {
      this.knownSessions.delete(sessionId);
      this.spawningSessions.delete(sessionId);
      this.spawnTokens.delete(sessionId);
    }

    const existingClose = this.closingSessions.get(sessionId);
    if (existingClose) return existingClose;

    const tracked = this.sessions.get(sessionId);
    if (!tracked) return;

    this.sessions.delete(sessionId);
    const closePromise: Promise<void> = this.multiplexer
      .closePane(tracked.paneId)
      .then(() => undefined)
      .catch((err) =>
        log('[multiplexer-session-manager] failed to close session pane', {
          sessionId,
          paneId: tracked.paneId,
          reason,
          error: String(err),
        }),
      )
      .finally(() => {
        this.closingSessions.delete(sessionId);
        this.updatePolling();
      });
    this.closingSessions.set(sessionId, closePromise);
    await closePromise;
  }

  private async respawnIfKnown(sessionId: string): Promise<void> {
    if (this.cleaningUp) return;

    const closing = this.closingSessions.get(sessionId);
    if (closing) await closing;
    if (this.cleaningUp) return;
    if (this.isTrackedOrSpawning(sessionId)) return;

    const known = this.knownSessions.get(sessionId);
    if (!known) return;

    await this.trackSpawn(sessionId, async (spawnToken) => {
      await this.spawnKnownPane(sessionId, known, spawnToken);
    });
  }

  private isTrackedOrSpawning(sessionId: string): boolean {
    return this.sessions.has(sessionId) || this.spawningSessions.has(sessionId);
  }

  private markSessionIdle(sessionId: string): void {
    const tracked = this.sessions.get(sessionId);
    if (!tracked) return;
    const now = Date.now();
    tracked.lastSeenAt = now;
    tracked.idleSince ??= now;
    this.startPolling();
  }

  private markSessionBusy(sessionId: string): void {
    const known = this.knownSessions.get(sessionId);
    if (known) known.hasBeenBusy = true;
    const tracked = this.sessions.get(sessionId);
    if (tracked) {
      tracked.hasBeenBusy = true;
      tracked.idleSince = undefined;
      tracked.lastSeenAt = Date.now();
    }
  }
}
