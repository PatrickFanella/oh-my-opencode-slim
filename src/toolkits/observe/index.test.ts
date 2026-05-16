import { describe, expect, test } from 'bun:test';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { nowIso, openObserveDb } from './db';
import { createObserveToolkit } from './index';

type MetadataCall = {
  title?: string;
  metadata?: unknown;
};

function createToolContext(sessionID: string) {
  const metadataCalls: MetadataCall[] = [];
  const context = {
    sessionID,
    metadata(value: MetadataCall) {
      metadataCalls.push(value);
    },
  };

  return { context, metadataCalls };
}

describe('observe toolkit', () => {
  test('registers commands and preserves user overrides', () => {
    const temp = mkdtempSync(join(tmpdir(), 'observe-toolkit-'));
    const toolkit = createObserveToolkit({
      directory: temp,
      dbPath: join(temp, 'observe.db'),
      baseConfigDir: temp,
    });

    const config: Record<string, unknown> = {
      command: {
        'observe-start': {
          description: 'custom',
          template: 'custom-template',
        },
      },
    };

    toolkit.registerCommands(config);

    const commands = config.command as Record<
      string,
      { description: string; template: string }
    >;
    expect(commands['observe-start'].template).toBe('custom-template');
    expect(commands['observe-status'].template).toContain('observe_status');
    expect(commands['observe-prune'].template).toContain('observe_prune');
  });

  test('start/list/status/history/stop/prune basics', async () => {
    const temp = mkdtempSync(join(tmpdir(), 'observe-toolkit-'));
    const toolkit = createObserveToolkit({
      directory: temp,
      dbPath: join(temp, 'observe.db'),
      baseConfigDir: temp,
    });
    const { context } = createToolContext('session-1');

    const start = await toolkit.tools.observe_start.execute(
      {
        target: 'api-service',
        interval_secs: 5,
        success_criteria: 'healthy',
        max_cycles: 3,
      },
      context as Parameters<typeof toolkit.tools.observe_start.execute>[1],
    );
    expect(start).toContain('Loop obs-');

    const list = await toolkit.tools.observe_list.execute(
      { status: 'active', session_only: true, limit: 20 },
      context as Parameters<typeof toolkit.tools.observe_list.execute>[1],
    );
    expect(list).toContain('api-service');

    const status = await toolkit.tools.observe_status.execute(
      {},
      context as Parameters<typeof toolkit.tools.observe_status.execute>[1],
    );
    expect(status).toContain('api-service');

    const history = await toolkit.tools.observe_history.execute(
      {},
      context as Parameters<typeof toolkit.tools.observe_history.execute>[1],
    );
    expect(history).toContain('start');

    const stop = await toolkit.tools.observe_stop.execute(
      {},
      context as Parameters<typeof toolkit.tools.observe_stop.execute>[1],
    );
    expect(stop).toBe('Stopped 1 loop(s).');

    const prune = await toolkit.tools.observe_prune.execute(
      {},
      context as Parameters<typeof toolkit.tools.observe_prune.execute>[1],
    );
    expect(prune).toContain('Removed loops=');
  });

  test('idle enqueue + observe-result completion + system transform', async () => {
    const temp = mkdtempSync(join(tmpdir(), 'observe-toolkit-'));
    const dbPath = join(temp, 'observe.db');
    const prompts: string[] = [];

    const toolkit = createObserveToolkit({
      directory: temp,
      dbPath,
      baseConfigDir: temp,
      client: {
        session: {
          async prompt(input) {
            prompts.push(input.body.parts[0]?.text ?? '');
            return null;
          },
        },
      },
    });

    const { context } = createToolContext('session-1');
    const start = await toolkit.tools.observe_start.execute(
      {
        target: 'worker',
        interval_secs: 5,
        success_criteria: 'healthy',
        max_cycles: 3,
      },
      context as Parameters<typeof toolkit.tools.observe_start.execute>[1],
    );

    const loopID = start.match(/Loop\s+(obs-[^\s]+)/)?.[1];
    expect(loopID).toBeDefined();

    const dbContext = openObserveDb({
      directory: temp,
      dbPath,
      baseConfigDir: temp,
    });
    try {
      dbContext.db
        .query('update loops set next_check_at = ? where id = ?')
        .run(nowIso(), loopID);
    } finally {
      dbContext.close();
    }

    await toolkit.handleEvent({
      event: {
        type: 'session.idle',
        properties: { sessionID: 'session-1' },
      },
    });

    expect(prompts.some((text) => text.includes('<observe-result'))).toBe(true);

    await toolkit.handleEvent({
      event: {
        type: 'message.part.updated',
        properties: {
          sessionID: 'session-1',
          part: {
            type: 'text',
            synthetic: false,
            text: `<observe-result loop_id="${loopID}" status="healthy" summary="all good" />`,
          },
        },
      },
    });

    const loopStatus = await toolkit.tools.observe_status.execute(
      { loop_id: loopID },
      context as Parameters<typeof toolkit.tools.observe_status.execute>[1],
    );
    expect(loopStatus).toContain('healthy');
    expect(loopStatus).toContain('cycle 1/3');

    const output = { system: ['base'] };
    await toolkit.handleSystemTransform({ sessionID: 'session-1' }, output);
    expect(output.system.length).toBe(1);

    const startedAgain = await toolkit.tools.observe_start.execute(
      {
        target: 'worker-2',
        interval_secs: 5,
        success_criteria: 'healthy',
        max_cycles: 3,
      },
      context as Parameters<typeof toolkit.tools.observe_start.execute>[1],
    );
    expect(startedAgain).toContain('worker-2');

    const output2 = { system: ['base'] };
    await toolkit.handleSystemTransform({ sessionID: 'session-1' }, output2);
    expect(output2.system.length).toBe(2);
    expect(output2.system[1]).toContain('<observation-state>');
  });

  test('session.deleted detaches loops when event uses sessionID', async () => {
    const temp = mkdtempSync(join(tmpdir(), 'observe-toolkit-'));
    const toolkit = createObserveToolkit({
      directory: temp,
      dbPath: join(temp, 'observe.db'),
      baseConfigDir: temp,
    });
    const { context } = createToolContext('session-1');

    await toolkit.tools.observe_start.execute(
      {
        target: 'detachable-worker',
        interval_secs: 5,
        max_cycles: 3,
      },
      context as Parameters<typeof toolkit.tools.observe_start.execute>[1],
    );

    await toolkit.handleEvent({
      event: {
        type: 'session.deleted',
        properties: { sessionID: 'session-1' },
      },
    });

    const status = await toolkit.tools.observe_status.execute(
      {},
      context as Parameters<typeof toolkit.tools.observe_status.execute>[1],
    );
    expect(status).toBe('Observation idle.');
  });
});
