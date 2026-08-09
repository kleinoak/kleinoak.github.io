import Link from "next/link";
import { CalendarDays, ClipboardList, LifeBuoy, Users } from "lucide-react";
import { Container } from "@/components/ui/Container";

const links = [
  { label: "Schedule", href: "/schedule", Icon: CalendarDays },
  { label: "Camps & Tryouts", href: "/camps-tryouts", Icon: ClipboardList },
  { label: "Parent Resources", href: "/resources", Icon: LifeBuoy },
  { label: "Team Information", href: "/teams", Icon: Users },
];

export function QuickAccess() {
  return (
    <section aria-label="Quick access" className="border-b border-border bg-surface">
      <Container>
        <ul className="grid grid-cols-2 divide-x divide-y divide-border border-l border-border sm:grid-cols-4 sm:divide-y-0">
          {links.map(({ label, href, Icon }) => (
            <li key={href} className="border-r border-border">
              <Link
                href={href}
                className="flex h-full flex-col items-center justify-center gap-2 px-4 py-6 text-center transition-colors hover:bg-white"
              >
                <Icon aria-hidden="true" className="h-5 w-5 text-accent-strong" />
                <span className="text-sm font-semibold uppercase tracking-wide text-primary">
                  {label}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
