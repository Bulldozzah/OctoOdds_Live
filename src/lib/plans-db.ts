/**
 * Saved Calculator plans in the shared Supabase `bets` table (row-level
 * security limits every query to the signed-in user's own bets).
 */
import { supabase } from "./supabase";
import type { SavedPlan } from "./calculator-plans";
import { betToPlan, planToBet, wonScenarioName, type BetRecord } from "./plan-mapping";

export async function fetchPlans(): Promise<SavedPlan[]> {
  const { data, error } = await supabase
    .from("bets")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return ((data ?? []) as BetRecord[]).map(betToPlan);
}

/** Insert a new plan; returns it as saved (with the database id and timestamp). */
export async function insertPlan(plan: SavedPlan, userId: string): Promise<SavedPlan> {
  const { data, error } = await supabase
    .from("bets")
    .insert({ ...planToBet(plan), user_id: userId })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return betToPlan(data as BetRecord);
}

/** Overwrite a plan's contents. Its settlement (won_scenario) is left alone. */
export async function updatePlan(plan: SavedPlan): Promise<SavedPlan> {
  const { data, error } = await supabase
    .from("bets")
    .update(planToBet(plan))
    .eq("id", plan.id)
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return betToPlan(data as BetRecord);
}

/**
 * Write a plan's result (or clear it, when wonScenario is null), together with
 * any stakes/odds corrected while settling.
 */
export async function savePlanResult(plan: SavedPlan): Promise<SavedPlan> {
  const won = wonScenarioName(plan);
  const { data, error } = await supabase
    .from("bets")
    .update({
      rows: planToBet(plan).rows,
      won_scenario: won,
      settled_at: won ? new Date(plan.settledAt ?? Date.now()).toISOString() : null,
    })
    .eq("id", plan.id)
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return betToPlan(data as BetRecord);
}

export async function deletePlan(id: string): Promise<void> {
  const { error } = await supabase.from("bets").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
