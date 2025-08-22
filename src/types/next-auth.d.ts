import { DefaultSession } from "next-auth";
import { DefaultJWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session extends DefaultSession {
    user: DefaultSession["user"] & {
      id: string;
      email?: string | null;
      name?: string | null;
      role?: string | null;
      team?: string | null;
      image?: string | null;
    };
    accessToken?: string;
    error?: string;
  }

  interface User {
    id: string;
    email?: string | null;
    name?: string | null;
    role?: string | null;
    team?: string | null;
    image?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    user?: {
      id: string;
      email?: string | null;
      name?: string | null;
      role?: string | null;
      team?: string | null;
    };
    accessToken?: string;
    refreshToken?: string;
    accessTokenExpires?: number;
    refreshTokenExpires?: number;
    error?: string;
  }
}

// Important if you use an adapter (e.g. Prisma) or anywhere NextAuth uses AdapterUser
declare module "next-auth/adapters" {
  interface AdapterUser {
    role?: string | null;
    team?: string | null;
  }
}
