import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Website Editor",
  // The editor is a private tool, not a page for search engines.
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <div className="flex-1">{children}</div>;
}
