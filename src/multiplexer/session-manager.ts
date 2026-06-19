import type { PluginInput } from '@opencode-ai/plugin';
import { POLL_INTERVAL_BACKGROUND_MS } from '../config';
import type { MultiplexerConfig } from '../config/schema';
import { getMultiplexer, type Multiplexer } from '../multiplexer';
import { log } from '../utils/logger';
import { SessionLifecycle } from './session-lifecycle';

interface SessionEvent {
  type: string;
  properties?: {
    info?: {
      id?: string;
      parentID?: string;
      title?: string;
      directory?: string;
    };
    sessionID?: string;
    status?: { type: string };
  };
}

export function resolveMultiplexerServerUrl(ctx: PluginInput): string {
  if (process.env.OPENCODE_SERVER_URL) {
    return process.env.OPENCODE_SERVER_URL;
  }

  if (process.env.OPENCODE_PORT) {
    return `http://localhost:${process.env.OPENCODE_PORT}`;
  }

  return ctx.serverUrl?.toString() ?? 'http://localhost:4096';
}

/**
 * Tracks child sessions and spawns/closes multiplexer panes for them.
 *
 * Uses session.status events for completion detection instead of polling,
 * with polling kept as a fallback for reliability.
 */
export class MultiplexerSessionManager {
  private serverUrl: string;
  private directory: string;
  private multiplexer: Multiplexer | null = null;
  private lifecycle: SessionLifecycle | null = null;
  private pollInterval?: ReturnType<typeof setInterval>;
  private enabled = false;

  constructor(ctx: PluginInput, config: MultiplexerConfig) {
    this.directory = ctx.directory;
    this.serverUrl = resolveMultiplexerServerUrl(ctx);

    this.multiplexer = getMultiplexer(config);
    this.enabled =
      config.type !== 'none' &&
      this.multiplexer !== null &&
      this.multiplexer.isInsideSession();

    if (this.multiplexer) {
      this.lifecycle = new SessionLifecycle(
        this.multiplexer,
        this.serverUrl,
        () => this.startPolling(),
        () => this.stopPolling(),
        () => this.updatePolling(),
      );
    }

    log('[multiplexer-session-manager] initialized', {
      enabled: this.enabled,
      type: config.type,
      serverUrl: this.serverUrl,
    });
  }

  async onSessionCreated(event: SessionEvent): Promise<void> {
    if (!this.enabled || !this.lifecycle) return;
    if (event.type !== 'session.created') return;

    const info = event.properties?.info;
    if (!info?.id || !info?.parentID) {
      return;
    }

    const sessionId = info.id;
    const parentId = info.parentID;
    const title = info.title ?? 'Subagent';
    const directory = info.directory ?? this.directory;

    log('[multiplexer-session-manager] child session created, spawning pane', {
      sessionId,
      parentId,
      title,
    });

    await this.lifecycle.handleCreated({
      sessionId,
      parentId,
      title,
      directory,
    });
  }

  async onSessionStatus(event: SessionEvent): Promise<void> {
    if (!this.enabled || !this.lifecycle) return;
    if (event.type !== 'session.status') return;

    const sessionId = event.properties?.sessionID;
    if (!sessionId) return;

    const status = event.properties?.status?.type;

    if (status === 'idle') {
      await this.lifecycle.handleStatus({ sessionId, status: 'idle' });
      return;
    }

    if (status === 'busy') {
      await this.lifecycle.handleStatus({ sessionId, status: 'busy' });
    }
  }

  async onSessionDeleted(event: SessionEvent): Promise<void> {
    if (!this.enabled || !this.lifecycle) return;
    if (event.type !== 'session.deleted') return;

    const sessionId = this.getSessionId(event);
    if (!sessionId) return;

    await this.lifecycle.handleDeleted(sessionId);
  }

  private startPolling(): void {
    if (this.pollInterval) return;

    this.pollInterval = setInterval(
      () => this.pollSessions(),
      POLL_INTERVAL_BACKGROUND_MS,
    );
    log('[multiplexer-session-manager] polling started');
  }

  private stopPolling(): void {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = undefined;
      log('[multiplexer-session-manager] polling stopped');
    }
  }

  private async pollSessions(): Promise<void> {
    await this.lifecycle?.pollSessions();
  }

  private updatePolling(): void {
    if (this.lifecycle?.shouldPoll) {
      this.startPolling();
    } else {
      this.stopPolling();
    }
  }

  private getSessionId(event: SessionEvent): string | undefined {
    return event.properties?.info?.id ?? event.properties?.sessionID;
  }

  async cleanup(): Promise<void> {
    await this.lifecycle?.cleanup();
  }
}

/**
 * @deprecated Use MultiplexerSessionManager instead
 */
export const TmuxSessionManager = MultiplexerSessionManager;
