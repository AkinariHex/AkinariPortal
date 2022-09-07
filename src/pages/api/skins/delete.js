import { getSession } from "next-auth/react";
import supabase from "../../../config/supabaseClient";

export default async function handler(req, res) {
  if (req.method === "GET") {
    const session = await getSession({ req });

    if (session && req.query.id && session.id == req.query.user) {
      const { data, error } = await supabase
        .from("skins")
        .delete()
        .match({ id: req.query.id });

      if (error) {
        console.error(error);
        return res.status(401).json({ status: "error" });
      }
      return res.status(202).json({ status: "done" });
    } else {
      res.status(401).json({ status: "No authorization" });
    }
  }
}
