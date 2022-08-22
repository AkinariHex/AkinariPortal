import { getSession } from "next-auth/react";
import Airtable from "airtable";

export default async function handler(req, res) {
  const base = new Airtable({ apiKey: process.env.AIRTABLE_APIKEY }).base(
    process.env.AIRTABLE_BASE
  );

  if (req.method === "POST") {
    const session = await getSession({ req });

    if (session && req.body) {
      const body = req.body;

      base("Users")
        .select({
          filterByFormula: `IF({IDuser} = '${body.owner}' , TRUE())`,
          view: "Grid view",
        })
        .eachPage(
          function page(records, fetchNextPage) {
            base("Skins").create(
              [
                {
                  fields: {
                    Name: body.name,
                    Creator: body.creator,
                    OwnerRecord: [records[0].getId()],
                    Banner: body.bg,
                    Modes: body.modes,
                    Tags: body.tags,
                    URL: body.url,
                    Downloads: 0,
                  },
                },
              ],
              function (err, records) {
                if (err) {
                  console.error(err);
                  return res.status(404).json({ status: "error" });
                }
                return res.status(200).json({ status: "done" });
              }
            );
          },
          function done(err) {
            if (err) {
              console.error(err);
              return;
            }

            return res.status(200).json({ status: "done" });
          }
        );
    } else {
      res.status(401).json({ status: "No authorization" });
    }
  }
}
