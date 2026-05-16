import { describe, expect, test } from 'bun:test';
import { renderBoardPromptSection } from './board-prompts';
import { createBoardRegistry } from './board-registry';

describe('renderBoardPromptSection', () => {
  test('returns empty string when board is disabled', () => {
    expect(renderBoardPromptSection(createBoardRegistry(undefined))).toBe('');
  });

  test('returns empty string when board mode is off', () => {
    const registry = createBoardRegistry({
      enabled: true,
      defaultMode: 'off',
      councilEscalation: true,
      roles: {
        backend: {
          title: 'Backend Architect',
          purpose: 'API design',
          when: ['API'],
          outputs: ['recommendation'],
          agent: 'backend-architect',
          priority: 70,
        },
      },
    });

    expect(renderBoardPromptSection(registry)).toBe('');
  });

  test('renders compact role routing section', () => {
    const registry = createBoardRegistry({
      enabled: true,
      defaultMode: 'route',
      councilEscalation: true,
      roles: {
        'backend-architect': {
          title: 'Backend Architect',
          purpose: 'API and service-boundary design',
          when: ['API contract changes'],
          outputs: ['recommendation', 'risks'],
          agent: 'backend-architect',
          priority: 80,
        },
      },
    });

    const section = renderBoardPromptSection(registry);

    expect(section).toContain('<Board Runtime>');
    expect(section).toContain('@backend-architect');
    expect(section).toContain('API contract changes');
    expect(section).toContain('</Board Runtime>');
  });
});
