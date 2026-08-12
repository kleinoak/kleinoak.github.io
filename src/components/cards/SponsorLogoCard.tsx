import Image from "next/image";
import { sponsorLogoFor } from "@/data/sponsors";
import { assetPath } from "@/lib/asset";

export function SponsorLogoCard({ name }: { name: string }) {
  const entry = sponsorLogoFor(name);

  return (
    <div className="flex h-24 items-center justify-center rounded-sm border border-border bg-white px-4 text-center transition-colors hover:border-accent-strong">
      {entry ? (
        <Image
          src={assetPath(entry.logo.src)}
          alt={entry.logo.alt}
          width={entry.logo.width}
          height={entry.logo.height}
          className="max-h-16 w-auto max-w-full object-contain"
        />
      ) : (
        // No artwork on file — the business name is the fallback, so a sponsor
        // can be listed the moment they sign up.
        <span className="font-display text-base font-semibold uppercase tracking-tight text-primary sm:text-lg">
          {name}
        </span>
      )}
    </div>
  );
}
