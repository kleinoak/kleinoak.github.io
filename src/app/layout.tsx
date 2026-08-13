import type { Metadata } from "next";
import { Geist, Geist_Mono, Oswald } from "next/font/google";
import { GoogleAnalytics } from "@next/third-parties/google";
import { PageViews } from "@/components/analytics/PageViews";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const oswald = Oswald({
  variable: "--font-oswald",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "Klein Oak Volleyball",
    template: "%s | Klein Oak Volleyball",
  },
  description:
    "The Klein Oak High School Panther Volleyball program: teams, schedule, coaches, sponsors, and parent resources.",
};

// The public site's header and footer live in `(site)/layout.tsx` so that the
// content editor at /admin can render as its own full-screen application.
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${oswald.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col font-sans">{children}</body>
      {/*
        Google Analytics 4. `process.env.NEXT_PUBLIC_GA_ID` has to appear as
        that exact literal — Next inlines these at build time by textual
        substitution, so reading it via a variable or a computed key silently
        yields undefined.

        The guard is doing real work: with no ID set, no tag is emitted at all.
        That is how `npm run dev` and the hand-built staging copy stay out of
        the reports, rather than relying on anyone remembering to filter them.
      */}
      {process.env.NEXT_PUBLIC_GA_ID && (
        <>
          <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID} />
          {/* gtag alone counts only the document that loaded; this reports the
              client-side navigations that follow. */}
          <PageViews />
        </>
      )}
    </html>
  );
}
