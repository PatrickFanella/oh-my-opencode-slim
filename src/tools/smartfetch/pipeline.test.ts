import { describe, expect, test } from 'bun:test';
import { MAX_BINARY_DOWNLOAD_BYTES, MAX_RESPONSE_BYTES } from './constants';
import { normalizeUrl } from './network';
import { createSmartfetchRequestPlan } from './pipeline';

describe('smartfetch/pipeline', () => {
  test('plans docs-like llms probing with expanded permissions', () => {
    const plan = createSmartfetchRequestPlan({
      url: 'https://docs.example.com/page',
      preferLlmsTxt: 'auto',
      extractMain: true,
      saveBinary: false,
      normalized: normalizeUrl('https://docs.example.com/page'),
    });

    expect(plan.shouldProbeLlmsTxt).toBe(true);
    expect(plan.permissionPatterns).toEqual([
      'https://docs.example.com/page',
      'https://docs.example.com/llms-full.txt',
      'https://docs.example.com/llms.txt',
    ]);
    expect(plan.allowedOrigins).toEqual(new Set(['https://docs.example.com']));
    expect(plan.binaryDownloadLimit).toBe(MAX_BINARY_DOWNLOAD_BYTES);
  });

  test('skips llms probing for non-docs urls unless forced', () => {
    const plan = createSmartfetchRequestPlan({
      url: 'https://example.com/page',
      preferLlmsTxt: 'auto',
      extractMain: true,
      saveBinary: true,
      normalized: normalizeUrl('https://example.com/page'),
    });

    expect(plan.shouldProbeLlmsTxt).toBe(false);
    expect(plan.permissionPatterns).toEqual(['https://example.com/page']);
    expect(plan.binaryDownloadLimit).toBe(MAX_RESPONSE_BYTES);
  });

  test('preserves http fallback permission patterns', () => {
    const plan = createSmartfetchRequestPlan({
      url: 'http://docs.example.com/page',
      preferLlmsTxt: 'always',
      extractMain: true,
      saveBinary: false,
      normalized: normalizeUrl('http://docs.example.com/page'),
    });

    expect(plan.permissionPatterns).toEqual([
      'https://docs.example.com/page',
      'http://docs.example.com/page',
      'https://docs.example.com/llms-full.txt',
      'https://docs.example.com/llms.txt',
      'http://docs.example.com/llms-full.txt',
      'http://docs.example.com/llms.txt',
    ]);
    expect(plan.allowedOrigins).toEqual(
      new Set(['https://docs.example.com', 'http://docs.example.com']),
    );
  });
});
