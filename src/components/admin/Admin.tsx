import { useCallback, useEffect, useState } from "react";
import { addMonths } from "date-fns";
import {
  Check,
  Crown,
  Loader2,
  Lock,
  LockOpen,
  ShieldCheck,
  User as UserIcon,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/lib/auth";
import {
  hasPaidAccess,
  supabase,
  SUBSCRIPTION_PLANS,
  type Profile,
  type ProfileRole,
  type SubscriptionPlan,
} from "@/lib/supabase";

const FILTERS = ["unpaid", "paid", "all"] as const;
type Filter = (typeof FILTERS)[number];
const ROLES: ProfileRole[] = ["user", "superuser", "admin"];

const date = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

/**
 * Member management, ported from OctoOdds: grant/revoke paid access, set
 * roles, and the global paywall switch. Same Supabase tables, so changes here
 * apply to OctoOdds too. Row-level security only lets admins write others'
 * profiles.
 */
export function Admin() {
  const { user } = useAuth();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [filter, setFilter] = useState<Filter>("unpaid");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error: loadError } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });
    setLoading(false);
    if (loadError) setError(loadError.message);
    else {
      setError("");
      setProfiles((data ?? []) as Profile[]);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const patch = async (id: string, change: Partial<Profile>, done: string) => {
    setBusyId(id);
    const { error: updateError } = await supabase.from("profiles").update(change).eq("id", id);
    setBusyId(null);
    if (updateError) toast.error("Update failed", { description: updateError.message });
    else {
      toast.success(done);
      await load();
    }
  };

  // Grant a paid subscription: is_paid on, period starting now.
  const grant = (p: Profile, plan: SubscriptionPlan) => {
    const meta = SUBSCRIPTION_PLANS.find((x) => x.id === plan)!;
    const now = new Date();
    return patch(
      p.id,
      {
        is_paid: true,
        subscription_plan: plan,
        subscription_started_at: now.toISOString(),
        subscription_expires_at: addMonths(now, meta.months).toISOString(),
      },
      `${p.full_name || p.email}: ${meta.name} granted`,
    );
  };
  const revoke = (p: Profile) =>
    patch(
      p.id,
      { is_paid: false, subscription_expires_at: null },
      `Access revoked for ${p.full_name || p.email}`,
    );
  const setRole = (p: Profile, role: ProfileRole) => {
    if (p.id === user?.id && role !== "admin") {
      toast.error("You can't remove your own admin role", {
        description: "Ask another admin to change it, so the app is never left without one.",
      });
      return;
    }
    return patch(p.id, { role }, `${p.full_name || p.email} is now ${role}`);
  };

  const q = search.trim().toLowerCase();
  const counts: Record<Filter, number> = {
    all: profiles.length,
    paid: profiles.filter((p) => hasPaidAccess(p)).length,
    unpaid: profiles.filter((p) => !hasPaidAccess(p)).length,
  };
  const visible = profiles.filter((p) => {
    if (filter !== "all" && hasPaidAccess(p) !== (filter === "paid")) return false;
    return !q || `${p.full_name ?? ""} ${p.email ?? ""}`.toLowerCase().includes(q);
  });

  return (
    <main className="mx-auto max-w-[1100px] space-y-3 px-2 py-3 sm:px-3">
      <section className="overflow-hidden rounded-md bg-card shadow-card">
        <div className="flex flex-wrap items-center gap-3 bg-gradient-header px-4 py-3 text-header-foreground">
          <div className="mr-auto">
            <h1 className="flex items-center gap-2 font-display text-xl font-black uppercase italic tracking-tight">
              <ShieldCheck className="h-5 w-5 text-cta" /> <span className="text-cta">Members</span>
            </h1>
            <p className="text-xs text-header-muted">
              Grant paid access, set super users and manage roles. Shared with OctoOdds.
            </p>
          </div>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name or email"
            aria-label="Search members"
            className="h-9 w-56 rounded-md bg-header-deep/70 px-3 text-xs text-header-foreground outline-none placeholder:text-header-muted focus:ring-2 focus:ring-cta"
          />
        </div>
        <div className="flex gap-1 bg-panel-head px-2 py-1.5">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`flex h-8 items-center gap-1.5 rounded px-3 text-xs font-bold uppercase ${
                filter === f
                  ? "bg-primary text-primary-foreground"
                  : "text-secondary-foreground hover:bg-accent"
              }`}
            >
              {f}
              <span
                className={`grid h-5 min-w-5 place-items-center rounded-full px-1 text-[10px] ${
                  filter === f ? "bg-cta text-cta-foreground" : "bg-card text-secondary-foreground"
                }`}
              >
                {counts[f]}
              </span>
            </button>
          ))}
        </div>
      </section>

      <PaywallCard />

      {error ? (
        <section className="rounded-md bg-card px-4 py-10 text-center shadow-card">
          <p className="font-semibold">Couldn't load members</p>
          <p className="mt-1 text-sm text-muted-foreground">{error}</p>
          <button onClick={() => void load()} className="btn-cta mx-auto mt-4 h-9 px-4 text-xs">
            Try again
          </button>
        </section>
      ) : loading && profiles.length === 0 ? (
        <p className="flex items-center justify-center gap-2 rounded-md bg-card px-4 py-10 text-sm text-muted-foreground shadow-card">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading members…
        </p>
      ) : visible.length === 0 ? (
        <p className="rounded-md bg-card px-4 py-10 text-center text-sm text-muted-foreground shadow-card">
          No members {q ? `matching “${search.trim()}”` : `in “${filter}”`}.
        </p>
      ) : (
        <ul className="space-y-2">
          {visible.map((p) => (
            <MemberRow
              key={p.id}
              profile={p}
              isSelf={p.id === user?.id}
              busy={busyId === p.id}
              onGrant={(plan) => void grant(p, plan)}
              onRevoke={() => void revoke(p)}
              onSetRole={(role) => void setRole(p, role)}
            />
          ))}
        </ul>
      )}
    </main>
  );
}

