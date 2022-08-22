import { getSession } from "next-auth/react";
import Airtable from "airtable";

export default async function handler(req, res) {
  const base = new Airtable({ apiKey: process.env.AIRTABLE_APIKEY }).base(
    process.env.AIRTABLE_BASE
  );

  if (req.method === "GET") {
    const session = await getSession({ req });

    if (session && req.query.id) {
      base("Skins").destroy([req.query.id], function (err, deletedRecords) {
        if (err) {
          console.error(err);
          return res.status(401).json({ status: "error" });
        }
        return res.status(202).json({ status: "done" });
      });
    } else {
      res.status(401).json({ status: "No authorization" });
    }
  }
}
