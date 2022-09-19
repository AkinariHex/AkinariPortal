import { getSession } from "next-auth/react";
import supabase from "../../../config/supabaseClient";
const generateApiKey = require("generate-api-key");

/* Random string to generate a different key */
const randomString = (length = 32) => {
  let chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:<>?,./";

  let str = "";
  for (let i = 0; i < length; i++) {
    str += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return str;
};

const updateAPIKEY = async (supabase, sessionid, apikey) => {
  const { data, error } = await supabase
    .from("users")
    .update({
      secret_key: apikey,
    })
    .eq("id", sessionid);

  if (error) {
    return { status: "error" };
  }
  return { status: "success" };
};

export default async function handler(req, res) {
  if (req.method === "GET") {
    const session = await getSession({ req });

    if (session) {
      const { data, error } = await supabase
        .from("users")
        .select("id,UUID")
        .eq("id", session.id);

      if (error) {
        console.error(err);
        return res.status(500).json({ status: "error" });
      }

      let newAPI = generateApiKey({
        method: "uuidv5",
        name: randomString(),
        namespace: data[0].UUID,
        prefix: data[0].id,
      });

      var update = await updateAPIKEY(supabase, session.id, newAPI);
      if (update.status === error) {
        return res.status(500).json({ status: "error" });
      }
      return res.status(200).json({ status: "success", secret_key: newAPI });
    } else {
      return res.status(401).json({ status: "No authorization" });
    }
  }
}
