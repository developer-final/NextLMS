import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import type { UserRole } from "@/types";

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/auth/login",
    error: "/auth/login",
  },
  providers: [
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Please enter your email and password");
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase().trim() },
        });

        if (!user) {
          throw new Error("Invalid email or password");
        }

        if (!user.passwordHash) {
          throw new Error(
            "This account was registered via Google. Please sign in with Google or use 'Forgot Password' to set a password."
          );
        }

        if (user.status === "BLOCKED") {
          throw new Error("Your account has been suspended. Please contact support.");
        }

        if (process.env.REQUIRE_EMAIL_VERIFICATION === "true" && !user.emailVerified) {
          throw new Error("Please verify your email before logging in.");
        }

        const isValid = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!isValid) {
          throw new Error("Invalid email or password");
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role as UserRole,
          status: user.status,
          avatarUrl: user.avatarUrl,
          emailVerified: user.emailVerified,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        if (!user.email) return false;
        const cleanEmail = user.email.toLowerCase().trim();

        let dbUser = await prisma.user.findUnique({
          where: { email: cleanEmail },
        });

        if (dbUser) {
          if (dbUser.status === "BLOCKED") {
            throw new Error("Your account has been suspended. Please contact support.");
          }
          // Mark emailVerified if not set yet
          if (!dbUser.emailVerified) {
            dbUser = await prisma.user.update({
              where: { id: dbUser.id },
              data: { emailVerified: new Date() },
            });
          }
        } else {
          const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase().trim();
          const role = adminEmail && cleanEmail === adminEmail ? "ADMIN" : "STUDENT";

          dbUser = await prisma.user.create({
            data: {
              email: cleanEmail,
              name: user.name || "Google Student",
              avatarUrl: user.image || null,
              role,
              status: "ACTIVE",
              emailVerified: new Date(),
            },
          });
        }

        // Link OAuth account record
        await prisma.account.upsert({
          where: {
            provider_providerAccountId: {
              provider: account.provider,
              providerAccountId: account.providerAccountId,
            },
          },
          update: {
            access_token: account.access_token,
            refresh_token: account.refresh_token,
            expires_at: account.expires_at,
            id_token: account.id_token,
            scope: account.scope,
            token_type: account.token_type,
          },
          create: {
            userId: dbUser.id,
            type: account.type,
            provider: account.provider,
            providerAccountId: account.providerAccountId,
            access_token: account.access_token,
            refresh_token: account.refresh_token,
            expires_at: account.expires_at,
            id_token: account.id_token,
            scope: account.scope,
            token_type: account.token_type,
          },
        });

        // Pass ID and fields for downstream JWT callback
        user.id = dbUser.id;
        (user as any).role = dbUser.role;
        (user as any).status = dbUser.status;
        (user as any).avatarUrl = dbUser.avatarUrl;
        (user as any).emailVerified = dbUser.emailVerified;

        return true;
      }

      return true;
    },
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role || "STUDENT";
        token.status = (user as any).status || "ACTIVE";
        token.avatarUrl = (user as any).avatarUrl;
        token.emailVerified = (user as any).emailVerified;
      }
      if (trigger === "update" && session) {
        token.name = session.name || token.name;
        token.avatarUrl = session.avatarUrl || token.avatarUrl;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token) {
        session.user.id = token.id;
        session.user.role = (token.role as UserRole) || "STUDENT";
        session.user.status = token.status || "ACTIVE";
        session.user.avatarUrl = token.avatarUrl;
        session.user.emailVerified = token.emailVerified;
      }
      return session;
    },
  },
  secret: (() => {
    const secret = process.env.NEXTAUTH_SECRET;
    if (!secret && process.env.NODE_ENV === "production") {
      throw new Error("NEXTAUTH_SECRET environment variable must be set in production");
    }
    return secret || "default_super_secret_for_dev_jwt_key_2026";
  })(),
};
