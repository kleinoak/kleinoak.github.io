import type { Metadata } from "next";
import { Mail } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { PageHero } from "@/components/layout/PageHero";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { FacebookIcon, InstagramIcon, TikTokIcon, XIcon } from "@/components/icons/SocialIcons";
import { boosterBoard } from "@/data/resources";
import { site } from "@/data/site";

export const metadata: Metadata = { title: "Contact" };

// Social links are editable in the CMS; a blank one is simply not shown.
const socialLinks = [
  { label: "Facebook", href: site.socials.facebook, Icon: FacebookIcon },
  { label: "Instagram", href: site.socials.instagram, Icon: InstagramIcon },
  { label: "TikTok", href: site.socials.tiktok, Icon: TikTokIcon },
  { label: "Twitter", href: site.socials.twitter, Icon: XIcon },
].filter((link): link is { label: string; href: string; Icon: typeof FacebookIcon } =>
  Boolean(link.href),
);

export default function ContactPage() {
  return (
    <>
      <PageHero
        eyebrow="Get in Touch"
        title="Contact"
        description="Questions about the program, sponsorships, or volunteering? The Booster Club is the best place to start."
      />

      <section className="py-16 sm:py-20">
        <Container className="grid gap-10 lg:grid-cols-2">
          <div className="rounded-sm border border-border bg-surface p-8">
            <h2 className="font-display text-xl font-semibold uppercase tracking-tight text-primary">
              Booster Club
            </h2>
            <a
              href={`mailto:${site.contactEmail}`}
              className="mt-3 inline-flex items-center gap-2 text-base font-semibold text-accent-strong hover:underline"
            >
              <Mail aria-hidden="true" className="h-5 w-5" />
              {site.contactEmail}
            </a>

            <h3 className="mt-8 text-sm font-semibold uppercase tracking-wide text-text-muted">
              Follow the Program
            </h3>
            <ul className="mt-4 flex items-center gap-3">
              {socialLinks.map(({ label, href, Icon }) => (
                <li key={label}>
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Klein Oak Volleyball on ${label}`}
                    className="flex h-11 w-11 items-center justify-center rounded-sm border border-border text-primary transition-colors hover:border-accent-strong hover:text-accent-strong"
                  >
                    <Icon aria-hidden="true" className="h-5 w-5" />
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <div id="board-heading">
              <SectionHeading eyebrow="2026 Officers" title="Booster Club Board" />
            </div>
            <ul className="mt-6 divide-y divide-border rounded-sm border border-border">
              {boosterBoard.map((officer) => (
                <li key={officer.role} className="flex items-center justify-between px-5 py-4">
                  <span className="text-sm font-semibold uppercase tracking-wide text-text-muted">
                    {officer.role}
                  </span>
                  <span className="text-sm font-semibold text-primary">{officer.name}</span>
                </li>
              ))}
            </ul>
          </div>
        </Container>
      </section>
    </>
  );
}
