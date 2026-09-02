import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
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
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Vui lòng nhập đầy đủ Email và Mật khẩu");
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase().trim() },
        });

        if (!user || !user.passwordHash) {
          throw new Error("Tài khoản hoặc mật khẩu không chính xác");
        }

        if (user.status === "BLOCKED") {
          throw new Error("Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.");
        }

        const isValid = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!isValid) {
          throw new Error("Tài khoản hoặc mật khẩu không chính xác");
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role as UserRole,
          avatarUrl: user.avatarUrl,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.role = user.role || "STUDENT";
        token.avatarUrl = user.avatarUrl;
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
        session.user.avatarUrl = token.avatarUrl;
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
