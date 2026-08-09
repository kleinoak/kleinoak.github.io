"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

const buttonStyles: Record<ButtonVariant, string> = {
  primary: "bg-primary text-white hover:bg-primary-soft disabled:bg-secondary",
  secondary: "border border-border bg-background text-primary hover:border-accent-strong",
  ghost: "text-text-muted hover:text-primary",
  danger: "border border-danger/40 bg-background text-danger hover:bg-danger/5",
};

export function AdminButton({
  variant = "secondary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }) {
  return (
    <button
      type="button"
      {...props}
      className={`inline-flex items-center justify-center gap-2 rounded-sm px-3 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${buttonStyles[variant]} ${className}`}
    />
  );
}

export function Panel({
  title,
  description,
  actions,
  children,
}: {
  title?: string;
  description?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-sm border border-border bg-background">
      {(title || actions) && (
        <header className="flex flex-wrap items-start justify-between gap-3 border-b border-border px-5 py-4">
          <div>
            {title && (
              <h2 className="font-display text-lg font-semibold uppercase tracking-tight text-primary">
                {title}
              </h2>
            )}
            {description && <div className="mt-1 text-sm text-text-muted">{description}</div>}
          </div>
          {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </header>
      )}
      <div className="px-5 py-5">{children}</div>
    </section>
  );
}

type BannerTone = "info" | "warning" | "error" | "success";

const bannerStyles: Record<BannerTone, string> = {
  info: "border-border bg-surface text-text",
  warning: "border-warning/40 bg-warning/10 text-warning",
  error: "border-danger/40 bg-danger/10 text-danger",
  success: "border-success/40 bg-success/10 text-success",
};

export function Banner({
  tone = "info",
  title,
  children,
  actions,
}: {
  tone?: BannerTone;
  title?: string;
  children?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className={`rounded-sm border px-4 py-3 text-sm ${bannerStyles[tone]}`} role="status">
      {title && <p className="font-semibold">{title}</p>}
      {children && <div className={title ? "mt-1" : undefined}>{children}</div>}
      {actions && <div className="mt-3 flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Chip({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-sm bg-surface px-2 py-0.5 text-xs font-medium text-text-muted">
      {children}
    </span>
  );
}
