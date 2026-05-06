import { cn } from "@/lib/utils";

type Props = {
  code: string;
  className?: string;
  withDot?: boolean;
};

export function RoomBadge({ code, className, withDot = false }: Props) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-full bg-bg-tertiary px-3 py-1.5",
        "font-mono text-xs font-medium tracking-wide text-fg-secondary",
        className,
      )}
    >
      {withDot && <span className="size-1.5 rounded-full bg-accent-cyan" aria-hidden />}
      <span>Sala {code}</span>
    </div>
  );
}
