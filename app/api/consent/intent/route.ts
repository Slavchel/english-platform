import { NextResponse } from "next/server";

import {
  PERSONAL_DATA_VERSION,
  PRIVACY_POLICY_VERSION,
} from "@/lib/consent/constants";
import {
  clearConsentIntent,
  setConsentIntent,
  type ConsentIntent,
} from "@/lib/consent/cookie";
import { summarizeUserAgent } from "@/lib/consent/user-agent";

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");

  if (origin && host) {
    try {
      if (new URL(origin).host !== host) {
        return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
      }
    } catch {
      return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
    }
  }

  let body: { privacy?: unknown; personalData?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const privacy = body.privacy === true;
  const personalData = body.personalData === true;

  if (!privacy || !personalData) {
    await clearConsentIntent();
    return NextResponse.json({ ok: true, recorded: false });
  }

  const acceptedAt = new Date().toISOString();
  const intent: ConsentIntent = {
    privacy: {
      version: PRIVACY_POLICY_VERSION,
      acceptedAt,
    },
    personalData: {
      version: PERSONAL_DATA_VERSION,
      acceptedAt,
    },
    userAgent: summarizeUserAgent(request.headers.get("user-agent")),
  };

  await setConsentIntent(intent);

  return NextResponse.json({ ok: true, recorded: false });
}
