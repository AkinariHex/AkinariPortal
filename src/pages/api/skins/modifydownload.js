import supabase from "../../../config/supabaseClient";

export default async function handler(req, res) {
  if (req.method === "GET" && req.query.c && req.query.id) {
    const { data, error } = await supabase
      .from("skins")
      .update({
        Downloads: parseInt(req.query.c),
      })
      .eq("id", req.query.id);
    if (error) {
      console.error(error);
      return res.status(500).json({ status: "error" });
    }
    return res.status(200).json({ status: "done" });
  } else {
    res.status(401).json({ status: "No authorization" });
  }
}
