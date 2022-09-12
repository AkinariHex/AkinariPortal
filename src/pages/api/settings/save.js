import { getSession } from "next-auth/react";
import supabase from "../../../config/supabaseClient";

export default async function handler(req, res) {
  if (req.method === "POST") {
    const session = await getSession({ req });

    if (session && req.body) {
      const body = await JSON.parse(req.body);

      if (req.query.m === "skinview" && body.skin_view) {
        const { data, error } = await supabase
          .from("users")
          .update({
            skin_view: body.skin_view,
          })
          .eq("id", session.id);

        if (error) {
          console.log(error);
          return res.status(404).json({ message: "error" });
        }
        return res.status(200).json({ message: "done" });
      }

      if (
        req.query.m === "socials" &&
        body.twitter &&
        body.discord &&
        body.twitch &&
        body.youtube &&
        body.github
      ) {
        const { data, error } = await supabase
          .from("users")
          .update({
            twitter: body.twitter,
            discord: body.discord,
            twitch: body.twitch,
            youtube: body.youtube,
            github: body.github,
          })
          .eq("id", session.id);

        if (error) {
          console.log(error);
          return res.status(404).json({ message: "error" });
        }
        return res.status(200).json({ message: "done" });
      }
      return res.status(404).json({ message: "error" });
    } else {
      return res.status(404).json({ message: "Unauthorized!" });
    }
  }
  return;
}
