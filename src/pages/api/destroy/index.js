import { getSession } from "next-auth/react";
import supabase from "../../../config/supabaseClient";

export default async function handler(req, res) {
  if (req.method === "GET") {
    const session = await getSession({ req });

    if (session) {
      const { data, error } = await supabase
        .from("users")
        .update({ secret_key: "" })
        .eq("id", session.id);

      if (error) {
        console.error(err);
        return res.status(500).json({ status: "error" });
      }

      return res.status(200).json({ status: "success" });
    } else {
      res.status(401).json({ status: "No authorization" });
    }
  }
}
