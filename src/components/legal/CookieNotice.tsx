import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";

const KEY = "octoodds.cookie-notice.v1";

/**
 * One-time notice that the site only keeps essential data in the browser.
 * Shown after mount so the server-rendered HTML and the first client render match.
 */
export function CookieNotice() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(KEY)) setShow(true);
    } catch {
      setShow(true);
    }
  }, []);

  if (!show) return null;

  const dismiss = () => {
    try {
      localStorage.setItem(KEY, "1");
    } catch {
      // Storage blocked — the notice just reappears next visit.
    }
    setShow(false);
  };

  return (
    <div
      role="region"
      aria-label="Browser storage notice"
      className="fixed inset-x-2 bottom-2 z-[60] mx-auto flex max-w-2xl flex-wrap items-center gap-3 rounded-md border bg-card p-3 text-xs shadow-card sm:inset-x-4 sm:bottom-4"
    >
      <p className="min-w-0 flex-1 basis-64 leading-relaxed text-secondary-foreground">
        OctoOdds only uses your browser's storage for your login and settings. No advertising or
        tracking cookies, and no banking details are ever stored.{" "}
        <Link to="/cookies" className="font-semibold text-primary underline">
          Learn more
        </Link>
      </p>
      <button onClick={dismiss} className="btn-cta h-8 px-4 text-xs">
        OK
      </button>
    </div>
  );
}
