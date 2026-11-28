import { createHmac } from "node:crypto";

export function buildSubjectRef(email: string): string {
  const secret =
    process.env.CONSENT_HMAC_SECRET?.trim() ||
    process.env.AUTH_SECRET?.trim();

  if (!secret) {
    throw new Error("Consent HMAC secret is not configured");
  }

  return createHmac("sha256", secret)
    .update(email.trim().toLowerCase())
    .digest("hex");
}
