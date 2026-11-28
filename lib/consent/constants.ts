export const PRIVACY_POLICY_VERSION = "2026-11-28";
export const PERSONAL_DATA_VERSION = "2026-11-28";

export const CONSENT_COOKIE_NAME = "neoleng_consent_intent";
export const CONSENT_INTENT_MAX_AGE_SECONDS = 60 * 60 * 24;
export const CONSENT_RETENTION_YEARS = 3;

export function addConsentRetentionYears(date: Date): Date {
  const result = new Date(date);
  result.setUTCFullYear(result.getUTCFullYear() + CONSENT_RETENTION_YEARS);
  return result;
}
