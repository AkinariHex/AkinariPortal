import supabase from "../../../config/supabaseClient";
import Cors from "cors";

const cors = Cors({
  methods: ["POST", "GET"],
  origin: "https://sga5d92fjov4s3rycmv4q5cr7xf85u.ext-twitch.tv",
});

// Helper method to wait for a middleware to execute before continuing
// And to throw an error when an error happens in a middleware
function runMiddleware(req, res, fn) {
  return new Promise((resolve, reject) => {
    fn((req, res) => {
      if (result instanceof Error) {
        return reject(result);
      }

      return resolve(result);
    });
  });
}

async function getSkins(supabase, userid) {
  const { data, error } = await supabase
    .from("skins")
    .select("id,Name,Creator,Banner,Modes,Tags,URL,Downloads")
    .eq("Player", userid)
    .order("created_at", { ascending: false });

  if (error) {
    return "error";
  }

  return data;
}

export default async function handler(req, res) {
  // Run the middleware
  await runMiddleware(req, res, cors);

  if (req.method === "GET") {
    if (req.query.twitchid && req.query.type === "check") {
      const { data, error } = await supabase
        .from("users")
        .select("id,username")
        .eq("twitch_id", req.query.twitchid);
      if (error) {
        return res.json({ message: "no connection" });
      }

      if (data.length === 1) {
        return res.json({ user: data[0], message: "connected" });
      }

      return res.json({ message: "no connection" });
    }

    if (req.query.twitchid && req.query.type === "skins") {
      const { data, error } = await supabase
        .from("users")
        .select("id")
        .eq("twitch_id", req.query.twitchid);

      if (error || data.length === 0) {
        return res.json({ message: "no connection" });
      }

      if (data.length === 1) {
        const skins = await getSkins(supabase, data[0].id);
        if (skins === "error") {
          return res.json({ message: "skin error" });
        }
        return res.json({
          user: data[0].id,
          skins: skins,
          message: "skins retrieved",
        });
      }
    }

    return;
  }
  if (req.method === "POST") {
    if (
      req.query.twitchid &&
      req.query.secretkey &&
      req.query.type === "submit"
    ) {
      const { data, error } = await supabase
        .from("users")
        .update({
          twitch_id: req.query.twitchid,
        })
        .eq("secret_key", req.query.secretkey);

      if (error) {
        return res.json({ message: "wrong secretkey" });
      }

      return res.json({ message: "connected" });
    }
    return;
  }
}
