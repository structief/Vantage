import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import { prisma } from "@/lib/db";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    GitHub({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
      authorization: {
        params: {
          scope: "read:user repo read:org",
        },
      },
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider !== "github" || !profile) return false;

      const githubProfile = profile as {
        login?: string;
        name?: string | null;
        avatar_url?: string;
      };

      const login = githubProfile.login;
      const name = githubProfile.name ?? login ?? user.email ?? "Unknown";
      const avatar_url = githubProfile.avatar_url ?? user.image ?? "";

      if (!login) return false;

      await prisma.userProfile.upsert({
        where: { github_login: login },
        create: { github_login: login, name, avatar_url },
        update: { name, avatar_url },
      });

      return true;
    },

    async jwt({ token, account, profile }) {
      if (account?.provider === "github" && profile) {
        const githubProfile = profile as {
          login?: string;
          name?: string | null;
          avatar_url?: string;
        };
        token.login = githubProfile.login;
        token.name = githubProfile.name ?? githubProfile.login;
        token.avatarUrl = githubProfile.avatar_url;
        token.accessToken = account.access_token;
      }
      return token;
    },

    async session({ session, token }) {
      session.user.login = token.login as string;
      session.user.name = token.name as string;
      session.user.image = token.avatarUrl as string;
      (session as { accessToken?: string }).accessToken =
        token.accessToken as string;
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
});
