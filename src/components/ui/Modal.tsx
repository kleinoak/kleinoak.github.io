"use client";

import { ReactNode, useEffect, useId, useRef } from "react";
import { X } from "lucide-react";

/**
 * Anything the browser will let a user tab to. `GalleryBrowser`'s trap looks
 * for `button` alone, which is enough there because its lightbox holds nothing
 * else; a dialog with links and a scrollable body needs the full set.
 */
const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * A modal dialog that follows the dialog rules the rest of the site follows:
 * focus moves in and is trapped, Escape closes, the page behind does not
 * scroll, the backdrop closes on click but the panel does not, and focus goes
 * back to whatever opened it.
 *
 * Deliberately not `<dialog showModal>`: that would be less code, but it puts
 * the panel in the top layer where the site's own stacking and the `::backdrop`
 * pseudo-element stop matching the tokens used everywhere else, and Safari
 * still wants a polyfill for `closedby`. This is the same hand-rolled shape as
 * the gallery lightbox, extracted so a second caller does not copy it.
 *
 * **Callers must not render it when closed.** Mounting is what opens it — the
 * effects below run on mount — so the parent holds the open state and this
 * component holds the behaviour.
 */
export function Modal({
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
}: {
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: "md" | "lg";
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const headingId = useId();
  const descriptionId = useId();

  useEffect(() => {
    // Whatever had focus when this mounted gets it back on unmount. Captured
    // here rather than passed in so no caller can forget to.
    const opener = document.activeElement as HTMLElement | null;

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== "Tab") return;

      const focusable = panelRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE);
      if (!focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKey);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    panelRef.current?.querySelector<HTMLElement>(FOCUSABLE)?.focus();

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
      opener?.focus();
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-6"
      onClick={(event) => {
        // Backdrop closes; the panel does not.
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={headingId}
        aria-describedby={description ? descriptionId : undefined}
        className={`flex max-h-[92vh] w-full flex-col rounded-t-lg bg-background shadow-2xl sm:rounded-sm ${
          size === "lg" ? "sm:max-w-3xl" : "sm:max-w-xl"
        }`}
      >
        <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4 sm:px-6">
          <div className="min-w-0">
            <h2
              id={headingId}
              className="font-display text-xl font-bold uppercase tracking-tight text-primary sm:text-2xl"
            >
              {title}
            </h2>
            {description && (
              <p id={descriptionId} className="mt-1 text-sm text-text-muted">
                {description}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="-mr-1 shrink-0 rounded-sm border border-border p-2 text-text-muted transition-colors hover:border-accent-strong hover:text-accent-strong focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-strong"
          >
            <X aria-hidden="true" className="h-5 w-5" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">{children}</div>

        {footer && (
          <div className="border-t border-border px-5 py-4 sm:px-6">{footer}</div>
        )}
      </div>
    </div>
  );
}
