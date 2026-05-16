import type { BoardRegistry, BoardRole } from './board-schema';

function renderRole(role: BoardRole): string {
  const when = role.when.length ? role.when.join(' • ') : 'Use when relevant.';
  const outputs = role.outputs.length
    ? role.outputs.join(', ')
    : 'recommendation, risks, next step';

  return [
    `@${role.agent}`,
    `- Role: ${role.title}`,
    `- Purpose: ${role.purpose}`,
    `- Route when: ${when}`,
    `- Output: ${outputs}`,
  ].join('\n');
}

export function renderBoardPromptSection(registry: BoardRegistry): string {
  if (
    !registry.enabled ||
    registry.mode === 'off' ||
    registry.roles.length === 0
  ) {
    return '';
  }

  const councilLine = registry.councilEscalation
    ? '- Escalate to council for high-stakes disagreement or multi-system risk.'
    : '- Do not escalate to council automatically.';

  return [
    '<Board Runtime>',
    `Mode: ${registry.mode}`,
    '- Board owns consultant routing and executor handoff.',
    '- Consultants advise; fixer/self executes bounded edits.',
    councilLine,
    '',
    ...registry.roles.map(renderRole),
    '</Board Runtime>',
  ].join('\n');
}
