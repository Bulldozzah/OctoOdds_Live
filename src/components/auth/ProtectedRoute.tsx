import { useEffect, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Lock } from "lucide-react";
import { useAuth } from "@/lib/auth";

/**
 * Gates a page by auth state and paid access (same rules as OctoOdds):
 *   1. still loading     -> spinner, decide nothing
 *   2. no signed-in user -> /login
 *   3. profile failed    -> retry / sign out
 *   4. no paid access    -> subscription notice
 *
 * The redirect runs in an effect because the app is server-rendered: the
 * server has no session, and redirecting during render would bounce every
 * visitor before the browser restores theirs.
 */
export function ProtectedRoute({
  children,
  requireAdmin = false,
}: {
  children: ReactNode;
  /** Admin-only page: everyone else is sent to the Calculator. */
  requireAdmin?: boolean;
}) {
  const { user, profile, loading, profileError, hasAccess, isAdmin, refreshProfile, signOut } =
    useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (!user) void navigate({ to: "/login", replace: true });
    else if (requireAdmin && profile && !isAdmin)
      void navigate({ to: "/calculator", replace: true });
  }, [loading, user, profile, isAdmin, requireAdmin, navigate]);

  if (loading || !user) return <RouteSpinner />;
  if (requireAdmin && profile && !isAdmin) return <RouteSpinner />;
  if (profileError) {
    return (
      <Notice
        title="Couldn't load your account"
        text="You're signed in, but your profile didn't load."
        detail={profileError}
        onPrimary={() => void refreshProfile()}
        primary="Try again"
        onSecondary={() => void signOut()}
      />
    );
  }
  if (!profile) return <RouteSpinner />;
  if (!hasAccess) {
    return (
      <Notice
        title="Subscription required"
        text="Your account is active but not yet unlocked. Plans are $5 / month, $25 / 6 months or $50 / year — access opens once your payment is confirmed."
        onPrimary={() => void refreshProfile()}
        primary="Refresh status"
        onSecondary={() => void signOut().then(() => navigate({ to: "/login", replace: true }))}
      />
    );
  }
  return <>{children}</>;
}

export function RouteSpinner() {
  return (
    <div className="grid min-h-[60vh] place-items-center">
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-border border-t-primary" />
        Loading…
      </div>
    </div>
  );
}

function Notice({
  title,
  text,
  detail,
  primary,
  onPrimary,
  onSecondary,
}: {
  title: string;
  text: string;
  detail?: string;
  primary: string;
  onPrimary: () => void;
  onSecondary: () => void;
}) {
  return (
    <div className="grid min-h-[60vh] place-items-center px-4">
      <div className="w-full max-w-sm overflow-hidden rounded-md bg-card text-center shadow-card">
        <div className="flex items-center justify-center gap-2 bg-gradient-header px-4 py-3 text-header-foreground">
          <Lock className="h-4 w-4 text-cta" />
          <h1 className="font-display text-sm font-bold uppercase tracking-wide">{title}</h1>
        </div>
        <div className="space-y-3 p-5">
          <p className="text-sm text-muted-foreground">{text}</p>
          {detail && (
            <p className="break-words rounded bg-muted px-3 py-2 text-xs text-muted-foreground">
              {detail}
            </p>
          )}
          <div className="flex justify-center gap-2">
            <button onClick={onPrimary} className="btn-cta h-9 px-4 text-xs">
              {primary}
            </button>
            <button
              onClick={onSecondary}
              className="h-9 rounded-md bg-muted px-4 text-xs font-semibold"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
