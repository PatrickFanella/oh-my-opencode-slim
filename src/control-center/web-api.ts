import { existsSync, statSync } from 'node:fs';
import { hostname } from 'node:os';
import { extname, isAbsolute, join, relative, resolve } from 'node:path';
import { createSchedulerStatusSnapshot } from './scheduler-status';
import {
  type ControlCenterServices,
  createControlCenterServices,
} from './services';
import type { StreamEvent } from './types';

export interface ControlCenterWebApiOptions {
  assetRoot?: string;
  configDir?: string;
  pollIntervalMs?: number;
  services?: ControlCenterServices;
}

export interface ControlCenterWebServerOptions
  extends ControlCenterWebApiOptions {
  host?: string;
  port?: number;
}

export interface ControlCenterWebServer {
  host: string;
  port: number;
  url: string;
  stop(): void;
}

const JSON_HEADERS = {
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'no-store',
};

const SSE_HEADERS = {
  'content-type': 'text/event-stream; charset=utf-8',
  'cache-control': 'no-cache, no-transform',
  connection: 'keep-alive',
};

export function createControlCenterWebApi(
  options: ControlCenterWebApiOptions = {},
): { fetch(request: Request): Promise<Response> } {
  const services =
    options.services ??
    createControlCenterServices({ configDir: options.configDir });
  const pollIntervalMs = options.pollIntervalMs ?? 5000;

  return {
    async fetch(request: Request): Promise<Response> {
      const url = new URL(request.url);

      if (url.pathname.startsWith('/api/')) {
        if (request.method !== 'GET') {
          return jsonResponse(
            { error: 'Control center API is read-only' },
            { status: 405, headers: { allow: 'GET' } },
          );
        }
        return handleApiRoute(request, services, pollIntervalMs);
      }

      if (options.assetRoot) {
        const staticResponse = await serveStaticAsset(
          url.pathname,
          options.assetRoot,
        );
        if (staticResponse) return staticResponse;
      }

      return jsonResponse({ error: 'Not found' }, { status: 404 });
    },
  };
}

export function startControlCenterWebServer(
  options: ControlCenterWebServerOptions = {},
): ControlCenterWebServer {
  const host = options.host ?? '127.0.0.1';
  const api = createControlCenterWebApi(options);
  const server = Bun.serve({
    hostname: host,
    port: options.port ?? 0,
    fetch: api.fetch,
  });
  const url = `http://${server.hostname}:${server.port}`;

  return {
    host: server.hostname ?? host,
    port: server.port ?? options.port ?? 0,
    url,
    stop() {
      server.stop(true);
    },
  };
}

async function handleApiRoute(
  request: Request,
  services: ControlCenterServices,
  pollIntervalMs: number,
): Promise<Response> {
  const url = new URL(request.url);
  const segments = url.pathname.split('/').filter(Boolean).map(decodeSegment);

  try {
    if (segments.length === 2 && segments[1] === 'snapshot') {
      const selectedTask = url.searchParams.get('selectedTask') ?? undefined;
      if (selectedTask && !isSafeTaskName(selectedTask)) {
        return invalidTaskNameResponse();
      }
      return jsonResponse(await services.snapshot(selectedTask));
    }

    if (segments.length === 2 && segments[1] === 'scheduler-status') {
      const [tasks, health] = await Promise.all([
        services.tasks.listTasks(),
        services.health.getSchedulerHealth(),
      ]);
      return jsonResponse(
        createSchedulerStatusSnapshot([
          {
            host: hostname(),
            generatedAt: new Date().toISOString(),
            health,
            tasks,
          },
        ]),
      );
    }

    if (segments.length === 2 && segments[1] === 'tasks') {
      return jsonResponse(await services.tasks.listTasks());
    }

    if (segments.length === 3 && segments[1] === 'tasks') {
      if (!isSafeTaskName(segments[2])) return invalidTaskNameResponse();
      return jsonResponse(await services.tasks.getTask(segments[2]));
    }

    if (
      segments.length === 4 &&
      segments[1] === 'tasks' &&
      segments[3] === 'runs'
    ) {
      if (!isSafeTaskName(segments[2])) return invalidTaskNameResponse();
      const limit = numberParam(url.searchParams.get('limit'), 25, 1, 100);
      return jsonResponse(await services.tasks.listRuns(segments[2], limit));
    }

    if (
      segments.length === 3 &&
      segments[1] === 'health' &&
      segments[2] === 'scheduler'
    ) {
      return jsonResponse(await services.health.getSchedulerHealth());
    }

    if (
      segments.length === 3 &&
      segments[1] === 'events' &&
      segments[2] === 'scheduler'
    ) {
      const limit = numberParam(url.searchParams.get('limit'), 50, 1, 200);
      const once = url.searchParams.get('once') === 'true';
      return schedulerEventsResponse(
        request,
        services,
        limit,
        pollIntervalMs,
        once,
      );
    }

    return jsonResponse({ error: 'Not found' }, { status: 404 });
  } catch (error) {
    return jsonResponse(
      {
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}

function schedulerEventsResponse(
  request: Request,
  services: ControlCenterServices,
  limit: number,
  pollIntervalMs: number,
  once: boolean,
): Response {
  const encoder = new TextEncoder();
  let closed = false;
  let timer: Timer | undefined;

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const close = () => {
        if (closed) return;
        closed = true;
        if (timer) clearInterval(timer);
        try {
          controller.close();
        } catch {
          // The request can be aborted after the stream has already closed.
        }
      };

      request.signal.addEventListener('abort', close);

      const sendEvents = async () => {
        if (closed) return;
        const events = await services.streams.listRecentSchedulerEvents(limit);
        if (events.length === 0) {
          controller.enqueue(encoder.encode(': no scheduler events\n\n'));
          return;
        }
        for (const event of events) {
          controller.enqueue(encoder.encode(formatSseEvent(event)));
        }
      };

      await sendEvents();
      if (once) {
        close();
        return;
      }
      timer = setInterval(() => void sendEvents(), pollIntervalMs);
    },
    cancel() {
      closed = true;
      if (timer) clearInterval(timer);
    },
  });

  return new Response(stream, { headers: SSE_HEADERS });
}

