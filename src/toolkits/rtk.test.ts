import { describe, expect, test } from 'bun:test';
import { createRtkToolkit } from './rtk';

type FakeShellResult = {
  stdout?: string;
  stderr?: string;
};

type FakeShellBehavior = {
  throwOnQuiet?: boolean;
  result?: FakeShellResult;
};

function createFakeShell(
  behaviorByCommand: Record<string, FakeShellBehavior> = {},
): {
  $: unknown;
  calls: string[];
} {
  const calls: string[] = [];

  const runner = (
    strings: TemplateStringsArray,
    ...values: unknown[]
  ): {
    nothrow(): { quiet(): Promise<FakeShellResult> };
    quiet(): Promise<FakeShellResult>;
  } => {
    let command = strings[0] ?? '';
    for (const [index, value] of values.entries()) {
      command += String(value);
      command += strings[index + 1] ?? '';
    }

    calls.push(command);
    const behavior = behaviorByCommand[command] ?? {};

    const quiet = async (): Promise<FakeShellResult> => {
      if (behavior.throwOnQuiet) {
        throw new Error(`quiet failed for ${command}`);
      }

      return behavior.result ?? { stdout: '', stderr: '' };
    };

    return {
      nothrow() {
        return { quiet };
      },
      quiet,
    };
  };

  return { $: runner, calls };
}

describe('rtk toolkit', () => {
  test('returns undefined when rtk binary is missing', async () => {
    const fakeShell = createFakeShell({
      'which rtk': { throwOnQuiet: true },
    });

    const toolkit = await createRtkToolkit({ $: fakeShell.$ });

    expect(toolkit).toBeUndefined();
  });

  test('no-op for non-shell tools', async () => {
    const fakeShell = createFakeShell({
      'which rtk': { result: { stdout: '/usr/bin/rtk\n' } },
    });
    const toolkit = await createRtkToolkit({ $: fakeShell.$ });

    const output = { args: { command: 'echo hi' } };
    await toolkit?.handleToolExecuteBefore({ tool: 'read' }, output);

    expect(output.args.command).toBe('echo hi');
    expect(fakeShell.calls).toEqual(['which rtk']);
  });

  test('unchanged rewrite keeps original command', async () => {
    const fakeShell = createFakeShell({
      'which rtk': { result: { stdout: '/usr/bin/rtk\n' } },
      'rtk rewrite ls -la': { result: { stdout: 'ls -la\n' } },
    });
    const toolkit = await createRtkToolkit({ $: fakeShell.$ });

    const output = { args: { command: 'ls -la' } };
    await toolkit?.handleToolExecuteBefore({ tool: 'bash' }, output);

    expect(output.args.command).toBe('ls -la');
  });

  test('changed rewrite updates command', async () => {
    const fakeShell = createFakeShell({
      'which rtk': { result: { stdout: '/usr/bin/rtk\n' } },
      'rtk rewrite npm test': { result: { stdout: 'bun test\n' } },
    });
    const toolkit = await createRtkToolkit({ $: fakeShell.$ });

    const output = { args: { command: 'npm test' } };
    await toolkit?.handleToolExecuteBefore({ tool: 'shell' }, output);

    expect(output.args.command).toBe('bun test');
  });

  test('rewrite failure is fail-open', async () => {
    const fakeShell = createFakeShell({
      'which rtk': { result: { stdout: '/usr/bin/rtk\n' } },
      'rtk rewrite npm test': { throwOnQuiet: true },
    });
    const toolkit = await createRtkToolkit({ $: fakeShell.$ });

    const output = { args: { command: 'npm test' } };

    await expect(
      toolkit?.handleToolExecuteBefore({ tool: 'bash' }, output),
    ).resolves.toBeUndefined();
    expect(output.args.command).toBe('npm test');
  });
});
