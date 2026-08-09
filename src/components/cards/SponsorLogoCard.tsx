export function SponsorLogoCard({ name }: { name: string }) {
  return (
    <div className="flex h-24 items-center justify-center rounded-sm border border-border bg-background px-4 text-center transition-colors hover:border-accent-strong">
      <span className="font-display text-base font-semibold uppercase tracking-tight text-primary sm:text-lg">
        {name}
      </span>
    </div>
  );
}
