export type BackgroundJobState =
  | 'pending'
  | 'running'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'cancelling'
  | 'unknown'
  | 'reconciled';

export type BackgroundJobSource =
  | 'task'
  | 'subtask'
  | 'council'
  | 'native-background';

export interface BackgroundJobRecord {
  taskID: string;
  parentSessionID: string;
  alias: string;
  agent: string;
  description: string;
  objective: string;
  source: BackgroundJobSource;
  state: BackgroundJobState;
  createdAt: number;
  updatedAt: number;
  cancellationRequested: boolean;
  timedOut: boolean;
  statusUncertain: boolean;
  terminalUnreconciled: boolean;
  lastError?: string;
  resultSummary?: string;
  contextFiles: string[];
}

export type BackgroundJobLaunchInput = Omit<
  BackgroundJobRecord,
  | 'alias'
  | 'state'
  | 'createdAt'
  | 'updatedAt'
  | 'cancellationRequested'
  | 'timedOut'
  | 'statusUncertain'
  | 'terminalUnreconciled'
  | 'contextFiles'
> & {
  contextFiles?: string[];
};

export interface BackgroundJobStateDetails {
  lastError?: string;
  resultSummary?: string;
  timedOut?: boolean;
  statusUncertain?: boolean;
  terminalUnreconciled?: boolean;
  contextFiles?: string[];
}

const AGENT_PREFIXES: Record<string, string> = {
  council: 'cou',
  councillor: 'cou',
  designer: 'des',
  explorer: 'exp',
  fixer: 'fix',
  librarian: 'lib',
  observer: 'obs',
  oracle: 'ora',
  orchestrator: 'orc',
};

const TERMINAL_STATES = new Set<BackgroundJobState>([
  'completed',
  'failed',
  'cancelled',
]);

function prefixForAgent(agent: string): string {
  const normalized = agent.trim().toLowerCase();
  return AGENT_PREFIXES[normalized] ?? (normalized.slice(0, 3) || 'job');
}

function cloneRecord(record: BackgroundJobRecord): BackgroundJobRecord {
  return {
    ...record,
    contextFiles: [...record.contextFiles],
  };
}

function uniqueFiles(files: string[] | undefined): string[] {
  return [...new Set((files ?? []).filter((file) => file.trim() !== ''))];
}

export class BackgroundJobBoard {
  readonly #jobs = new Map<string, BackgroundJobRecord>();
  readonly #aliasByParent = new Map<string, Map<string, string>>();
  readonly #nextAliasByParentPrefix = new Map<string, number>();

  recordLaunch(input: BackgroundJobLaunchInput): BackgroundJobRecord {
    const existing = this.#jobs.get(input.taskID);
    if (existing) {
      return this.#updateExisting(existing, input);
    }

    const now = Date.now();
    const alias = this.#nextAlias(input.parentSessionID, input.agent);
    const record: BackgroundJobRecord = {
      taskID: input.taskID,
      parentSessionID: input.parentSessionID,
      alias,
      agent: input.agent,
      description: input.description,
      objective: input.objective,
      source: input.source,
      state: 'pending',
      createdAt: now,
      updatedAt: now,
      cancellationRequested: false,
      timedOut: false,
      statusUncertain: false,
      terminalUnreconciled: false,
      lastError: input.lastError,
      resultSummary: input.resultSummary,
      contextFiles: uniqueFiles(input.contextFiles),
    };

    this.#jobs.set(record.taskID, record);
    this.#aliasesForParent(record.parentSessionID).set(
      record.alias,
      record.taskID,
    );

