import { describe, expect, test } from 'bun:test';
import { parseControlCenterArgs } from './control-center';

describe('control-center CLI args', () => {
  test('defaults to TUI mode', () => {
    expect(parseControlCenterArgs([])).toEqual({ tui: true });
  });

  test('parses snapshot and config-dir options', () => {
    expect(
      parseControlCenterArgs([
        '--no-tui',
        '--config-dir=/tmp/opencode',
        '--refresh-interval-ms=1500',
      ]),
    ).toEqual({
      tui: false,
      configDir: '/tmp/opencode',
      refreshIntervalMs: 1500,
    });
  });

  test('json mode disables TUI rendering', () => {
    expect(parseControlCenterArgs(['--json'])).toEqual({
      tui: false,
      json: true,
    });
  });
});
