import Head from "next/head";
import { osuApiFetch } from "../../lib/osu";

export default function GameDetails({ room, events, error }) {
  if (error) {
    return (
      <div className="profileDivBackground">
        <div className="mainDiv" style={{ padding: "20px", color: "white" }}>
          <h1>Error loading game details</h1>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>{room.name} - Game Details</title>
      </Head>
      <div className="profileDivBackground">
        <div className="mainDiv">
          <div className="section">
            <div className="header">
              <div className="title">{room.name}</div>
              <div style={{ marginLeft: "auto", color: "#6ba2ed" }}>#{room.id}</div>
            </div>

            <div className="gameInfo" style={{ marginTop: "20px", color: "#cee0f6" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                <div style={{ backgroundColor: "var(--site-primary-color)", padding: "20px", borderRadius: "10px" }}>
                  <h3>Room Info</h3>
                  <p><strong>Status:</strong> {room.status}</p>
                  <p><strong>Type:</strong> {room.type}</p>
                  <p><strong>Category:</strong> {room.category}</p>
                  <p><strong>Host:</strong> {room.host?.username}</p>
                  <p><strong>Players:</strong> {room.participant_count}</p>
                </div>
                {room.current_playlist_item && (
                  <div style={{ backgroundColor: "var(--site-primary-color)", padding: "20px", borderRadius: "10px" }}>
                    <h3>Current / Last Map</h3>
                    <p><strong>Map:</strong> {room.current_playlist_item.beatmap?.beatmapset?.title} [{room.current_playlist_item.beatmap?.version}]</p>
                    <p><strong>Mapper:</strong> {room.current_playlist_item.beatmap?.beatmapset?.creator}</p>
                    <p><strong>Mode:</strong> {room.current_playlist_item.ruleset_id === 0 ? "osu!" : room.current_playlist_item.ruleset_id === 1 ? "Taiko" : room.current_playlist_item.ruleset_id === 2 ? "Catch" : "Mania"}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="events" style={{ marginTop: "30px" }}>
              <h2 style={{ color: "#6ba2ed" }}>Match History / Events</h2>
              <div style={{ display: "flex", flexFlow: "column", gap: "10px", marginTop: "10px" }}>
                {events && events.length > 0 ? (
                  events.map((event, index) => (
                    <div key={index} style={{ 
                      backgroundColor: "var(--site-primary-color)", 
                      padding: "15px", 
                      borderRadius: "8px",
                      borderLeft: event.type === "match-finished" ? "4px solid #6ba2ed" : "4px solid #414a55"
                    }}>
                      <div style={{ fontWeight: "bold", color: "#cee0f6", textTransform: "capitalize" }}>
                        {event.type.replace(/-/g, " ")}
                      </div>
                      <div style={{ fontSize: "0.9em", color: "#636c76" }}>
                        {new Date(event.timestamp).toLocaleString()}
                      </div>
                      {event.detail && (
                        <div style={{ marginTop: "5px", color: "#afbed1" }}>
                          {/* Render specific details based on event type if needed */}
                          {event.type === "match-finished" && event.detail.playlist_item && (
                             <div>Map: {event.detail.playlist_item.beatmap?.beatmapset?.title}</div>
                          )}
                          {event.type === "user-joined" && <div>User {event.detail.user_id} joined</div>}
                          {event.type === "user-left" && <div>User {event.detail.user_id} left</div>}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <p style={{ color: "#636c76" }}>No events found for this room.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export async function getServerSideProps({ params }) {
  const { id } = params;
  try {
    const room = await osuApiFetch(`rooms/${id}`);
    const eventsData = await osuApiFetch(`rooms/${id}/events`);
    
    return {
      props: {
        room,
        events: eventsData.events || [],
      },
    };
  } catch (error) {
    console.error(`Error fetching room ${id}:`, error);
    return {
      props: {
        error: error.message,
      },
    };
  }
}
