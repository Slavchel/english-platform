import { prisma } from "@/lib/prisma";

const VK_ID_TOKEN_URL = "https://id.vk.ru/oauth2/auth";
const VK_ID_USERINFO_URL = "https://id.vk.ru/oauth2/user_info";

export const VK_ID_CLIENT_ID =
  process.env.VK_ID_CLIENT_ID?.trim() || "54924531";

export const VK_ID_REDIRECT_URL =
  process.env.VK_ID_REDIRECT_URL?.trim() ||
  "https://neoleng.ru/api/auth/callback/vk";

type VkIdTokenResponse = {
  access_token?: string;
  user_id?: number | string;
  error?: string;
  error_description?: string;
};

type VkIdUserInfoResponse = {
  user?: {
    user_id?: number | string;
    first_name?: string;
    last_name?: string;
    email?: string;
    avatar?: string;
    verified?: boolean;
  };
  error?: string;
  error_description?: string;
};

export class VkIdAccountConflictError extends Error {
  constructor() {
    super("VK ID account is not linked to the existing user");
    this.name = "VkIdAccountConflictError";
  }
}

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function validatePkceValue(value: string) {
  return /^[A-Za-z0-9_-]{43,128}$/.test(value);
}

async function readJson<T>(response: Response): Promise<T> {
  try {
    return (await response.json()) as T;
  } catch {
    return {} as T;
  }
}

export async function exchangeVkIdCode({
  code,
  deviceId,
  codeVerifier,
  state,
}: {
  code: string;
  deviceId: string;
  codeVerifier: string;
  state: string;
}) {
  if (!code || !deviceId || !state || !validatePkceValue(codeVerifier)) {
    throw new Error("Invalid VK ID authorization payload");
  }

  const tokenBody = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    code_verifier: codeVerifier,
    redirect_uri: VK_ID_REDIRECT_URL,
    client_id: VK_ID_CLIENT_ID,
    device_id: deviceId,
    state,
  });

  const serviceToken = process.env.VK_ID_SERVICE_TOKEN?.trim();
  if (serviceToken) {
    tokenBody.set("service_token", serviceToken);
  }

  const tokenResponse = await fetch(VK_ID_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: tokenBody,
    cache: "no-store",
  });
  const tokenData = await readJson<VkIdTokenResponse>(tokenResponse);

  if (!tokenResponse.ok || tokenData.error || !tokenData.access_token) {
    throw new Error(
      `VK ID token exchange failed: ${tokenData.error ?? tokenResponse.status}`,
    );
  }

  const userInfoBody = new URLSearchParams({
    access_token: tokenData.access_token,
    client_id: VK_ID_CLIENT_ID,
  });
  const userInfoResponse = await fetch(VK_ID_USERINFO_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: userInfoBody,
    cache: "no-store",
  });
  const userInfoData = await readJson<VkIdUserInfoResponse>(userInfoResponse);

  if (!userInfoResponse.ok || userInfoData.error || !userInfoData.user) {
    throw new Error(
      `VK ID user info failed: ${userInfoData.error ?? userInfoResponse.status}`,
    );
  }

  const vkUser = userInfoData.user;
  const vkUserId = String(vkUser.user_id ?? tokenData.user_id ?? "").trim();
  const tokenUserId = String(tokenData.user_id ?? "").trim();

  if (!vkUserId || (tokenUserId && tokenUserId !== vkUserId)) {
    throw new Error("VK ID user id mismatch");
  }

  const email = vkUser.email ? normalizeEmail(vkUser.email) : "";
  if (!email) {
    throw new Error("VK ID did not return an email");
  }

  const linkedAccount = await prisma.account.findUnique({
    where: {
      provider_providerAccountId: {
        provider: "vk",
        providerAccountId: vkUserId,
      },
    },
    include: { user: true },
  });

  if (linkedAccount?.user) {
    return linkedAccount.user;
  }

  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    // Never merge VK ID into an existing email account automatically.
    // The user must explicitly link accounts in a separate, authenticated flow.
    throw new VkIdAccountConflictError();
  }

  const displayName =
    [vkUser.first_name, vkUser.last_name].filter(Boolean).join(" ").trim() ||
    email.split("@")[0];

  try {
    return await prisma.$transaction(async (transaction) => {
      const user = await transaction.user.create({
        data: {
          email,
          name: displayName,
          image: vkUser.avatar ?? null,
        },
      });

      await transaction.account.create({
        data: {
          userId: user.id,
          type: "oauth",
          provider: "vk",
          providerAccountId: vkUserId,
        },
      });

      return user;
    });
  } catch (error) {
    // A concurrent request may have created the account/user.
    const concurrentAccount = await prisma.account.findUnique({
      where: {
        provider_providerAccountId: {
          provider: "vk",
          providerAccountId: vkUserId,
        },
      },
      include: { user: true },
    });
    if (concurrentAccount?.user) {
      return concurrentAccount.user;
    }
    throw error;
  }
}
