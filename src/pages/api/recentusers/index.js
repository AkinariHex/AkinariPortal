import Airtable from "airtable";

export default function handler(req, res) {
  const base = new Airtable({ apiKey: process.env.AIRTABLE_APIKEY }).base(
    process.env.AIRTABLE_BASE
  );

  if (req.method === "GET") {
    setTimeout(async () => {
      base("Users")
        .select({
          view: "Grid view",
          maxRecords: 6,
          sort: [{ field: "CreatedTime", direction: "desc" }],
        })
        .eachPage(
          function page(records, fetchNextPage) {
            var mapped = records.map((record) => {
              let fields = {
                ID: record.get("IDuser"),
                Username: record.get("Username"),
                Banner: record.get("Banner"),
                CreatedTime: record.get("CreatedTime"),
                PlayMode: record.get("PlayMode"),
                RecordID: record.id,
              };
              return fields;
            });

            return res.status(200).json(mapped);
          },
          function done(err) {
            if (err) {
              console.error(err);
              return res.status(401);
            }
            res.end();
          }
        );
    }, 1000);
  } else {
    return res.status(404).json({ message: "No Authorization" });
  }
}
