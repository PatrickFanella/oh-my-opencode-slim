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
    '- Board owns risk-based consultant routing and executor handoff.',
    '- Check board routing before non-trivial implementation: use one clear advisor when a short review can prevent public behavior, compatibility, security, reliability, data, setup UX, user-trust, or support-burden risk; otherwise skip.',
    '- Consultants advise; fixer/self executes bounded edits.',
    '- Keep asks narrow: request blockers, important concerns, and one recommendation; avoid full plans unless needed.',
    '- Prefer one advisor. Use pairings only for clear cross-domain risk or advisor-identified escalation.',
    '- In final summaries for non-trivial work, state Board: used @agent for reason, or Board: skipped because reason.',
    '- If later rework shows a missed board opportunity, propose a tighter routing example.',
    councilLine,
    '',
    ...registry.roles.map(renderRole),
    '</Board Runtime>',
  ].join('\n');
}
