import { describe, expect, test } from 'bun:test';
import { parseControlCenterWebArgs } from './control-center-web';

describe('control-center-web CLI args', () => {
  test('defaults to localhost web serving', () => {
    expect(parseControlCenterWebArgs([])).toEqual({
      host: '127.0.0.1',
      port: 47671,
    });
  });

  test('parses host, port, config, api-only, and open flags', () => {
    expect(
      parseControlCenterWebArgs([
        '--host=0.0.0.0',
        '--port=0',
        '--config-dir=/tmp/opencode',
        '--api-only',
        '--allow-network',
        '--open',
      ]),
    ).toEqual({
      allowNetwork: true,
      apiOnly: true,
      configDir: '/tmp/opencode',
      host: '0.0.0.0',
      open: true,
      port: 0,
    });
  });

  test('rejects invalid ports', () => {
    expect(() => parseControlCenterWebArgs(['--port=70000'])).toThrow(
      '--port must be an integer between 0 and 65535',
    );
  });

  test('rejects non-loopback hosts without explicit network opt-in', () => {
    expect(() => parseControlCenterWebArgs(['--host=0.0.0.0'])).toThrow(
      '--host must be a loopback address unless --allow-network is set',
    );
  });
});
