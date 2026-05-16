import { describe, expect, test } from 'bun:test';
import { buildModePrompt, RESUME_REGEX, STOP_REGEX } from './prompts';

describe('caveman prompts', () => {
  test('renders no prompt for normal mode', () => {
    expect(buildModePrompt('normal')).toBe('');
  });

  test('renders ultra mode prompt', () => {
    const prompt = buildModePrompt('ultra');
    expect(prompt).toContain('CAVEMAN MODE ACTIVE: ULTRA.');
    expect(prompt).toContain('Maximum compression.');
  });

  test('renders commit and review mode prompts', () => {
    expect(buildModePrompt('commit')).toContain('CAVEMAN COMMIT MODE ACTIVE.');
    expect(buildModePrompt('review')).toContain('CAVEMAN REVIEW MODE ACTIVE.');
  });

  test('stop and resume regex match local phrases', () => {
    expect(STOP_REGEX.test('please disable caveman for now')).toBe(true);
    expect(RESUME_REGEX.test('ok resume caveman')).toBe(true);
  });
});
