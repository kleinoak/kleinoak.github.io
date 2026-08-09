import { ReactNode } from "react";

type Tone = "gold" | "neutral" | "success" | "warning";

const toneClasses: Record<Tone, string> = {
  gold: "bg-accent/15 text-accent-strong",
  neutral: "bg-black/5 text-text-muted",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
};

export function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: Tone;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-sm px-2.5 py-1 text-xs font-semibold uppercase tracking-wide ${toneClasses[tone]}`}
    >
      {children}
    </span>
  );
}
