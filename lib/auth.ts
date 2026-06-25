import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

const GOOGLE_SCOPES = [
  "openid",
  "email",
  "profile",
  "https://www.googleapis.com/auth/spreadsheets",
].join(" ");

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: GOOGLE_SCOPES,
          access_type: "offline",
          prompt: "consent",
        },
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, account }) {
      if (account) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.expiresAt = account.expires_at;
      }

      const expiresAt = typeof token.expiresAt === "number" ? token.expiresAt : 0;
      const isExpired = Date.now() >= expiresAt * 1000;

      if (isExpired && token.refreshToken) {
        try {
          const res = await fetch("https://oauth2.googleapis.com/token", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
              client_id: process.env.GOOGLE_CLIENT_ID!,
              client_secret: process.env.GOOGLE_CLIENT_SECRET!,
              grant_type: "refresh_token",
              refresh_token: token.refreshToken as string,
            }),
          });
          const refreshed = await res.json();
          if (res.ok) {
            token.accessToken = refreshed.access_token;
            token.expiresAt = Math.floor(Date.now() / 1000) + refreshed.expires_in;
          }
        } catch (err) {
          console.error("Failed to refresh Google access token", err);
        }
      }

      return token;
    },
    async session({ session, token }) {
      (session as any).accessToken = token.accessToken;
      return session;
    },
  },
};