    return cloneRecord(record);
  }

  get(taskID: string): BackgroundJobRecord | undefined {
    const record = this.#jobs.get(taskID);
    return record ? cloneRecord(record) : undefined;
  }

  resolve(
    parentSessionID: string,
    idOrAlias: string,
  ): BackgroundJobRecord | undefined {
    const direct = this.#jobs.get(idOrAlias);
    if (direct?.parentSessionID === parentSessionID) {
      return cloneRecord(direct);
    }

    const taskID = this.#aliasByParent.get(parentSessionID)?.get(idOrAlias);
    if (!taskID) return undefined;

    const record = this.#jobs.get(taskID);
    return record ? cloneRecord(record) : undefined;
  }

  updateState(
    taskID: string,
    state: BackgroundJobState,
    details: BackgroundJobStateDetails = {},
  ): BackgroundJobRecord | undefined {
    const record = this.#jobs.get(taskID);
    if (!record) return undefined;

    record.state = state;
    record.updatedAt = Date.now();
    this.#applyDetails(record, details);
    if (TERMINAL_STATES.has(state)) {
      record.terminalUnreconciled = details.terminalUnreconciled ?? true;
    }

    return cloneRecord(record);
  }

  markCancellationRequested(taskID: string): BackgroundJobRecord | undefined {
    const record = this.#jobs.get(taskID);
    if (!record) return undefined;

    record.cancellationRequested = true;
    record.state = TERMINAL_STATES.has(record.state)
      ? record.state
      : 'cancelling';
    record.updatedAt = Date.now();

    return cloneRecord(record);
  }

  markReconciled(taskID: string): BackgroundJobRecord | undefined {
    const record = this.#jobs.get(taskID);
    if (!record) return undefined;

    record.state = 'reconciled';
    record.terminalUnreconciled = false;
    record.updatedAt = Date.now();

    return cloneRecord(record);
  }

  listForParent(parentSessionID: string): BackgroundJobRecord[] {
    return [...this.#jobs.values()]
      .filter((record) => record.parentSessionID === parentSessionID)
      .sort((left, right) => left.createdAt - right.createdAt)
      .map(cloneRecord);
  }

  removeForParent(parentSessionID: string): void {
    for (const record of this.listForParent(parentSessionID)) {
      this.#jobs.delete(record.taskID);
    }
    this.#aliasByParent.delete(parentSessionID);

    for (const key of this.#nextAliasByParentPrefix.keys()) {
      if (key.startsWith(`${parentSessionID}:`)) {
        this.#nextAliasByParentPrefix.delete(key);
      }
    }
  }

  formatForPrompt(parentSessionID: string): string {
    const jobs = this.listForParent(parentSessionID);
    if (jobs.length === 0) return '';

    return [
      '### Background Jobs',
      ...jobs.map((job) => {
        const flags = [
          job.statusUncertain ? 'uncertain' : undefined,
          job.timedOut ? 'timed out' : undefined,
          job.cancellationRequested ? 'cancellation requested' : undefined,
        ].filter(Boolean);
        const suffix = flags.length ? ` (${flags.join(', ')})` : '';
        return `- ${job.alias} [${job.state}] ${job.agent}: ${job.description}${suffix}`;
      }),
    ].join('\n');
  }

  #updateExisting(
    record: BackgroundJobRecord,
    input: BackgroundJobLaunchInput,
  ): BackgroundJobRecord {
    record.parentSessionID = input.parentSessionID;
    record.agent = input.agent;
    record.description = input.description;
    record.objective = input.objective;
    record.source = input.source;
    record.updatedAt = Date.now();
    record.contextFiles = uniqueFiles([
      ...record.contextFiles,
      ...(input.contextFiles ?? []),
    ]);
    if (input.lastError !== undefined) record.lastError = input.lastError;
    if (input.resultSummary !== undefined) {
      record.resultSummary = input.resultSummary;
    }

    return cloneRecord(record);
  }

  #applyDetails(
    record: BackgroundJobRecord,
    details: BackgroundJobStateDetails,
  ): void {
    if (details.lastError !== undefined) record.lastError = details.lastError;
    if (details.resultSummary !== undefined) {
      record.resultSummary = details.resultSummary;
    }
    if (details.timedOut !== undefined) record.timedOut = details.timedOut;
    if (details.statusUncertain !== undefined) {
      record.statusUncertain = details.statusUncertain;
    }
    if (details.terminalUnreconciled !== undefined) {
      record.terminalUnreconciled = details.terminalUnreconciled;
    }
    if (details.contextFiles !== undefined) {
      record.contextFiles = uniqueFiles([
        ...record.contextFiles,
        ...details.contextFiles,
      ]);
    }
  }

  #nextAlias(parentSessionID: string, agent: string): string {
    const prefix = prefixForAgent(agent);
    const key = `${parentSessionID}:${prefix}`;
    const next = this.#nextAliasByParentPrefix.get(key) ?? 1;
    this.#nextAliasByParentPrefix.set(key, next + 1);
    return `${prefix}-${next}`;
  }

  #aliasesForParent(parentSessionID: string): Map<string, string> {
    let aliases = this.#aliasByParent.get(parentSessionID);
    if (!aliases) {
      aliases = new Map();
      this.#aliasByParent.set(parentSessionID, aliases);
    }
    return aliases;
  }
}
