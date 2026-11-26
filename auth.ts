import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Resend from "next-auth/providers/resend";
import Yandex from "next-auth/providers/yandex";
import { PrismaAdapter } from "@auth/prisma-adapter";

import { prisma } from "@/lib/prisma";

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
  providers: [
    ...(process.env.RESEND_API_KEY
      ? [
          Resend({
            apiKey: process.env.RESEND_API_KEY,
            from: process.env.EMAIL_FROM ?? "NeoLeng <no-reply@neoleng.ru>",
          }),
        ]
      : []),
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
    credentialsProvider,
  ],
});
