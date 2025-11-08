import NextAuth from 'next-auth';
import supabase from '../../../config/supabaseClient';

const addPendingBadges = async (userId) => {
  const { data: pendingBadges } = await supabase
    .from('pending_badges')
    .select('badge_id')
    .eq('user_id', userId);

  if (pendingBadges && pendingBadges.length > 0) {
    for (const badge of pendingBadges) {
      await supabase
        .from('users_badges')
        .upsert(
          { user_id: userId, badge_id: badge.badge_id },
          { onConflict: 'user_id,badge_id' }
        );
    }

    await supabase.from('pending_badges').delete().eq('user_id', userId);
  }
  return;
};

const postUserDBsupabase = async (profile) => {
  const { data, error } = await supabase.from('users').insert([
    {
      id: profile.id,
      username: profile.username,
      banner: profile.cover_url,
      country: JSON.stringify(profile.country),
      playmode: profile.playmode,
      discord: profile.discord,
      twitter: profile.twitter,
    },
  ]);

  if (error) {
    console.log(error);
    return;
  }

  await addPendingBadges(profile.id);

  return;
};

const checkUserDBsupabase = async (profile) => {
  const player = await supabase.from('users').select('*').eq('id', profile.id);

  if (player.data && player.data.length > 0) {
    const { data, error } = await supabase
      .from('users')
      .update({
        username: profile.username,
        banner: profile.cover_url,
        country: JSON.stringify(profile.country),
      })
      .eq('id', profile.id);

    if (error) {
      console.log(error);
      return;
    }

    await addPendingBadges(profile.id);

    return;
  }
  if (!player.data.length) {
    return postUserDBsupabase(profile);
  }
};

export default NextAuth({
  providers: [
    {
      id: 'osu',
      name: 'Osu!',
      type: 'oauth',
      token: 'https://osu.ppy.sh/oauth/token',
      authorization: {
        url: 'https://osu.ppy.sh/oauth/authorize',
        params: {
          scope: 'identify public',
        },
      },
      userinfo: 'https://osu.ppy.sh/api/v2/me',
      profile(profile) {
        return {
          id: profile.id,
          name: profile.username,
          image: profile.avatar_url,
          email: null,
        };
      },
      clientId: process.env.OSU_CLIENT_ID,
      clientSecret: process.env.OSU_CLIENT_SECRET,
    },
  ],

  session: {
    strategy: 'jwt',
  },

  callbacks: {
    async session({ session, user, token }) {
      // Get data from OSU API
      const userData = await fetch(`https://osu.ppy.sh/api/v2/me`, {
        headers: {
          Authorization: `Bearer ${token?.access_token}`,
        },
      }).then((res) => res.json());

      if (userData.authentication === 'basic') return {};

      userData.access_token = token?.access_token;
      userData;

      return userData;
    },
    async jwt({ token, account, profile }) {
      if (account?.access_token) {
        token.access_token = account.access_token;
        token.refresh_token = account.refresh_token;

        // Write user in database
        checkUserDBsupabase(profile);
      }

      return token;
    },
  },
});
