import { getSession } from "next-auth/react";
import Airtable from "airtable";

export default async function handler(req, res) {
  const base = new Airtable({ apiKey: process.env.AIRTABLE_APIKEY }).base(
    process.env.AIRTABLE_BASE
  );

  if (req.method === "GET") {
    const session = await getSession({ req });

    if (session && req.query.c && req.query.id) {
      base("Skins").update(
        [
          {
            id: req.query.id,
            fields: {
              Downloads: parseInt(req.query.c),
            },
          },
        ],
        function (err, records) {
          if (err) {
            console.error(err);
            return res.status(500).json({ status: "error" });
          }
          return res.status(200).json({ status: "done" });
        }
      );
    } else {
      res.status(401).json({ status: "No authorization" });
    }
  }
}