function formatSseEvent(event: StreamEvent): string {
  return ['event: scheduler', `data: ${JSON.stringify(event)}`, '', ''].join(
    '\n',
  );
}

async function serveStaticAsset(
  pathname: string,
  assetRoot: string,
): Promise<Response | undefined> {
  const root = resolve(assetRoot);
  const decodedPath = safeDecodeUri(pathname);
  if (!decodedPath) {
    return jsonResponse({ error: 'Bad request' }, { status: 400 });
  }
  const requestedPath = decodedPath === '/' ? 'index.html' : decodedPath;
  const assetPath = resolveContainedPath(
    root,
    requestedPath.replace(/^\/+/, ''),
  );
  if (!assetPath) {
    return jsonResponse({ error: 'Forbidden' }, { status: 403 });
  }

  if (existsSync(assetPath) && statSync(assetPath).isFile()) {
    return new Response(Bun.file(assetPath), {
      headers: { 'content-type': contentType(assetPath) },
    });
  }

  const indexPath = join(root, 'index.html');
  if (existsSync(indexPath)) {
    return new Response(Bun.file(indexPath), {
      headers: { 'content-type': 'text/html; charset=utf-8' },
    });
  }

  return undefined;
}

function resolveContainedPath(root: string, child: string): string | undefined {
  const rootPath = resolve(root);
  const targetPath = resolve(rootPath, child);
  const pathFromRoot = relative(rootPath, targetPath);
  if (pathFromRoot.startsWith('..') || isAbsolute(pathFromRoot)) {
    return undefined;
  }
  return targetPath;
}

function contentType(path: string): string {
  switch (extname(path)) {
    case '.css':
      return 'text/css; charset=utf-8';
    case '.html':
      return 'text/html; charset=utf-8';
    case '.js':
      return 'text/javascript; charset=utf-8';
    case '.json':
      return 'application/json; charset=utf-8';
    case '.svg':
      return 'image/svg+xml';
    default:
      return 'application/octet-stream';
  }
}

function jsonResponse(body: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(body, null, 2), {
    ...init,
    headers: {
      ...JSON_HEADERS,
      ...init.headers,
    },
  });
}

function decodeSegment(segment: string): string {
  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
}

function safeDecodeUri(value: string): string | undefined {
  try {
    return decodeURI(value);
  } catch {
    return undefined;
  }
}

function isSafeTaskName(taskName: string): boolean {
  return /^[a-z0-9][a-z0-9._-]*$/i.test(taskName);
}

function invalidTaskNameResponse(): Response {
  return jsonResponse({ error: 'Invalid task name' }, { status: 400 });
}

function numberParam(
  value: string | null,
  fallback: number,
  min: number,
  max: number,
): number {
  if (!value) return fallback;
  const parsed = Number(value);
  if (!Number.isInteger(parsed)) return fallback;
  return Math.max(min, Math.min(parsed, max));
}
