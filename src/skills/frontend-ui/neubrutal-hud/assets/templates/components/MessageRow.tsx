import { cn } from './cn-utility';

export function MessageRow({
  speaker, role, body, index, context, align, roleColor,
}: {
  speaker: string; role: string; body: string; index: number; context: string;
  align: 'left' | 'right'; roleColor: string;
}) {
  const isRight = align === 'right';
  return (
    <article className={cn('flex w-full py-1', isRight ? 'justify-end text-right' : 'justify-start text-left')}>
      <div
        className={cn('max-w-[88%] border-l-2 pl-3', isRight && 'border-l-0 border-r-2 pl-0 pr-3')}
        style={{ borderColor: roleColor }}
      >
        <p className="text-xs font-semibold" style={{ color: roleColor }}>
          [{role.slice(0, 5).toUpperCase()}]{' '}
          <span className="text-[hsl(var(--ink))]">{speaker}</span>
        </p>
        <p className="text-2xs uppercase tracking-[0.1em] text-[hsl(var(--ink-mute))] mt-0.5">
          #{index} · {context}
        </p>
        <p className="mt-1 text-sm leading-relaxed text-[hsl(var(--ink-dim))]">{body}</p>
      </div>
    </article>
  );
}
