/**
 * Facts the legal pages and the sign-up box share. Change them here once and
 * every policy, the footer links and the recorded acceptance stay in step.
 */
export const BUSINESS_NAME = "OctoOdds";
export const SUPPORT_EMAIL = "support@octoodds.com";
export const MIN_AGE = 18;
export const GOVERNING_LAW = "the Republic of Zambia";
export const DATA_LAW = "the Data Protection Act No. 3 of 2023 of Zambia";
export const LAST_UPDATED = "7 November 2026";

/**
 * Bump when the Terms, Privacy or Refund policy change in a way that needs
 * fresh agreement. Stored on the account at sign-up as proof of what was accepted.
 */
export const TERMS_VERSION = "2026-11-07";

export const LEGAL_LINKS = [
  { to: "/terms", label: "Terms & Conditions" },
  { to: "/privacy", label: "Privacy Policy" },
  { to: "/cookies", label: "Cookie Policy" },
  { to: "/refunds", label: "Refunds & Cancellation" },
] as const;
