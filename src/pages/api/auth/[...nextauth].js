import NextAuth from "next-auth";
import Airtable from "airtable";
import { v4 as uuidv4 } from "uuid";

const playmodes = {
  osu: 0,
  mania: 1,
  taiko: 2,
  fruits: 3,
};

const postUserDB = (profile) => {
  const base = new Airtable({ apiKey: process.env.AIRTABLE_APIKEY }).base(
    process.env.AIRTABLE_BASE
  );

  base("Users").create(
    [
      {
        fields: {
          IDuser: profile.id,
          Username: profile.username,
          UUID: uuidv4(),
          Banner: profile.cover_url,
          Country: JSON.stringify(profile.country),
          PlayMode: profile.playmode,
          Badges: "[]",
          Discord: profile.discord,
          Twitter: profile.twitter,
        },
      },
    ],
    function (err, records) {
      if (err) {
        console.error(err);
        return;
      }
    }
  );
};

const checkUserDB = (profile) => {
  const base = new Airtable({ apiKey: process.env.AIRTABLE_APIKEY }).base(
    process.env.AIRTABLE_BASE
  );

  var mapped = "";

  base("Users")
    .select({
      filterByFormula: `IF({IDuser} = '${profile.id}' , TRUE())`,
      view: "Grid view",
    })
    .eachPage(
      function page(records, fetchNextPage) {
        mapped = records.map((record) => {
          return record.fields;
        });

        if (mapped[0] === undefined || mapped === undefined) {
          postUserDB(profile);
        }

        console.log(mapped[0]);

        /* Check if UUID exist otherwise will assign an UUID to the current user */
        if (
          mapped[0].UUID == "" ||
          mapped[0].UUID == null ||
          mapped[0].UUID == undefined
        ) {
          base("Users").update(
            [
              {
                id: mapped[0].RecordID,
                fields: {
                  UUID: uuidv4(),
                },
              },
            ],
            function (err) {
              if (err) {
                console.error(err);
                return;
              }
            }
          );
        }

        /* When logging updates username and banner */
        /* if (mapped || mapped[0]) {
          base("Users").update(
            [
              {
                id: mapped[0].RecordID,
                fields: {
                  Username: profile.username,
                  Banner: profile.cover_url,
                  Country: JSON.stringify(profile.country),
                },
              },
            ],
            function (err) {
              if (err) {
                console.error(err);
                return;
              }
            }
          );
        } */
      },
      function done(err) {
        if (err) {
          console.error(err);
          return;
        }
      }
    );
};

export default NextAuth({
  providers: [
    {
      id: "osu",
      name: "Osu!",
      type: "oauth",
      token: "https://osu.ppy.sh/oauth/token",
      authorization: {
        url: "https://osu.ppy.sh/oauth/authorize",
        params: {
          scope: "identify public",
        },
      },
      userinfo: "https://osu.ppy.sh/api/v2/me",
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
    strategy: "jwt",
  },

  callbacks: {
    async session({ session, user, token }) {
      // Get data from OSU API
      const userData = await fetch(`https://osu.ppy.sh/api/v2/me`, {
        headers: {
          Authorization: `Bearer ${token?.access_token}`,
        },
      }).then((res) => res.json());

      if (userData.authentication === "basic") return {};

      userData.access_token = token?.access_token;

      return userData;
    },
    async jwt({ token, account, profile }) {
      if (account?.access_token) {
        token.access_token = account.access_token;
        token.refresh_token = account.refresh_token;

        // Write user in database
        checkUserDB(profile);
      }

      return token;
    },
  },
});