function MemberRow({
  profile: p,
  isSelf,
  busy,
  onGrant,
  onRevoke,
  onSetRole,
}: {
  profile: Profile;
  isSelf: boolean;
  busy: boolean;
  onGrant: (plan: SubscriptionPlan) => void;
  onRevoke: () => void;
  onSetRole: (role: ProfileRole) => void;
}) {
  const paid = hasPaidAccess(p);
  const noPayNeeded = p.role === "admin" || p.role === "superuser";
  const plan = SUBSCRIPTION_PLANS.find((s) => s.id === p.subscription_plan);

  return (
    <li className="overflow-hidden rounded-md bg-card shadow-card">
      <div className="flex flex-wrap items-center gap-3 px-4 py-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary text-sm font-black text-primary-foreground">
          {(p.full_name || p.email || "?").slice(0, 1).toUpperCase()}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <strong className="truncate text-sm">{p.full_name || "(no name)"}</strong>
            {isSelf && (
              <span className="text-[10px] font-bold uppercase text-muted-foreground">you</span>
            )}
            <RoleBadge role={p.role} />
            <AccessBadge paid={paid} noPayNeeded={noPayNeeded} />
          </div>
          <p className="truncate text-xs text-muted-foreground">{p.email}</p>
          <p className="text-[11px] text-muted-foreground">
            {plan && (
              <>
                {plan.name} plan
                {p.subscription_expires_at && ` · expires ${date(p.subscription_expires_at)}`}
                {" · "}
              </>
            )}
            Registered {date(p.created_at)}
          </p>
        </div>
        <label className="flex items-center gap-2 text-[11px] font-bold uppercase text-secondary-foreground">
          Role
          <select
            value={p.role}
            disabled={busy}
            onChange={(e) => onSetRole(e.target.value as ProfileRole)}
            className="h-8 rounded-md border border-input bg-card px-2 text-xs font-semibold capitalize normal-case outline-none focus:ring-2 focus:ring-ring"
          >
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </label>
        {busy && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
      </div>

      {/* Paid access only matters for regular users — admins and superusers are free. */}
      {p.role === "user" && (
        <div className="flex flex-wrap items-center gap-2 border-t bg-muted/50 px-4 py-2.5">
          <span className="text-[11px] font-semibold uppercase text-muted-foreground">
            {paid ? "Extend / change:" : "Grant access:"}
          </span>
          {SUBSCRIPTION_PLANS.map((s) => (
            <button
              key={s.id}
              disabled={busy}
              onClick={() => onGrant(s.id)}
              className="inline-flex h-8 items-center gap-1 rounded bg-card px-3 text-[11px] font-bold uppercase text-secondary-foreground hover:bg-accent disabled:opacity-50"
            >
              <Check className="h-3.5 w-3.5 text-up" /> {s.name} · ${s.price}
            </button>
          ))}
          {paid && (
            <button
              disabled={busy}
              onClick={onRevoke}
              className="ml-auto inline-flex h-8 items-center gap-1 rounded bg-card px-3 text-[11px] font-bold uppercase text-muted-foreground hover:text-destructive disabled:opacity-50"
            >
              <X className="h-3.5 w-3.5" /> Revoke
            </button>
          )}
        </div>
      )}
    </li>
  );
}

/**
 * Global paywall switch. Free-access mode lets every signed-in user in; paid
 * status on profiles is never touched, so turning the paywall back on restores
 * exactly who had paid before.
 */
function PaywallCard() {
  const { user, paywallEnabled, refreshSettings } = useAuth();
  const [busy, setBusy] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const freeMode = !paywallEnabled;

  const apply = async () => {
    setBusy(true);
    const { error } = await supabase
      .from("app_settings")
      .update({
        bool_value: !paywallEnabled,
        updated_at: new Date().toISOString(),
        updated_by: user?.id ?? null,
      })
      .eq("key", "paywall_enabled");
    setBusy(false);
    if (error) toast.error("Couldn't change site access", { description: error.message });
    else {
      await refreshSettings();
      toast.success(freeMode ? "Paywall back on" : "Free access for everyone is on");
    }
  };

  return (
    <section
      className={`flex flex-wrap items-center justify-between gap-4 rounded-md border bg-card px-4 py-3 shadow-card ${
        freeMode
          ? "border-destructive/60 shadow-[0_0_24px_-6px_var(--destructive)]"
          : "border-transparent"
      }`}
    >
      <div className="flex min-w-0 items-center gap-3">
        <span
          className={`grid h-10 w-10 shrink-0 place-items-center rounded-md ${
            freeMode ? "bg-destructive/15 text-destructive" : "bg-accent text-primary"
          }`}
        >
          {freeMode ? <LockOpen className="h-5 w-5" /> : <Lock className="h-5 w-5" />}
        </span>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <strong className="text-sm">Site access</strong>
            <span
              className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${
                freeMode ? "bg-destructive/15 text-destructive" : "bg-up/15 text-up"
              }`}
            >
              {freeMode ? "Free access — paywall off" : "Payment required"}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            {freeMode
              ? "Everyone who signs in can use OctoOdds without paying."
              : "Unpaid users can't use the tools. Members who paid keep access."}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-[11px] font-bold uppercase text-muted-foreground">
          {freeMode ? "Paywall off" : "Paywall on"}
        </span>
        <Switch
          checked={paywallEnabled}
          disabled={busy}
          onCheckedChange={() => setConfirmOpen(true)}
          aria-label="Toggle paywall"
        />
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {freeMode ? "Re-enable the paywall?" : "Enable free access for everyone?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {freeMode
                ? "Unpaid users lose access to the tools. Members who already paid keep it — paid status is stored on each profile and is never wiped by this switch."
                : "Every registered user can use the whole app without paying — useful for promos and free trials. This applies to OctoOdds too. You can switch the paywall back on here at any time."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => void apply()}
              className={
                freeMode ? "" : "bg-destructive text-destructive-foreground hover:bg-destructive/90"
              }
            >
              {freeMode ? "Yes, enable paywall" : "Yes, free access"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}

function RoleBadge({ role }: { role: ProfileRole }) {
  const [Icon, cls] =
    role === "admin"
      ? [ShieldCheck, "bg-primary/15 text-primary"]
      : role === "superuser"
        ? [Crown, "bg-gold/25 text-secondary-foreground"]
        : [UserIcon, "bg-muted text-muted-foreground"];
  return (
    <span
      className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${cls}`}
    >
      <Icon className="h-3 w-3" /> {role === "superuser" ? "super user" : role}
    </span>
  );
}

function AccessBadge({ paid, noPayNeeded }: { paid: boolean; noPayNeeded: boolean }) {
  const [label, cls] = noPayNeeded
    ? ["free access", "bg-up/15 text-up"]
    : paid
      ? ["paid", "bg-up/15 text-up"]
      : ["unpaid", "bg-gold/25 text-secondary-foreground"];
  return (
    <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${cls}`}>{label}</span>
  );
}
