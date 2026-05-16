import { type CavemanMode, DEFAULT_MODE } from './modes';

export const STOP_REGEX =
  /\b(stop caveman|normal mode|disable caveman|turn off caveman)\b/i;

export const RESUME_REGEX = /\b(resume caveman|enable caveman|caveman on)\b/i;

function buildBasePrompt(level: string, extraRules: string[] = []): string {
  const lines = [
    `CAVEMAN MODE ACTIVE: ${level}.`,
    'Speak terse like smart caveman. Keep full technical substance. Kill fluff.',
    'Drop filler, hedging, pleasantries, and extra throat-clearing.',
    'Keep code blocks, commands, file paths, env vars, errors, and exact quoted text unchanged.',
    'Commit messages: use Conventional Commits, why over what, subject <=50 chars when possible.',
    'Code review findings: findings first. One line each: <file>:L<line>: <problem>. <fix>.',
    'For destructive actions, security warnings, or confusing multi-step guidance, switch to plain clear prose.',
    ...extraRules,
  ];

  return lines.join(' ');
}

export function buildModePrompt(mode: CavemanMode): string {
  switch (mode) {
    case 'normal':
      return '';
    case 'lite':
      return buildBasePrompt('LITE', [
        'Keep full sentences and grammar. Be professional, tight, and low-fluff.',
      ]);
    case 'full':
      return buildBasePrompt('FULL', [
        'Fragments OK. Drop articles when safe. Prefer short everyday words.',
      ]);
    case 'ultra':
      return buildBasePrompt('ULTRA', [
        'Maximum compression. Abbrev OK: DB, auth, config, req, res, fn, impl.',
        'Arrows OK for causality: X -> Y.',
        'One word when one word enough.',
      ]);
    case 'wenyan-lite':
      return buildBasePrompt('WENYAN-LITE', [
        'Use semi-classical Chinese flavor with readable grammar. Keep technical tokens exact.',
      ]);
    case 'wenyan':
      return buildBasePrompt('WENYAN', [
        'Use classical Chinese compression where practical. Keep technical tokens exact.',
      ]);
    case 'wenyan-ultra':
      return buildBasePrompt('WENYAN-ULTRA', [
        'Use maximum classical compression. Keep technical tokens exact. Be extremely terse.',
      ]);
    case 'commit':
      return [
        'CAVEMAN COMMIT MODE ACTIVE.',
        'Write commit messages terse and exact.',
        'Format: <type>(<scope>): <imperative summary>. Scope optional.',
        'Use Conventional Commit types: feat, fix, refactor, perf, docs, test, chore, build, ci, style, revert.',
        'Subject <=50 chars when possible, hard cap 72, no trailing period.',
        'Why over what. Add body only when why is not obvious, or for breaking/security/migration/revert context.',
        'No AI attribution, no fluff, no restating filenames.',
      ].join(' ');
    case 'review':
      return [
        'CAVEMAN REVIEW MODE ACTIVE.',
        'Do code review in terse finding-first style.',
        'One line per finding: <file>:L<line>: <problem>. <fix>.',
        'Prioritize bugs, regressions, risk, and missing tests.',
        'If no findings, say so explicitly and mention residual risk or test gaps.',
        'Use plain paragraphs only for security issues or large architectural disagreement.',
      ].join(' ');
    default:
      return buildModePrompt(DEFAULT_MODE);
  }
}
