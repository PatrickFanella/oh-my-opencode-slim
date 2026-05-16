import { describe, expect, test } from 'bun:test';
import { mkdtempSync } from 'node:fs';
import { homedir, tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  defaultReviewState,
  loadReviewState,
  REVIEW_STATE_PATH,
  saveReviewState,
} from './state';

describe('review state', () => {
  test('uses compatibility state path', () => {
    expect(REVIEW_STATE_PATH).toBe(
      join(homedir(), '.config', 'opencode', 'review-tools-state.json'),
    );
  });

  test('loads defaults when state file is missing', () => {
    const project = mkdtempSync(join(tmpdir(), 'review-state-'));
    const statePath = join(project, 'missing.json');

    expect(loadReviewState({ statePath })).toEqual(defaultReviewState());
  });

  test('saves and reloads state from injected path', () => {
    const project = mkdtempSync(join(tmpdir(), 'review-state-'));
    const statePath = join(project, 'review-tools-state.json');
    const expected = {
      autoReview: true,
      lastNotifiedAt: '2026-05-16T00:00:00.000Z',
      lastNotifiedFingerprint: 'abc123',
    };

    saveReviewState(expected, { statePath });

    expect(loadReviewState({ statePath })).toEqual(expected);
  });
});
