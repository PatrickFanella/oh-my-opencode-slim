import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import {
  formatSidebarModelName,
  getDefaultSidebarCollapseState,
  getHomePanelLayout,
  getSidebarAgentNames,
  getSidebarAgentSections,
  getSidebarDisplaySections,
  normalizeSidebarCollapseState,
  readConfigInvalid,
} from './tui';
import type { TuiSnapshot } from './tui-state';

function createSnapshot(overrides: Partial<TuiSnapshot> = {}): TuiSnapshot {
  return {
    version: 1,
    updatedAt: 0,
    agentModels: {},
    agents: [],
    ...overrides,
  };
}

describe('tui sidebar agents', () => {
  test('hides disabled agents when models are persisted explicitly', () => {
    const agentNames = getSidebarAgentNames(
      createSnapshot({
        agentModels: {
          explorer: 'openai/gpt-5.4-mini',
          fixer: 'openai/gpt-5.4-mini',
        },
      }),
    );

    expect(agentNames).toEqual(['explorer', 'fixer']);
    expect(agentNames).not.toContain('observer');
    expect(agentNames).not.toContain('librarian');
  });

  test('uses default-enabled fallback before models are persisted', () => {
    const agentNames = getSidebarAgentNames(createSnapshot({}));

    expect(agentNames).toContain('explorer');
    expect(agentNames).toContain('fixer');
    expect(agentNames).not.toContain('observer');
    expect(agentNames).not.toContain('council');
    expect(agentNames).not.toContain('councillor');
  });

  test('groups full-board agents with display handles first', () => {
    const sections = getSidebarAgentSections(
      createSnapshot({
        preset: 'openai',
        agents: [
          {
            name: 'orchestrator',
            model: 'openai/gpt-5.5',
            mode: 'primary',
            source: 'core',
          },
          {
            name: 'backend-architect',
            displayName: 'api-forge',
            model: 'openai/gpt-5.5',
            mode: 'subagent',
            source: 'custom',
          },
          {
            name: 'database-advisor',
            displayName: 'data-vault',
            model: 'openai/gpt-5.5',
            mode: 'subagent',
            source: 'custom',
          },
        ],
      }),
    );

    expect(sections[0]?.title).toBe('CORE BOARD');
    expect(sections[0]?.rows[0]?.handle).toBe('orchestrator');
    expect(sections.map((section) => section.title)).toContain('BUILD');
    expect(sections.map((section) => section.title)).toContain('OPS');
    expect(
      sections.flatMap((section) => section.rows.map((row) => row.handle)),
    ).toContain('api-forge');
    expect(
      sections.flatMap((section) => section.rows.map((row) => row.handle)),
    ).toContain('data-vault');
  });

  test('defaults to compact sidebar with custom sections collapsed', () => {
    const snapshot = createSnapshot({
      agents: [
        {
          name: 'orchestrator',
          model: 'openai/gpt-5.5',
          mode: 'primary',
          source: 'core',
        },
        {
          name: 'backend-architect',
          displayName: 'api-forge',
          model: 'openai/gpt-5.5',
          mode: 'subagent',
          source: 'custom',
        },
      ],
    });
    const sections = getSidebarDisplaySections(
      snapshot,
      getDefaultSidebarCollapseState(),
    );

    expect(
      sections.find((section) => section.title === 'CORE BOARD'),
    ).toMatchObject({
      collapsed: false,
      visibleRows: [{ handle: 'orchestrator' }],
    });
    expect(sections.find((section) => section.title === 'BUILD')).toMatchObject(
      {
        collapsed: true,
        rows: [{ handle: 'api-forge' }],
        visibleRows: [],
      },
    );
  });

  test('full sidebar mode expands custom sections', () => {
    const sections = getSidebarDisplaySections(
      createSnapshot({
        agents: [
          {
            name: 'backend-architect',
            displayName: 'api-forge',
            model: 'openai/gpt-5.5',
            mode: 'subagent',
            source: 'custom',
          },
        ],
      }),
      { mode: 'full', collapsedSections: [] },
    );

    expect(sections.find((section) => section.title === 'BUILD')).toMatchObject(
      {
        collapsed: false,
        visibleRows: [{ handle: 'api-forge' }],
      },
    );
  });

  test('minimal and off sidebar modes hide board sections', () => {
    const snapshot = createSnapshot({
      agentModels: { explorer: 'openai/gpt-5.4-mini' },
    });

    expect(
      getSidebarDisplaySections(snapshot, {
        mode: 'minimal',
        collapsedSections: [],
      }),
    ).toEqual([]);
    expect(
      getSidebarDisplaySections(snapshot, {
        mode: 'off',
        collapsedSections: [],
      }),
    ).toEqual([]);
  });

  test('normalizes persisted collapse state safely', () => {
    expect(normalizeSidebarCollapseState({ mode: 'full' })).toEqual({
      mode: 'full',
      collapsedSections: [],
    });
    expect(
      normalizeSidebarCollapseState({
        mode: 'nope',
        collapsedSections: ['BUILD', 'BUILD', 42],
      }),
    ).toEqual({ mode: 'compact', collapsedSections: ['BUILD'] });
  });
});

