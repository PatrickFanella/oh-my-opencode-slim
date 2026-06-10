import { cn } from './cn-utility';

export function StatusLed({ state }: { state: 'live' | 'sync' | 'ok' | 'warn' | 'dead' }) {
  const map = { live: 'hud-led-live', sync: 'hud-led-sync', ok: 'hud-led-ok', warn: 'hud-led-warn', dead: '' };
  return <span className={cn('hud-led', map[state])} aria-hidden="true" />;
}
