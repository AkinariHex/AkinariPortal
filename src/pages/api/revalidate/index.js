export default async function handler(req, res) {
  if (req.query.secret !== process.env.REVALIDATE_SECRET) {
    return res.status(401).json({ message: "invalid token" });
  }

  try {
    await res.unstable_revalidate("/");
    return res.json({ revalidated: true });
  } catch (err) {
    return res.status(500).send("Error Revalidating");
  }
}
