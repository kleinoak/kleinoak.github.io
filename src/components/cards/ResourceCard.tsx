import { ExternalLink, TriangleAlert } from "lucide-react";
import { Resource } from "@/data/resources";

export function ResourceCard({ resource }: { resource: Resource }) {
  const content = (
    <>
      <h3 className="font-display text-lg font-semibold uppercase tracking-tight text-primary">
        {resource.title}
      </h3>
      <p className="mt-2 text-sm text-text-muted">{resource.description}</p>
      {!resource.verified && resource.note && (
        <p className="mt-3 flex items-start gap-1.5 text-xs font-medium text-warning">
          <TriangleAlert aria-hidden="true" className="h-3.5 w-3.5 flex-none translate-y-0.5" />
          {resource.note}
        </p>
      )}
      {resource.href && (
        <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-accent-strong">
          Open resource
          <ExternalLink aria-hidden="true" className="h-3.5 w-3.5" />
        </span>
      )}
    </>
  );

  const className =
    "flex flex-col rounded-sm border border-border bg-background p-6 transition-colors hover:border-accent-strong";

  if (resource.href) {
    return (
      <a
        href={resource.href}
        className={className}
        target={resource.href.startsWith("http") ? "_blank" : undefined}
        rel={resource.href.startsWith("http") ? "noopener noreferrer" : undefined}
      >
        {content}
      </a>
    );
  }

  return <div className={className}>{content}</div>;
}
