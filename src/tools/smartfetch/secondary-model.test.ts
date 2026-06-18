import { afterEach, describe, expect, mock, test } from 'bun:test';
import { runSecondaryModelWithFallback } from './secondary-model';
import type { SecondaryModel } from './types';

type PromptStep = {
  text?: string;
  error?: Error;
};

type DeleteStep = {
  error?: Error;
};

function createMockClient(steps: PromptStep[], deleteSteps: DeleteStep[] = []) {
  let createCount = 0;
  let promptCount = 0;
  let deleteCount = 0;

  return {
    session: {
      create: mock(async () => ({ id: `session-${createCount++}` })),
      prompt: mock(async () => {
        const step = steps[promptCount++] ?? {};
        if (step.error) {
          throw step.error;
        }
        return {
          data: {
            parts: [{ type: 'text', text: step.text ?? '' }],
          },
        };
      }),
      delete: mock(async () => {
        const step = deleteSteps[deleteCount++] ?? {};
        if (step.error) {
          throw step.error;
        }
        return {};
      }),
    },
    tool: {
      ids: mock(async () => ({ data: ['read', 'bash'] })),
    },
  } as any;
}

describe('smartfetch/secondary-model', () => {
  const models: SecondaryModel[] = [
    { providerID: 'provider-a', modelID: 'small' },
    { providerID: 'provider-b', modelID: 'fallback' },
  ];

  afterEach(() => {
    mock.restore();
  });

  test('falls back when the first model returns empty text', async () => {
    const client = createMockClient([
      { text: '   ' },
      { text: 'Useful answer' },
    ]);

    const result = await runSecondaryModelWithFallback(
      client,
      '/tmp/project',
      models,
      'Summarize the page',
      'This is enough fetched content to clear the short-content guard.',
    );

    expect(result.text).toBe('Useful answer');
    expect(result.model).toEqual(models[1]);
    expect(client.session.prompt).toHaveBeenCalledTimes(2);
    expect(client.session.delete).toHaveBeenCalledTimes(2);
  });

  test('falls back when the first model throws', async () => {
    const client = createMockClient([
      { error: new Error('primary failed') },
      { text: 'Recovered answer' },
    ]);

    const result = await runSecondaryModelWithFallback(
      client,
      '/tmp/project',
      models,
      'Extract the answer',
      'This is enough fetched content to clear the short-content guard.',
    );

    expect(result.text).toBe('Recovered answer');
    expect(result.model).toEqual(models[1]);
    expect(client.session.prompt).toHaveBeenCalledTimes(2);
    expect(client.session.delete).toHaveBeenCalledTimes(2);
  });

  test('retries temporary session cleanup before falling back', async () => {
    const client = createMockClient(
      [{ error: new Error('primary failed') }, { text: 'Recovered answer' }],
      [{ error: new Error('delete failed') }, {}, {}],
    );

    const result = await runSecondaryModelWithFallback(
      client,
      '/tmp/project',
      models,
      'Extract the answer',
      'This is enough fetched content to clear the short-content guard.',
    );

    expect(result.text).toBe('Recovered answer');
    expect(result.model).toEqual(models[1]);
    expect(client.session.prompt).toHaveBeenCalledTimes(2);
    expect(client.session.delete).toHaveBeenCalledTimes(3);
  });

  test('cleanup retry exhaustion does not mask successful secondary output', async () => {
    const warn = mock(() => {});
    const originalWarn = console.warn;
    console.warn = warn;
    try {
      const client = createMockClient(
        [{ text: 'Useful answer' }],
        [
          { error: new Error('delete failed 1') },
          { error: new Error('delete failed 2') },
          { error: new Error('delete failed 3') },
        ],
      );

      const result = await runSecondaryModelWithFallback(
        client,
        '/tmp/project',
        models,
        'Summarize the page',
        'This is enough fetched content to clear the short-content guard.',
      );

      expect(result.text).toBe('Useful answer');
      expect(client.session.delete).toHaveBeenCalledTimes(3);
      expect(warn).toHaveBeenCalledTimes(1);
    } finally {
      console.warn = originalWarn;
    }
  });
});
