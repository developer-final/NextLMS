import { UserRole } from "@/types";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      role: UserRole;
      status?: string;
      avatarUrl?: string | null;
    };
  }
  interface User {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    status?: string;
    avatarUrl?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: UserRole;
    status?: string;
    avatarUrl?: string | null;
  }
}

