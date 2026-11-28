import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Nodemailer from "next-auth/providers/nodemailer";
import Yandex from "next-auth/providers/yandex";
import { PrismaAdapter } from "@auth/prisma-adapter";

import { exchangeVkIdCode } from "@/lib/auth/vk-id";
import { commitPendingConsents } from "@/lib/consent/commit";
import { getEmailFrom, getSmtpConfig } from "@/lib/email/smtp";
import { prisma } from "@/lib/prisma";

const smtpConfig = getSmtpConfig();
const smtpProvider = smtpConfig
  ? {
      ...Nodemailer({
        server: smtpConfig,
        from: getEmailFrom(),
      }),
      id: "email",
      name: "Email",
    }
  : null;

const TEST_EMAILS = Array.from(
  { length: 10 },
  (_, index) => `test${String(index + 1).padStart(2, "0")}@example.com`,
);
const ADMIN_EMAIL = "test01@example.com";

const credentialsProvider = Credentials({
  name: "Test email",
  credentials: {
    email: {
      label: "Email",
      type: "email",
    },
  },
  async authorize(credentials) {
    const email = String(credentials?.email ?? "")
      .trim()
      .toLowerCase();

    if (!TEST_EMAILS.includes(email)) {
      return null;
    }

    try {
      const user = await prisma.user.upsert({
        where: { email },
        update: {
          name: `Test User ${email.slice(4, 6)}`,
        },
        create: {
          email,
          name: `Test User ${email.slice(4, 6)}`,
        },
      });

      return {
        id: user.id,
        email: user.email,
        name: user.name,
      };
    } catch (error) {
      console.error("[auth] Failed to create test user", error);
      return null;
    }
  },
});

const vkIdProvider = Credentials({
  id: "vk",
  name: "VK ID",
  credentials: {
    code: { type: "text" },
    deviceId: { type: "text" },
    codeVerifier: { type: "text" },
    state: { type: "text" },
  },
  async authorize(credentials) {
    const code = String(credentials?.code ?? "");
    const deviceId = String(credentials?.deviceId ?? "");
    const codeVerifier = String(credentials?.codeVerifier ?? "");
    const state = String(credentials?.state ?? "");

    if (!code || !deviceId || !codeVerifier || !state) {
      return null;
    }

    try {
      const user = await exchangeVkIdCode({
        code,
        deviceId,
        codeVerifier,
        state,
      });

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
      };
    } catch (error) {
      console.error(
        "[auth] VK ID sign-in failed",
        error instanceof Error ? error.message : "unknown error",
      );
      return null;
    }
  },
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  secret: process.env.AUTH_SECRET,
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      token.isAdmin = (user?.email ?? token.email) === ADMIN_EMAIL;
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.isAdmin =
          Boolean(token.isAdmin) || session.user.email === ADMIN_EMAIL;
      }
      return session;
    },
  },
  events: {
    async signIn({ user }) {
      if (!user.id || !user.email) return;

      try {
        await commitPendingConsents(user.id, user.email);
      } catch (error) {
        console.error(
          "[consent] Failed to commit pending consents",
          error instanceof Error ? error.message : "unknown error",
        );
      }
    },
  },
  providers: [
    ...(smtpProvider ? [smtpProvider] : []),
    ...(process.env.AUTH_YANDEX_ID && process.env.AUTH_YANDEX_SECRET
      ? [
          Yandex({
            clientId: process.env.AUTH_YANDEX_ID,
            clientSecret: process.env.AUTH_YANDEX_SECRET,
            authorization:
              "https://oauth.yandex.ru/authorize?scope=login:info+login:email",
            allowDangerousEmailAccountLinking: true,
          }),
        ]
      : []),
    vkIdProvider,
    credentialsProvider,
  ],
});
