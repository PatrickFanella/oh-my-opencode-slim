import { cn } from './cn-utility';

export type Member = {
  id: string;
  label: string;
  status: 'Active' | 'Mixed' | 'Pending' | 'Inactive' | 'Unknown';
  note: string;
};

export function MemberRow({ member }: { member: Member }) {
  const dotColor =
    member.status === 'Active' ? 'confirm'
    : member.status === 'Mixed' ? 'caution'
    : member.status === 'Pending' ? 'pulse'
    : member.status === 'Inactive' ? 'alert'
    : 'signal';
  return (
    <div className="flex items-center gap-2 py-1 border-b border-[hsl(var(--border-faint)/0.4)] last:border-0">
      <span className={cn('size-2', `bg-[hsl(var(--${dotColor}))]`)} aria-hidden="true" />
      <span className="text-2xs text-[hsl(var(--ink-mute))] w-7">{member.label}</span>
      <span className="text-xs text-[hsl(var(--ink))] flex-1 truncate">{member.status}</span>
      <span className="text-2xs text-[hsl(var(--ink-dim))] hidden sm:inline">{member.note}</span>
    </div>
  );
}
