import { CURRENCY } from "@/lib/sample-data";

export const money = (n: number) =>
  `${n < 0 ? "−" : ""}${CURRENCY}${Math.abs(n).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

export const signedMoney = (n: number) => (n > 0 ? `+${money(n)}` : money(n));

export const pct = (r: number | null) => (r === null ? "—" : `${(r * 100).toFixed(1)}%`);

export const when = (t: number) =>
  new Date(t).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

export const toneOf = (n: number) => (n > 0 ? "text-up" : n < 0 ? "text-down" : "text-foreground");
