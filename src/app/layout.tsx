import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Climate Twin — Hyper-local climate projections for your block",
  description:
    "Turn abstract climate models into hyper-local, visual realities. Multi-scenario projections, neighborhood-scale downscaling, property resilience scores, and actionable interventions.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <header className="border-b border-[var(--border)] bg-[var(--panel)]">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <Link
              href="/"
              className="flex items-center gap-2 font-semibold text-lg"
              style={{ textDecoration: "none" }}
            >
              <span
                aria-hidden
                className="inline-block w-6 h-6 rounded"
                style={{
                  background:
                    "linear-gradient(135deg, var(--accent), var(--accent-2))",
                }}
              />
              Climate Twin
            </Link>
            <nav className="flex items-center gap-6 text-sm">
              <Link href="/explore">Explore</Link>
              <Link href="/property-score">Property Score</Link>
              <Link href="/simulator">What-If</Link>
              <Link href="/community">Community</Link>
              <Link href="/docs">Docs</Link>
            </nav>
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-6 py-8">{children}</main>
        <footer className="border-t border-[var(--border)] mt-12 py-6 text-center text-sm text-[var(--muted)]">
          Built for civic climate agency · Data illustrative — see Docs for
          methodology
        </footer>
      </body>
    </html>
  );
}
