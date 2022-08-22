import Airtable from "airtable";

export default function handler(req, res) {
  const base = new Airtable({ apiKey: process.env.AIRTABLE_APIKEY }).base(
    process.env.AIRTABLE_BASE
  );

  if (req.method === "GET") {
    if (req.query.u !== null) {
      setTimeout(async () => {
        base("Users")
          .select({
            filterByFormula: `IF({IDuser} = '${req.query.u}' , TRUE())`,
            view: "Grid view",
          })
          .eachPage(
            function page(records, fetchNextPage) {
              /* Send null if the user is not registered on the database */
              if (records.length === 0) {
                return res.status(401).json([null]);
              }

              var mapped = [
                {
                  ID: records[0].get("IDuser"),
                  Username: records[0].get("Username"),
                  UUID: records[0].get("UUID"),
                  Banner: records[0].get("Banner"),
                  Country: JSON.parse(records[0].get("Country")),
                  PlayMode: records[0].get("PlayMode"),
                  Badges: JSON.parse(records[0].get("Badges")),
                  Discord: records[0].get("Discord"),
                  Twitter: records[0].get("Twitter"),
                  RecordID: records[0].id,
                },
              ];

              return res.status(200).json(mapped);
            },
            function done(err) {
              if (err) {
                console.error(err);
                return res.status(401);
              }
              return res.end();
            }
          );
      }, 1000);
    } else {
      return res.status(404).json({ error: "No user specified" });
    }
  } else {
    return res.status(404).json({ message: "No Authorization" });
  }
}
