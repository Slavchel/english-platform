import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

import { prisma } from "@/lib/prisma";

const TEST_EMAILS = Array.from(
  { length: 10 },
  (_, index) => `test${String(index + 1).padStart(2, "0")}@example.com`,
);

// Email provider is temporarily disabled for local development.
// import Email from "next-auth/providers/email";

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  secret: process.env.AUTH_SECRET,
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    // Email({
    //   server: process.env.EMAIL_SERVER,
    //   from: process.env.EMAIL_FROM,
    // }),
    Credentials({
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
    }),
  ],
});
