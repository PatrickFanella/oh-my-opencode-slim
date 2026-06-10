import type { DiagnosticLevel, TaskRunStatus } from '../types';

type BadgeTone =
  | DiagnosticLevel
  | TaskRunStatus
  | 'enabled'
  | 'disabled'
  | 'healthy'
  | 'degraded'
  | 'unavailable'
  | 'neutral';

const TONES: Record<BadgeTone, string> = {
  cancelled: 'border-slate-400/30 bg-slate-400/10 text-slate-300',
  completed: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200',
  disabled: 'border-slate-500/30 bg-slate-500/10 text-slate-400',
  degraded: 'border-amber-400/30 bg-amber-400/10 text-amber-200',
  enabled: 'border-sky-400/30 bg-sky-400/10 text-sky-200',
  error: 'border-rose-400/30 bg-rose-400/10 text-rose-200',
  failed: 'border-rose-400/30 bg-rose-400/10 text-rose-200',
  info: 'border-sky-400/30 bg-sky-400/10 text-sky-200',
  healthy: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200',
  neutral: 'border-white/10 bg-white/[0.06] text-slate-300',
  pending: 'border-amber-400/30 bg-amber-400/10 text-amber-200',
  running: 'border-cyan-400/30 bg-cyan-400/10 text-cyan-200',
  unknown: 'border-slate-400/30 bg-slate-400/10 text-slate-300',
  warning: 'border-amber-400/30 bg-amber-400/10 text-amber-200',
  unavailable: 'border-slate-400/30 bg-slate-400/10 text-slate-300',
};

export function StatusBadge({
  children,
  tone = 'neutral',
}: {
  children: string;
  tone?: BadgeTone;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${TONES[tone]}`}
    >
      {children}
    </span>
  );
}
