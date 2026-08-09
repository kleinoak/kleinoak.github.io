"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, Menu, X } from "lucide-react";
import { nav, site } from "@/data/site";
import { Container } from "@/components/ui/Container";

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Header() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const desktopNavRef = useRef<HTMLElement>(null);

  const closeAll = () => {
    setMobileOpen(false);
    setOpenMenu(null);
  };

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMobileOpen(false);
        setOpenMenu(null);
      }
    }
    function onPointerDown(event: PointerEvent) {
      if (
        desktopNavRef.current &&
        !desktopNavRef.current.contains(event.target as Node)
      ) {
        setOpenMenu(null);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, []);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-sm focus:bg-primary focus:px-4 focus:py-2 focus:text-white"
      >
        Skip to main content
      </a>
      <Container className="flex h-18 items-center justify-between py-3">
        <Link href="/" className="flex items-center gap-2.5">
          <span
            aria-hidden="true"
            className="flex h-10 w-10 flex-none items-center justify-center rounded-sm bg-primary font-display text-lg font-bold text-accent"
          >
            KO
          </span>
          <span className="flex flex-col leading-tight">
            <span className="whitespace-nowrap font-display text-base font-bold uppercase tracking-tight text-primary sm:text-lg">
              Klein Oak Volleyball
            </span>
            <span className="whitespace-nowrap text-[0.7rem] font-medium uppercase tracking-[0.15em] text-text-muted">
              Panther Volleyball
            </span>
          </span>
        </Link>

        <nav aria-label="Primary" ref={desktopNavRef} className="hidden xl:block">
          <ul className="flex items-center gap-1">
            {nav.map((item) => (
              <li key={item.href} className="relative">
                {"children" in item && item.children ? (
                  <>
                    <button
                      type="button"
                      aria-expanded={openMenu === item.label}
                      aria-controls={`submenu-${item.label}`}
                      onClick={() =>
                        setOpenMenu((current) =>
                          current === item.label ? null : item.label,
                        )
                      }
                      className={`flex cursor-pointer items-center gap-1 rounded-sm px-3 py-2 text-sm font-semibold uppercase tracking-wide transition-colors hover:bg-black/5 ${
                        isActive(pathname, item.href) ? "text-accent-strong" : "text-primary"
                      }`}
                    >
                      {item.label}
                      <ChevronDown
                        aria-hidden="true"
                        className={`h-3.5 w-3.5 transition-transform ${
                          openMenu === item.label ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                    {openMenu === item.label && (
                      <ul
                        id={`submenu-${item.label}`}
                        className="absolute left-0 top-full z-10 mt-1 min-w-48 rounded-sm border border-border bg-background py-2 shadow-lg"
                      >
                        {item.children.map((child) => (
                          <li key={child.href}>
                            <Link
                              href={child.href}
                              onClick={closeAll}
                              className={`block px-4 py-2 text-sm font-medium hover:bg-surface ${
                                isActive(pathname, child.href)
                                  ? "text-accent-strong"
                                  : "text-text"
                              }`}
                            >
                              {child.label}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </>
                ) : (
                  <Link
                    href={item.href}
                    className={`block whitespace-nowrap rounded-sm px-3 py-2 text-sm font-semibold uppercase tracking-wide transition-colors hover:bg-black/5 ${
                      isActive(pathname, item.href) ? "text-accent-strong" : "text-primary"
                    }`}
                    aria-current={isActive(pathname, item.href) ? "page" : undefined}
                  >
                    {item.label}
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </nav>

        <button
          type="button"
          className="inline-flex h-11 w-11 items-center justify-center rounded-sm text-primary xl:hidden"
          aria-expanded={mobileOpen}
          aria-controls="mobile-nav"
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          onClick={() => setMobileOpen((open) => !open)}
        >
          {mobileOpen ? (
            <X aria-hidden="true" className="h-6 w-6" />
          ) : (
            <Menu aria-hidden="true" className="h-6 w-6" />
          )}
        </button>
      </Container>

      {mobileOpen && (
        <nav id="mobile-nav" aria-label="Mobile" className="border-t border-border xl:hidden">
          <Container className="flex flex-col gap-1 py-4">
            {nav.map((item) => (
              <div key={item.href}>
                <Link
                  href={item.href}
                  onClick={closeAll}
                  className={`block rounded-sm px-3 py-3 text-base font-semibold uppercase tracking-wide ${
                    isActive(pathname, item.href) ? "text-accent-strong" : "text-primary"
                  }`}
                >
                  {item.label}
                </Link>
                {"children" in item && item.children && (
                  <div className="ml-3 flex flex-col border-l border-border pl-3">
                    {item.children.map((child) => (
                      <Link
                        key={child.href}
                        href={child.href}
                        onClick={closeAll}
                        className={`rounded-sm px-3 py-2.5 text-sm font-medium ${
                          isActive(pathname, child.href) ? "text-accent-strong" : "text-text-muted"
                        }`}
                      >
                        {child.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
            <a
              href={`mailto:${site.contactEmail}`}
              onClick={closeAll}
              className="mt-2 inline-flex items-center justify-center rounded-sm bg-accent px-5 py-3 text-sm font-semibold uppercase tracking-wide text-primary"
            >
              Contact the Program
            </a>
          </Container>
        </nav>
      )}
    </header>
  );
}
