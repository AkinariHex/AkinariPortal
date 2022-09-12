import supabase from "../../../config/supabaseClient";

export default async function handler(req, res) {
  if (req.method === "GET") {
    if (req.query.channel && req.query.secret) {
      const { data, error } = await supabase
        .from("twitchauth")
        .select("access_token")
        .eq("secret", req.query.secret);

      if (error) {
        console.log(error);
        return res.status(404).json({ status: "error" });
      }

      const access_token = data[0].access_token;

      var checkResponse = await fetch(
        `https://api.twitch.tv/helix/search/channels?query=${req.query.channel}&first=1`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: `Bearer ${access_token}`,
            "Client-Id": `${process.env.TWITCH_CLIENT_ID}`,
          },
        }
      );
      checkResponse = await checkResponse.json();

      if (checkResponse !== 401) {
        return res.json(checkResponse.data[0]);
      } else {
        return res.json(checkResponse);
      }
    } else {
      return res.status(404).json({ message: "Unauthorized!" });
    }
  }
}
