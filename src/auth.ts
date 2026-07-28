import NextAuth from "next-auth";
import { syncUserOnLogin } from "@/lib/users";

// osu! stores everything we need in the userinfo (/api/v2/me) response, which
// NextAuth exposes as `profile` on initial sign-in. We persist the fields we use
// into the JWT there, so the `session` callback never has to call osu! again.
export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  secret: process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET,
  session: { strategy: "jwt" },
  providers: [
    {
      id: "osu",
      name: "osu!",
      type: "oauth",
      clientId: process.env.OSU_CLIENT_ID,
      clientSecret: process.env.OSU_CLIENT_SECRET,
      authorization: {
        url: "https://osu.ppy.sh/oauth/authorize",
        params: { scope: "identify public" },
      },
      token: "https://osu.ppy.sh/oauth/token",
      userinfo: "https://osu.ppy.sh/api/v2/me",
      checks: ["state"],
      profile(profile: any) {
        return {
          id: String(profile.id),
          name: profile.username,
          image: profile.avatar_url,
        };
      },
    },
  ],
  callbacks: {
    async jwt({ token, account, profile }: any) {
      if (account && profile) {
        token.access_token = account.access_token;
        token.refresh_token = account.refresh_token;
        token.osu = {
          id: profile.id,
          username: profile.username,
          avatar_url: profile.avatar_url,
          cover_url: profile.cover_url,
          country: profile.country,
          playmode: profile.playmode,
        };

        // Upsert the user + move pending badges to assigned (login flow).
        await syncUserOnLogin(profile);
      }
      return token;
    },
    async session({ session, token }: any) {
      // Expose the osu! fields at the top level to match the shape consumers
      // already read (session.id, session.username, session.avatar_url, ...).
      return {
        ...session,
        ...(token.osu ?? {}),
        access_token: token.access_token,
      };
    },
  },
});
