import "next-auth";

declare module "next-auth" {
  interface Session {
    accessToken?: string;
    user: {
      login: string;
      name: string;
      email?: string | null;
      image?: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    login?: string;
    avatarUrl?: string;
    accessToken?: string;
  }
}
