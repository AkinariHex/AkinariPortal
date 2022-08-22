import Airtable from "airtable";

export default function handler(req, res) {
  const base = new Airtable({ apiKey: process.env.AIRTABLE_APIKEY }).base(
    process.env.AIRTABLE_BASE
  );

  if (req.method === "GET") {
    setTimeout(async () => {
      base("Skins")
        .select({
          view: "Grid view",
          maxRecords: 3,
          sort: [{ field: "CreatedTime", direction: "desc" }],
        })
        .eachPage(
          function page(records, fetchNextPage) {
            var mapped = records.map((record) => {
              let fields = {
                Name: record.get("Name"),
                Creator: record.get("Creator"),
                Owner: record.get("Owner"),
                OwnerName: record.get("OwnerName"),
                Banner: record.get("Banner"),
                Modes: JSON.parse(record.get("Modes")),
                URL: record.get("URL"),
                Downloads: record.get("Downloads"),
                CreatedTime: record.get("CreatedTime"),
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
