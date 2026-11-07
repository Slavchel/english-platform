import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { User } from "@supabase/supabase-js";

function isServiceRoleKey(key: string): boolean {
  if (key.startsWith("sb_secret_") || key.includes("service_role")) {
    return true;
  }

  const payload = key.split(".")[1];
  if (!payload) return false;

  try {
    const decoded = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8"),
    ) as { role?: unknown };
    return decoded.role === "service_role";
  } catch {
    return false;
  }
}

export function getSupabaseConfig(): {
  url: string;
  anonKey: string;
} | null {
  const rawUrl =
    process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey =
    process.env.SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!rawUrl || !anonKey) return null;

  let url = rawUrl.trim();
  // A common .env mistake is pasting "SUPABASE_URL=" into the value.
  url = url.replace(/^SUPABASE_URL=/, "");
  // Supabase expects the project root, not the REST/Auth API paths.
  url = url.replace(/\/+$/, "");
  url = url.replace(/\/(auth|rest)\/v1$/, "");
  url = url.replace(/\/+$/, "");

  try {
    new URL(url);
  } catch {
    console.error("[supabase] Invalid SUPABASE_URL configuration.");
    return null;
  }

  if (isServiceRoleKey(anonKey)) {
    console.error(
      "[supabase] A secret/service_role key was supplied where the anon/publishable key is required.",
    );
    return null;
  }

  return { url, anonKey };
}

export async function createSupabaseServerClient() {
  const config = getSupabaseConfig();
  if (!config) {
    throw new Error("Supabase не настроен.");
  }

  const cookieStore = await cookies();

  return createServerClient(config.url, config.anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Server Components cannot write cookies; the proxy/action context
          // will persist the refreshed session instead.
        }
      },
    },
  });
}

export async function getCurrentUser(): Promise<User | null> {
  if (!getSupabaseConfig()) return null;

  try {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase.auth.getUser();
    return data.user ?? null;
  } catch {
    return null;
  }
}
