import { assertShellRunner, type ShellRunner } from './github/helpers';

type ToolExecuteBeforeInput = {
  tool?: string;
};

type ToolExecuteBeforeOutput = {
  args?: unknown;
};

type MutableArgs = Record<string, unknown>;

function resolveShellRunner($: unknown): ShellRunner {
  try {
    return assertShellRunner($);
  } catch {
    throw new Error('RTK toolkit requires OpenCode shell runner.');
  }
}

async function hasRtkBinary($: ShellRunner): Promise<boolean> {
  try {
    await $`which rtk`.quiet();
    return true;
  } catch {
    return false;
  }
}

export type RtkToolkit = {
  handleToolExecuteBefore: (
    input: ToolExecuteBeforeInput,
    output: ToolExecuteBeforeOutput,
  ) => Promise<void>;
};

export async function createRtkToolkit({
  $,
}: {
  $: unknown;
}): Promise<RtkToolkit | undefined> {
  const shellRunner = resolveShellRunner($);
  const enabled = await hasRtkBinary(shellRunner);

  if (!enabled) {
    return undefined;
  }

  async function handleToolExecuteBefore(
    input: ToolExecuteBeforeInput,
    output: ToolExecuteBeforeOutput,
  ): Promise<void> {
    try {
      const tool = String(input.tool ?? '').toLowerCase();
      if (tool !== 'bash' && tool !== 'shell') {
        return;
      }

      if (!output.args || typeof output.args !== 'object') {
        return;
      }

      const args = output.args as MutableArgs;
      const command = args.command;
      if (typeof command !== 'string' || !command) {
        return;
      }

      const result = await shellRunner`rtk rewrite ${command}`
        .nothrow()
        .quiet();
      const rewritten = String(result.stdout ?? '').trim();

      if (rewritten && rewritten !== command) {
        args.command = rewritten;
      }
    } catch {
      // fail open
    }
  }

  return { handleToolExecuteBefore };
}
