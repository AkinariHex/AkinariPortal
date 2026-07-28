import supabase from "../../../config/supabaseClient";

// Public download counter. The count is derived server-side (current + 1); the
// client can no longer set an arbitrary Downloads value. A legacy `?c=` param is
// ignored for backwards compatibility.
export default async function handler(req, res) {
  if (req.method !== "GET" || !req.query.id) {
    return res.status(400).json({ status: "bad request" });
  }

  const { data: current, error: readError } = await supabase
    .from("skins")
    .select("Downloads")
    .eq("id", req.query.id)
    .single();

  if (readError || !current) {
    return res.status(404).json({ status: "not found" });
  }

  const { error } = await supabase
    .from("skins")
    .update({ Downloads: (current.Downloads ?? 0) + 1 })
    .eq("id", req.query.id);

  if (error) {
    console.error(error);
    return res.status(500).json({ status: "error" });
  }

  return res.status(200).json({ status: "done" });
}
