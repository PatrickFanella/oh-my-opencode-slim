import { describe, expect, test } from 'bun:test';
import { existsSync, mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createCavemanToolkit } from './index';

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

describe('caveman toolkit', () => {
  test('registers caveman tool', () => {
    const toolkit = createCavemanToolkit();
    expect(Object.keys(toolkit.tools)).toEqual(['caveman_mode']);
  });

  test('registers commands and preserves user overrides', () => {
    const toolkit = createCavemanToolkit();
    const config: Record<string, unknown> = {
      command: {
        caveman: {
          description: 'custom',
          template: 'custom template',
        },
      },
    };

    toolkit.registerCommands(config);
    const commands = config.command as Record<
      string,
      { description: string; template: string }
    >;

    expect(commands.caveman).toEqual({
      description: 'custom',
      template: 'custom template',
    });
    expect(commands['caveman-status'].template).toContain('action `get`');
    expect(commands['caveman-commit'].template).toContain('`commit` mode');
    expect(commands['caveman-review'].template).toContain('`review` mode');
    expect(commands['caveman-compress'].template).toContain('Requirements:');
  });

  test('caveman_mode tool supports list/get/set/clear/default actions', async () => {
    const project = mkdtempSync(join(tmpdir(), 'caveman-toolkit-'));
    const statePath = join(project, 'caveman-state.json');
    const flagPaths = [join(project, '.caveman-active')];

    const toolkit = createCavemanToolkit({ state: { statePath, flagPaths } });
    const cavemanMode = toolkit.tools.caveman_mode;
    const { context, metadataCalls } = createToolContext('session-1');

    const listResult = await cavemanMode.execute(
      { action: 'list' },
      context as Parameters<typeof cavemanMode.execute>[1],
    );
    expect(listResult).toContain('Modes: normal, lite, full, ultra');

    const setResult = await cavemanMode.execute(
      { action: 'set', mode: 'review' },
      context as Parameters<typeof cavemanMode.execute>[1],
    );
    expect(setResult).toBe('Session review. Default ultra.');

    const getResult = await cavemanMode.execute(
      { action: 'get' },
      context as Parameters<typeof cavemanMode.execute>[1],
    );
    expect(getResult).toBe('Session review. Default ultra.');

    const clearResult = await cavemanMode.execute(
      { action: 'clear' },
      context as Parameters<typeof cavemanMode.execute>[1],
    );
    expect(clearResult).toBe(
      'Session inherits default. Active ultra. Default ultra.',
    );

    const setDefaultResult = await cavemanMode.execute(
      { action: 'set-default', mode: 'commit' },
      context as Parameters<typeof cavemanMode.execute>[1],
    );
    expect(setDefaultResult).toBe('Default commit. Session commit.');

    const resetDefaultResult = await cavemanMode.execute(
      { action: 'reset-default' },
      context as Parameters<typeof cavemanMode.execute>[1],
    );
    expect(resetDefaultResult).toBe('Default ultra. Session ultra.');

    expect(metadataCalls.length).toBeGreaterThan(0);
  });

  test('event/chat/system hooks mirror local plugin behavior', async () => {
    const project = mkdtempSync(join(tmpdir(), 'caveman-toolkit-'));
    const statePath = join(project, 'caveman-state.json');
    const opencodeFlag = join(project, '.caveman-active');
    const legacyFlag = join(project, '.legacy-caveman-active');
    const toolkit = createCavemanToolkit({
      state: {
        statePath,
        flagPaths: [opencodeFlag, legacyFlag],
      },
    });

    await toolkit.handleEvent({
      event: {
        type: 'session.created',
      },
    });
    expect(existsSync(opencodeFlag)).toBe(true);
    expect(readFileSync(opencodeFlag, 'utf8')).toBe('ultra');

    await toolkit.handleChatMessage(
      { sessionID: 'session-1' },
      { parts: [{ type: 'text', text: 'disable caveman now' }] },
    );

    const output = { system: ['base system'] };
    await toolkit.handleSystemTransform({ sessionID: 'session-1' }, output);
    expect(output.system.length).toBe(1);

    await toolkit.handleChatMessage(
      { sessionID: 'session-1' },
      { parts: [{ type: 'text', text: 'resume caveman' }] },
    );

    const resumedOutput = { system: ['base system'] };
    await toolkit.handleSystemTransform(
      { sessionID: 'session-1' },
      resumedOutput,
    );
    expect(resumedOutput.system.length).toBe(2);
    expect(resumedOutput.system[1]).toContain('CAVEMAN MODE ACTIVE: ULTRA.');

    await toolkit.handleEvent({
      event: {
        type: 'session.deleted',
        properties: { info: { id: 'session-1' } },
      },
    });

    const statusContext = createToolContext('session-1');
    const status = await toolkit.tools.caveman_mode.execute(
      { action: 'get' },
      statusContext.context as Parameters<
        typeof toolkit.tools.caveman_mode.execute
      >[1],
    );
    expect(status).toBe('Session ultra (inherits default). Default ultra.');
  });
});
