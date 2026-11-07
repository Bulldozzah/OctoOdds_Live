import { useState, type ReactNode } from "react";
import { Download, Info } from "lucide-react";
import { Link } from "@tanstack/react-router";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { BUSINESS_NAME, LAST_UPDATED, LEGAL_LINKS, SUPPORT_EMAIL } from "@/lib/legal";

export const POLICIES_PDF = "/octoodds-policies.pdf";

/**
 * "About" info button + dialog: what the service is, links to every policy
 * and a download of the same policies as a PDF.
 */
export function AboutDialog({ trigger }: { trigger?: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <button
            type="button"
            aria-label={`About ${BUSINESS_NAME}`}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-input bg-card text-muted-foreground shadow-card hover:bg-muted hover:text-foreground"
          >
            <Info className="h-4.5 w-4.5" />
          </button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>About {BUSINESS_NAME}</DialogTitle>
          <DialogDescription>
            A subscription odds-analytics tool — no bets are placed, held or paid out on{" "}
            {BUSINESS_NAME}.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 text-sm">
          <p className="leading-relaxed text-secondary-foreground">
            {BUSINESS_NAME} scans bookmaker odds, finds dutching and arbitrage combos, and helps you
            plan stakes across every outcome. Access is sold as a single one-month subscription,
            paid once. You must be 18+ to use it.
          </p>
          <div>
            <p className="mb-1.5 text-xs font-bold uppercase text-muted-foreground">Our policies</p>
            <ul className="space-y-1.5">
              {LEGAL_LINKS.map((l) => (
                <li key={l.to}>
                  <Link
                    to={l.to}
                    onClick={() => setOpen(false)}
                    className="font-semibold text-primary underline"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div className="flex items-center justify-between gap-3 border-t pt-3">
            <a
              href={POLICIES_PDF}
              download="OctoOdds-terms-and-policies.pdf"
              className="btn-cta h-9 gap-1.5 px-3 text-xs"
            >
              <Download className="h-4 w-4" /> Download policies (PDF)
            </a>
            <p className="text-[11px] text-muted-foreground">Updated {LAST_UPDATED}</p>
          </div>
          <p className="text-[11px] text-muted-foreground">Questions? {SUPPORT_EMAIL}</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
