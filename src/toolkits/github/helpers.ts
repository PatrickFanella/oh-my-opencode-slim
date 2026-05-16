type QuietResult = {
  stdout?: string | Uint8Array | null;
  stderr?: string | Uint8Array | null;
};

type QuietShell = {
  nothrow(): QuietShell;
  quiet(): Promise<QuietResult>;
};

export type ShellRunner = (
  strings: TemplateStringsArray,
  ...values: unknown[]
) => QuietShell;

export function assertShellRunner(value: unknown): ShellRunner {
  if (typeof value !== 'function') {
    throw new Error('GitHub toolkit requires OpenCode shell runner.');
  }

  return value as ShellRunner;
}

function outputToString(value: string | Uint8Array | null | undefined): string {
  if (value === null || value === undefined) {
    return '';
  }
  if (typeof value === 'string') {
    return value;
  }
  return new TextDecoder().decode(value);
}

export function shellEscape(value: unknown): string {
  return `'${String(value).replace(/'/g, `'\\''`)}'`;
}

export async function runShell(
  $: ShellRunner,
  command: string,
): Promise<string> {
  const result = await $`bash -lc ${command}`.nothrow().quiet();
  const stdout = outputToString(result.stdout).trim();
  const stderr = outputToString(result.stderr).trim();
  return stdout || stderr || '';
}

export async function resolvePrSelector(
  $: ShellRunner,
  prNumber?: number | string | null,
): Promise<string | null> {
  if (prNumber !== null && prNumber !== undefined && `${prNumber}`.trim()) {
    return String(prNumber);
  }

  const current = await runShell(
    $,
    "gh pr view --json number --jq '.number' 2>/dev/null",
  );
  if (/^\d+$/.test(current)) {
    return current;
  }

  const branch = await runShell($, 'git rev-parse --abbrev-ref HEAD');
  if (!branch) {
    return null;
  }

  const branchPr = await runShell(
    $,
    `gh pr list --head ${shellEscape(branch)} --json number --jq '.[0].number' 2>/dev/null`,
  );

  return /^\d+$/.test(branchPr) ? branchPr : null;
}

export function buildIncludeArg(raw?: string): string {
  if (!raw) {
    return '';
  }
  const value = String(raw).trim();
  if (!value) {
    return '';
  }

  if (value.includes('*') || value.includes('{') || value.includes('/')) {
    return ` -g ${shellEscape(value)}`;
  }

  if (value.includes(',')) {
    return value
      .split(',')
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => ` -g ${shellEscape(`*.${part.replace(/^\./, '')}`)}`)
      .join('');
  }

  if (value === 'test') {
    return ` -g ${shellEscape('*.test.*')} -g ${shellEscape('*.spec.*')}`;
  }

  return ` -g ${shellEscape(`*.${value.replace(/^\./, '')}`)}`;
}

export function repoFlag(repo?: string): string {
  return repo ? ` --repo ${shellEscape(repo)}` : '';
}

export function optionalFlag(flag: string, value?: string): string {
  return value !== undefined && value !== null && String(value).trim() !== ''
    ? ` ${flag} ${shellEscape(String(value))}`
    : '';
}

export function buildTree(text: string, depth: number): string {
  const seen = new Set<string>();
  const lines: string[] = [];

  for (const raw of text.split(/\r?\n/)) {
    const value = raw.trim();
    if (!value) {
      continue;
    }

    const parts = value.split('/').slice(0, depth);
    const current: string[] = [];

    for (const part of parts) {
      current.push(part);
      const key = current.join('/');
      if (seen.has(key)) {
        continue;
      }
      seen.add(key);
      lines.push(`${'  '.repeat(current.length - 1)}${part}`);
    }
  }

  return lines.join('\n');
}

export type SuiteStatus = {
  auth: string;
  gitRoot: string;
  branch: string;
  remote: string;
  repoInfo: string;
  prSelector: string | null;
  prInfo: string;
  runs: string;
  reviewQueue: string;
};

export async function collectSuiteStatus(
  $: ShellRunner,
  repo?: string,
): Promise<SuiteStatus> {
  const auth = await runShell($, 'gh auth status --active 2>/dev/null');
  const gitRoot = await runShell(
    $,
    'git rev-parse --show-toplevel 2>/dev/null',
  );
  const branch = gitRoot
    ? await runShell($, 'git rev-parse --abbrev-ref HEAD')
    : '';
  const remote = gitRoot
    ? await runShell($, 'git remote get-url origin 2>/dev/null')
    : '';

  const repoInfo = await runShell(
    $,
    `gh repo view${repoFlag(repo)} --json name,owner,visibility,defaultBranchRef --jq '.owner.login + "/" + .name + " | " + .visibility + " | default=" + .defaultBranchRef.name' 2>/dev/null`,
  );

  const prSelector = gitRoot ? await resolvePrSelector($, null) : null;
  const prInfo = prSelector
    ? await runShell(
        $,
        `gh pr view ${prSelector} --json number,title,state,isDraft,reviewDecision --jq '"#" + (.number|tostring) + " " + .title + " | " + .state + " | draft=" + (.isDraft|tostring) + " | review=" + (.reviewDecision // "none")'`,
      )
    : '';

  const runs = await runShell(
    $,
    `gh run list --limit 10${repoFlag(repo)} --json databaseId,workflowName,status,conclusion,headBranch --jq '.[] | select((.status != "completed") or (.conclusion != null and .conclusion != "success")) | "#" + (.databaseId|tostring) + " " + (.workflowName // "workflow") + " | branch=" + (.headBranch // "") + " | status=" + .status + " | conclusion=" + (.conclusion // "none")' 2>/dev/null`,
  );

  const reviewQueue = await runShell(
    $,
    `gh pr list --state open${repoFlag(repo)} --json number,title,isDraft,reviewDecision,updatedAt,author --jq '.[] | select((.isDraft|not) and (.reviewDecision != "APPROVED")) | "#" + (.number|tostring) + " " + .title + " | @" + .author.login + " | review=" + (.reviewDecision // "none") + " | updated=" + .updatedAt' 2>/dev/null`,
  );

  return {
    auth,
    gitRoot,
    branch,
    remote,
    repoInfo,
    prSelector,
    prInfo,
    runs,
    reviewQueue,
  };
}
