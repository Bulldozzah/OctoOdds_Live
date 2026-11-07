import type { ReactNode } from "react";
import { Header } from "@/components/betting/Header";
import { Link } from "@tanstack/react-router";
import { LAST_UPDATED } from "@/lib/legal";
import { LegalLinks } from "./LegalLinks";

/** Page frame shared by every policy: header, readable column, cross-links. */
export function LegalLayout({
  title,
  intro,
  children,
}: {
  title: string;
  intro?: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="mx-auto max-w-3xl px-4 py-8">
        <article className="rounded-md bg-card p-5 shadow-card sm:p-8">
          <h1 className="font-display text-3xl font-black tracking-tight">{title}</h1>
          <p className="mt-1 text-xs text-muted-foreground">Last updated: {LAST_UPDATED}</p>
          {intro && <p className="mt-4 text-sm leading-relaxed">{intro}</p>}
          <div className="mt-6 space-y-6">{children}</div>
        </article>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
          <Link to="/" className="hover:underline">
            ← Back to home
          </Link>
          <LegalLinks />
        </div>
      </main>
    </div>
  );
}

export function LegalSection({
  id,
  title,
  children,
}: {
  id?: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-20 space-y-2">
      <h2 className="font-display text-lg font-bold">{title}</h2>
      <div className="space-y-2 text-sm leading-relaxed text-secondary-foreground">{children}</div>
    </section>
  );
}

export const LegalList = ({ items }: { items: ReactNode[] }) => (
  <ul className="list-disc space-y-1 pl-5">
    {items.map((it, i) => (
      <li key={i}>{it}</li>
    ))}
  </ul>
);
