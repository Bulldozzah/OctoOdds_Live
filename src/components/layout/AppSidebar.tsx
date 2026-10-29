import { useNavigate, useRouterState } from "@tanstack/react-router";
import {
  BarChart3,
  Calculator,
  ChevronLeft,
  ChevronRight,
  Gauge,
  LogOut,
  Radar,
  ShieldCheck,
  Ticket,
  X,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

const items = [
  { title: "Calculator", url: "/calculator", icon: Calculator },
  { title: "Scanner", url: "/scanner", icon: Radar },
  { title: "Edge", url: "/edge", icon: Gauge },
  { title: "My Bets", url: "/my-bets", icon: Ticket },
  { title: "Stats", url: "/stats", icon: BarChart3 },
  // Only rendered for administrators — see `visible` below.
  { title: "Admin", url: "/admin", icon: ShieldCheck, adminOnly: true },
] as const;

export function AppSidebar({
  open,
  onToggle,
  onNavigate,
  mobile,
}: {
  open: boolean;
  onToggle: () => void;
  /** Called after any nav/sign-out click — lets the mobile drawer close. */
  onNavigate?: () => void;
  /** Drawer mode: the toggle becomes a close button. */
  mobile?: boolean;
}) {
  const { user, profile, isAdmin, isSuperuser, hasAccess, signOut } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (r) => r.location.pathname });

  const displayName = profile?.full_name || user?.email || "Guest";
  const roleLabel = !user
    ? "Signed out"
    : isAdmin
      ? "Administrator"
      : isSuperuser
        ? "Super user"
        : hasAccess
          ? "Member"
          : "Payment required";

  // Hiding the link is presentation only — /admin is guarded by ProtectedRoute
  // and by row-level security on the profiles table.
  const visible = items.filter((item) => !("adminOnly" in item && item.adminOnly) || isAdmin);

  return (
    <aside
      className={cn(
        "sticky top-0 flex h-screen flex-col bg-header-deep text-header-foreground transition-[width] duration-200",
        open ? "w-60" : "w-16",
      )}
    >
      {/* Account */}
      <div
        className={cn(
          "flex items-center gap-2.5 border-b border-header/60 px-3 py-3",
          !open && "justify-center px-0",
        )}
      >
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-cta text-sm font-black uppercase text-cta-foreground">
          {displayName[0] ?? "?"}
        </span>
        {open && (
          <div className="min-w-0">
            <p className="truncate text-[13px] font-bold">{displayName}</p>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-header-muted">
              {roleLabel}
            </p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 overflow-y-auto p-2">
        {visible.map((item) => {
          const active = pathname === item.url;
          return (
            <button
              key={item.title}
              title={item.title}
              onClick={() => {
                void navigate({ to: item.url });
                onNavigate?.();
              }}
              className={cn(
                "flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-[13px] font-semibold uppercase tracking-wide transition-colors",
                active
                  ? "bg-cta text-cta-foreground"
                  : "text-header-muted hover:bg-header/60 hover:text-header-foreground",
                !open && "justify-center px-0",
              )}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {open && item.title}
            </button>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="space-y-1 border-t border-header/60 p-2">
        {user && (
          <button
            title="Sign out"
            onClick={() => {
              void (async () => {
                await signOut();
                onNavigate?.();
                void navigate({ to: "/login", replace: true });
              })();
            }}
            className={cn(
              "flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-[13px] font-semibold uppercase tracking-wide text-header-muted transition-colors hover:bg-header/60 hover:text-header-foreground",
              !open && "justify-center px-0",
            )}
          >
            <LogOut className="h-5 w-5 shrink-0" />
            {open && "Sign out"}
          </button>
        )}
        <button
          title={mobile ? "Close" : open ? "Collapse" : "Expand"}
          onClick={onToggle}
          className={cn(
            "flex w-full items-center gap-3 rounded-md px-3 py-2 text-[12px] font-semibold uppercase tracking-wide text-header-muted transition-colors hover:bg-header/60 hover:text-header-foreground",
            !open && "justify-center px-0",
          )}
        >
          {mobile ? (
            <X className="h-5 w-5 shrink-0" />
          ) : open ? (
            <ChevronLeft className="h-5 w-5 shrink-0" />
          ) : (
            <ChevronRight className="h-5 w-5 shrink-0" />
          )}
          {open && (mobile ? "Close" : "Collapse")}
        </button>
      </div>
    </aside>
  );
}
