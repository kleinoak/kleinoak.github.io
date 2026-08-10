import Link from "next/link";
import { Mail } from "lucide-react";
import { FacebookIcon, InstagramIcon, TikTokIcon, XIcon } from "@/components/icons/SocialIcons";
import { nav, site } from "@/data/site";
import { Container } from "@/components/ui/Container";

// Social links are editable in the CMS; a blank one is simply not shown.
const socialLinks = [
  { label: "Facebook", href: site.socials.facebook, Icon: FacebookIcon },
  { label: "Instagram", href: site.socials.instagram, Icon: InstagramIcon },
  { label: "TikTok", href: site.socials.tiktok, Icon: TikTokIcon },
  { label: "Twitter", href: site.socials.twitter, Icon: XIcon },
].filter((link): link is { label: string; href: string; Icon: typeof FacebookIcon } =>
  Boolean(link.href),
);

export function Footer() {
  return (
    <footer className="border-t border-border-dark bg-primary text-white">
      <Container className="grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div className="lg:col-span-1">
          <span className="font-display text-lg font-bold uppercase tracking-tight text-accent">
            Klein Oak Volleyball
          </span>
          <p className="mt-3 text-sm text-white/60">
            Klein Oak High School Panther Volleyball — Varsity, Junior Varsity, Flex, and Freshman
            programs.
          </p>
          <ul className="mt-4 flex items-center gap-3">
            {socialLinks.map(({ label, href, Icon }) => (
              <li key={label}>
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Klein Oak Volleyball on ${label}`}
                  className="flex h-10 w-10 items-center justify-center rounded-sm border border-white/15 text-white/80 transition-colors hover:border-accent hover:text-accent"
                >
                  <Icon aria-hidden="true" className="h-4.5 w-4.5" />
                </a>
              </li>
            ))}
          </ul>
        </div>

        <nav aria-label="Footer">
          <h2 className="text-xs font-semibold uppercase tracking-[0.15em] text-white/50">
            Explore
          </h2>
          <ul className="mt-4 space-y-2.5 text-sm">
            {nav.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="text-white/80 hover:text-accent">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <h2 className="text-xs font-semibold uppercase tracking-[0.15em] text-white/50">
            Parent Resources
          </h2>
          <ul className="mt-4 space-y-2.5 text-sm">
            <li>
              <a
                href={site.parentPortalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/80 hover:text-accent"
              >
                Rank One Parent Portal
              </a>
            </li>
            <li>
              <Link href="/resources" className="text-white/80 hover:text-accent">
                All Resources
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h2 className="text-xs font-semibold uppercase tracking-[0.15em] text-white/50">
            Contact
          </h2>
          <ul className="mt-4 space-y-2.5 text-sm">
            <li>
              <a
                href={`mailto:${site.contactEmail}`}
                className="inline-flex items-center gap-2 text-white/80 hover:text-accent"
              >
                <Mail aria-hidden="true" className="h-4 w-4" />
                {site.contactEmail}
              </a>
            </li>
          </ul>
        </div>
      </Container>

      <div className="border-t border-white/10 py-6">
        <Container className="flex flex-col items-center justify-between gap-2 text-xs text-white/50 sm:flex-row">
          <p>© {new Date().getFullYear()} Klein Oak Volleyball Booster Club. All rights reserved.</p>
          <p>Local modernization prototype — not the official Klein Oak Volleyball website.</p>
        </Container>
      </div>
    </footer>
  );
}
