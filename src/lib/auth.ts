/* eslint-disable @typescript-eslint/no-explicit-any */
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { AuthUtils } from "@/lib/auth-utils";
import type { JWT } from "next-auth/jwt";

// Token refresh stub
async function refreshAccessToken(token: JWT): Promise<JWT> {
  try {
    return {
      ...token,
      accessTokenExpires: Date.now() + 24 * 60 * 60 * 1000, // +24h
      refreshTokenExpires: Date.now() + 90 * 24 * 60 * 60 * 1000, // +90d
    };
  } catch (error) {
    console.error("Error refreshing access token:", error);
    return { ...token, error: "RefreshAccessTokenError" };
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        try {
          const user = await AuthUtils.validateUser(
            credentials.email,
            credentials.password
          );
          if (!user) return null;

          // Minimal user payload for JWT
          return {
            id: String(user._id),
            email: user.email ?? null,
            name: user.name ?? null,
            role: user.role,
            team: user.team ? String(user.team) : undefined,
          } as any;
        } catch (err) {
          console.error("Authentication error:", err);
          return null;
        }
      },
    }),
  ],

  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },

  session: {
    strategy: "jwt", // keep literal so TS infers the union
    maxAge: 24 * 60 * 60, // seconds
  },

  jwt: {
    maxAge: 24 * 60 * 60, // seconds
  },

  callbacks: {
    async jwt({ token, user }) {
      // Initial sign-in
      if (user) {
        // Update last login timestamp for any authentication method
        try {
          if ((user as any).id) {
            await AuthUtils.updateLastLogin((user as any).id);
          }
        } catch (error) {
          console.error("Failed to update last login in JWT callback:", error);
        }

        token.user = {
          id: (user as any).id,
          email: (user as any).email ?? null,
          name: (user as any).name ?? null,
          role: (user as any).role,
          team: (user as any).team,
        };
        // If you mint real tokens, set them here
        token.accessToken ??= undefined;
        token.refreshToken ??= undefined;
        token.accessTokenExpires = Date.now() + 24 * 60 * 60 * 1000; // +24h
        token.refreshTokenExpires = Date.now() + 90 * 24 * 60 * 60 * 1000; // +90d
        return token;
      }

      // Reuse if still valid
      if (token.accessTokenExpires && Date.now() < token.accessTokenExpires) {
        return token;
      }

      // Try refresh
      if (token.refreshTokenExpires && Date.now() < token.refreshTokenExpires) {
        return refreshAccessToken(token);
      }

      // Force re-auth
      return { ...token, error: "RefreshAccessTokenError" };
    },

    async session({ session, token }) {
      if (token.user) {
        session.user = {
          ...(session.user || {}),
          id: token.user.id,
          email: token.user.email ?? null,
          name: token.user.name ?? null,
          role: token.user.role,
          team: token.user.team,
        };
      }
      if (token.accessToken) session.accessToken = token.accessToken;
      if (token.error) session.error = token.error;
      return session;
    },
  },

  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
};
