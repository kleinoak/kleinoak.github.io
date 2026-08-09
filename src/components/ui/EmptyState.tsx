import { ReactNode } from "react";
import { Info } from "lucide-react";

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-sm border border-dashed border-border bg-surface px-6 py-12 text-center">
      <Info aria-hidden="true" className="h-6 w-6 text-text-muted" />
      <h3 className="font-display text-lg font-semibold uppercase tracking-tight text-primary">
        {title}
      </h3>
      <p className="max-w-md text-sm text-text-muted">{description}</p>
      {action}
    </div>
  );
}
