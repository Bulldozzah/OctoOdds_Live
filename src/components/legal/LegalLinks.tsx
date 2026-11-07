import { Link } from "@tanstack/react-router";
import { LEGAL_LINKS } from "@/lib/legal";

/** Footer row linking every policy; used on the home, sample and policy pages. */
export function LegalLinks({ className = "" }: { className?: string }) {
  return (
    <nav
      aria-label="Legal"
      className={`flex flex-wrap justify-center gap-x-4 gap-y-1 ${className}`}
    >
      {LEGAL_LINKS.map((l) => (
        <Link key={l.to} to={l.to} className="underline-offset-2 hover:underline">
          {l.label}
        </Link>
      ))}
    </nav>
  );
}
