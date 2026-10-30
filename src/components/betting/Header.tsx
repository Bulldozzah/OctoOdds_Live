import { Menu, Smartphone, UserPlus, LogIn, LogOut, User } from "lucide-react";
import { toast } from "sonner";
import { Link, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { useMobileSidebar } from "@/components/layout/AppShell";

export function Header() {
  const navigate = useNavigate();
  const openMobile = useMobileSidebar();
  const { user, profile, loading, signOut } = useAuth();

  return (
    <header className="sticky top-0 z-40">
      {/* Main bar */}
      <div className="bg-gradient-header text-header-foreground">
        <div className="mx-auto flex h-14 max-w-[1600px] items-center gap-4 px-3">
          {openMobile && (
            <button
              onClick={openMobile}
              aria-label="Open navigation"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-header-foreground hover:bg-header-deep/60 md:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
          )}
          <Link to="/" className="flex shrink-0 items-center">
            <img
              src="/octoodds-logo.png"
              alt="OctOdds"
              className="h-10 w-auto rounded bg-white px-1.5 py-0.5"
            />
          </Link>
          <div className="ml-auto flex items-center gap-2">
            {loading ? null : user ? (
              <>
                <span className="hidden items-center gap-1.5 text-xs text-header-muted sm:flex">
                  <User className="h-4 w-4" />
                  <span className="max-w-[12rem] truncate">{profile?.full_name || user.email}</span>
                </span>
                <button
                  onClick={() =>
                    void signOut().then(() => navigate({ to: "/login", replace: true }))
                  }
                  className="btn-ghost-header h-9 px-3 text-xs"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline">Log out</span>
                </button>
                <button
                  onClick={() =>
                    toast("OctoOdds for Android", {
                      description:
                        "The download link will be added here when the app is published.",
                    })
                  }
                  className="btn-cta h-9 px-3 text-xs"
                >
                  <Smartphone className="h-4 w-4" />
                  <span className="hidden sm:inline">Mobile app</span>
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => navigate({ to: "/login" })}
                  className="btn-ghost-header h-9 px-3 text-xs"
                >
                  <LogIn className="h-4 w-4" />
                  <span className="hidden sm:inline">Log in</span>
                </button>
                <button
                  onClick={() => navigate({ to: "/login" })}
                  className="btn-cta h-9 px-4 text-xs"
                >
                  <UserPlus className="h-4 w-4" /> Registration
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
