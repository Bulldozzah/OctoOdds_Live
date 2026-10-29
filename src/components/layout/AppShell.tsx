import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { AppSidebar } from "./AppSidebar";

const MobileSidebarCtx = createContext<(() => void) | null>(null);
/** Lets the header's hamburger open the mobile drawer; null when there's no shell. */
export const useMobileSidebar = () => useContext(MobileSidebarCtx);

const SIDEBAR_KEY = "octoodds.sidebar-open";

export function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem(SIDEBAR_KEY) === "0") setOpen(false);
    } catch {
      // Storage unavailable — default expanded.
    }
  }, []);

  const toggle = () => {
    setOpen((o) => {
      try {
        localStorage.setItem(SIDEBAR_KEY, o ? "0" : "1");
      } catch {
        // Non-persistent collapse is fine.
      }
      return !o;
    });
  };

  return (
    <MobileSidebarCtx.Provider value={() => setMobileOpen(true)}>
      <div className="flex min-h-screen w-full bg-background text-foreground">
        {/* Desktop: sticky docked sidebar (w-60 expanded / w-16 icon rail). */}
        <div className="hidden shrink-0 md:block">
          <AppSidebar open={open} onToggle={toggle} />
        </div>

        {/* Mobile: same sidebar as a slide-over drawer. */}
        {mobileOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            <div
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setMobileOpen(false)}
            />
            <div className="absolute inset-y-0 left-0">
              <AppSidebar
                open
                mobile
                onToggle={() => setMobileOpen(false)}
                onNavigate={() => setMobileOpen(false)}
              />
            </div>
          </div>
        )}

        <div className="flex min-w-0 flex-1 flex-col">{children}</div>
      </div>
    </MobileSidebarCtx.Provider>
  );
}
