import supabase from "../../../config/supabaseClient";

export default async function handler(req, res) {
  if (req.method === "GET") {
    const body = {
      client_id: process.env.TWITCH_CLIENT_ID,
      client_secret: process.env.TWITCH_CLIENT_SECRET,
      grant_type: "client_credentials",
    };

    var checkResponse = await fetch(`https://id.twitch.tv/oauth2/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    checkResponse = await checkResponse.json();

    if (checkResponse.access_token) {
      const { data, error } = await supabase
        .from("twitchauth")
        .update({ access_token: checkResponse.access_token })
        .eq("id", 1);

      if (error)
        return res.status(401).json({ message: "error creating token" });

      return res.status(200).json({ message: "token created" });
    }
  }
}
