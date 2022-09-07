import { getSession } from "next-auth/react";
import supabase from "../../../config/supabaseClient";

export default async function handler(req, res) {
  if (req.method === "POST") {
    const session = await getSession({ req });

    if (session && req.body) {
      const body = req.body;

      const { data, error } = await supabase.from("skins").insert([
        {
          Name: body.name,
          Creator: body.creator,
          Player: body.owner,
          Banner: body.bg,
          Modes: body.modes,
          Tags: body.tags,
          URL: body.url,
          Downloads: 0,
        },
      ]);

      if (error) {
        console.log(error);
        return res.status(404).json({ status: "error" });
      }

      return res.status(200).json({ status: "done" });
    } else {
      res.status(401).json({ status: "No authorization" });
    }
  }
}