describe('formatSidebarModelName', () => {
  test('keeps only the segment after the last slash', () => {
    expect(formatSidebarModelName('openai/gpt-5.5-fast')).toBe('gpt-5.5-fast');
    expect(
      formatSidebarModelName(
        'fireworks-ai/accounts/fireworks/routers/kimi-k2p5-turbo',
      ),
    ).toBe('kimi-k2p5-turbo');
  });

  test('leaves model names without slashes unchanged', () => {
    expect(formatSidebarModelName('pending')).toBe('pending');
  });
});

describe('getHomePanelLayout', () => {
  test('right-aligns the home board card by default', () => {
    const layout = getHomePanelLayout();

    expect(layout.wrapper).toMatchObject({
      width: '100%',
      flexDirection: 'row',
      justifyContent: 'flex-end',
    });
    expect(layout.panel).toMatchObject({
      width: '100%',
      maxWidth: 82,
      flexDirection: 'column',
    });
  });

  test('can center the home board card if placement changes', () => {
    const layout = getHomePanelLayout('center');

    expect(layout.wrapper).toMatchObject({ justifyContent: 'center' });
  });
});

describe('readConfigInvalid', () => {
  let originalEnv: typeof process.env;
  let configHome: string;

  beforeEach(() => {
    originalEnv = { ...process.env };
    // Isolate from real user config and env presets
    delete process.env.OPENCODE_CONFIG_DIR;
    delete process.env.BLACKTOWER_PRESET;
    configHome = fs.mkdtempSync(path.join(os.tmpdir(), 'blacktower-tui-env-'));
    process.env.XDG_CONFIG_HOME = configHome;
  });

  afterEach(() => {
    fs.rmSync(configHome, { recursive: true, force: true });
    process.env = originalEnv;
  });

  test('detects invalid config from the current directory without persisted state', () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'blacktower-tui-'));
    try {
      const projectDir = path.join(tempDir, 'project');
      const configDir = path.join(projectDir, '.opencode');
      fs.mkdirSync(configDir, { recursive: true });
      fs.writeFileSync(
        path.join(configDir, 'blacktower.json'),
        JSON.stringify({ agents: { oracle: { temperature: 5 } } }),
      );

      expect(readConfigInvalid(projectDir)).toBe(true);
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  test('returns false for valid config', () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'blacktower-tui-'));
    try {
      const projectDir = path.join(tempDir, 'project');
      const configDir = path.join(projectDir, '.opencode');
      fs.mkdirSync(configDir, { recursive: true });
      fs.writeFileSync(
        path.join(configDir, 'blacktower.json'),
        JSON.stringify({ agents: { oracle: { model: 'valid/model' } } }),
      );

      expect(readConfigInvalid(projectDir)).toBe(false);
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });
});
