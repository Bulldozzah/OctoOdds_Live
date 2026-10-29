import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env["VITE_SUPABASE_URL"] as string | undefined;
const supabaseAnonKey = import.meta.env["VITE_SUPABASE_ANON_KEY"] as string | undefined;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env.local");
}

// The app is server-rendered, so this module also runs on the server, where
// there is no localStorage and no session. Session persistence is therefore
// browser-only: on the server the client stays anonymous.
const isBrowser = typeof window !== "undefined";

// Same Supabase project as OctoOdds, so accounts, profiles and bets are shared.
export const supabase = createClient(supabaseUrl ?? "", supabaseAnonKey ?? "", {
  auth: {
    persistSession: isBrowser,
    autoRefreshToken: isBrowser,
    detectSessionInUrl: isBrowser,
  },
});

export type ProfileRole = "user" | "admin" | "superuser";
export type SubscriptionPlan = "monthly" | "biannual" | "annual";

export interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  role: ProfileRole;
  is_paid: boolean;
  subscription_plan: SubscriptionPlan | null;
  subscription_started_at: string | null;
  /** Access lapses once this is in the past; null means an indefinite grant. */
  subscription_expires_at: string | null;
  created_at: string;
}

/** Subscription plans, same as OctoOdds. Prices in USD. */
export const SUBSCRIPTION_PLANS: {
  id: SubscriptionPlan;
  name: string;
  months: number;
  price: number;
}[] = [
  { id: "monthly", name: "1 Month", months: 1, price: 5 },
  { id: "biannual", name: "6 Months", months: 6, price: 25 },
  { id: "annual", name: "1 Year", months: 12, price: 50 },
];

/** Admins and superusers never pay; a regular user needs an active paid subscription. */
export function hasPaidAccess(profile: Profile | null | undefined): boolean {
  if (!profile) return false;
  if (profile.role === "admin" || profile.role === "superuser") return true;
  if (!profile.is_paid) return false;
  if (!profile.subscription_expires_at) return true;
  return new Date(profile.subscription_expires_at).getTime() > Date.now();
}
