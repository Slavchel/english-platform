import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

import {
  CONSENT_COOKIE_NAME,
  CONSENT_INTENT_MAX_AGE_SECONDS,
  PERSONAL_DATA_VERSION,
  PRIVACY_POLICY_VERSION,
} from "./constants";

export type ConsentStamp = {
  version: string;
  acceptedAt: string;
};

export type ConsentIntent = {
  privacy: ConsentStamp;
  personalData: ConsentStamp;
  userAgent: string;
};

function getSecret(): string {
  const secret =
    process.env.CONSENT_HMAC_SECRET?.trim() ||
    process.env.AUTH_SECRET?.trim();

  if (!secret) {
    throw new Error("Consent signing secret is not configured");
  }

  return secret;
}

function sign(value: string): string {
  return createHmac("sha256", getSecret()).update(value).digest("base64url");
}

function isValidStamp(value: unknown, expectedVersion: string): value is ConsentStamp {
  if (!value || typeof value !== "object") return false;
  const stamp = value as Partial<ConsentStamp>;
  if (stamp.version !== expectedVersion) return false;
  if (typeof stamp.acceptedAt !== "string") return false;
  return !Number.isNaN(new Date(stamp.acceptedAt).getTime());
}

export function encodeConsentIntent(intent: ConsentIntent): string {
  const payload = Buffer.from(JSON.stringify(intent), "utf8").toString(
    "base64url",
  );
  return `${payload}.${sign(payload)}`;
}

export function decodeConsentIntent(value: string): ConsentIntent | null {
  const [payload, signature] = value.split(".");
  if (!payload || !signature) return null;

  try {
    const expected = sign(payload);
    const actualBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expected);
    if (actualBuffer.length !== expectedBuffer.length) return null;
    if (!timingSafeEqual(actualBuffer, expectedBuffer)) return null;

    const parsed = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8"),
    ) as Partial<ConsentIntent>;

    if (!isValidStamp(parsed.privacy, PRIVACY_POLICY_VERSION)) return null;
    if (!isValidStamp(parsed.personalData, PERSONAL_DATA_VERSION)) return null;

    return {
      privacy: parsed.privacy,
      personalData: parsed.personalData,
      userAgent:
        typeof parsed.userAgent === "string"
          ? parsed.userAgent.slice(0, 255)
          : "Unknown",
    };
  } catch {
    return null;
  }
}

export async function setConsentIntent(intent: ConsentIntent): Promise<void> {
  const store = await cookies();
  store.set(CONSENT_COOKIE_NAME, encodeConsentIntent(intent), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: CONSENT_INTENT_MAX_AGE_SECONDS,
  });
}

export async function clearConsentIntent(): Promise<void> {
  const store = await cookies();
  store.delete(CONSENT_COOKIE_NAME);
}

export async function readConsentIntent(): Promise<ConsentIntent | null> {
  const store = await cookies();
  const value = store.get(CONSENT_COOKIE_NAME)?.value;
  if (!value) return null;
  return decodeConsentIntent(value);
}
