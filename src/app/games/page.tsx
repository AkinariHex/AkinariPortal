import Link from "next/link";
import { auth } from "@/auth";
import { osuApiFetch } from "@/lib/osu";

export const revalidate = 300;

export const metadata = { title: "My Ranked Matches" };

export default async function GamesListPage() {
  const session: any = await auth();

  if (!session) {
    return (
      <div className="profileDivBackground">
        <div
          className="mainDiv"
          style={{ padding: "40px", color: "white", textAlign: "center" }}
        >
          <h1>Login Required</h1>
          <p>Please log in with your osu! account to see your match history.</p>
        </div>
      </div>
    );
  }

  let rooms: any[] = [];
  let error: string | null = null;

  try {
    const data = await osuApiFetch(`/rooms?type=ranked_play`);
    rooms = (data || []).filter((room: any) => room.status === "ended");
  } catch (err: any) {
    console.error("Error fetching user rooms:", err);
    error = err.message;
  }

  if (error) {
    return (
      <div className="profileDivBackground">
        <div className="mainDiv" style={{ padding: "20px", color: "white" }}>
          <h1>Error loading games</h1>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  // Group rooms by type
  const groupedRooms = rooms.reduce((acc: Record<string, any[]>, room: any) => {
    const type = room.type || "unknown";
    if (!acc[type]) acc[type] = [];
    acc[type].push(room);
    return acc;
  }, {});

  return (
    <>
      <div className="profileDivBackground">
        <div className="mainDiv">
          <div className="section">
            <div className="header">
              <div className="title">My osu! lazer Ranked Matches</div>
            </div>

            <div
              style={{
                display: "flex",
                flexFlow: "column",
                gap: "20px",
                marginTop: "20px",
              }}
            >
              {rooms.length === 0 && (
                <p
                  style={{
                    color: "#cee0f6",
                    textAlign: "center",
                    padding: "20px",
                  }}
                >
                  You haven't participated in any ranked matches yet.
                </p>
              )}

              {Object.entries(groupedRooms).map(([type, roomsOfType]) => (
                <div key={type} className="roomTypeSection">
                  <h2
                    style={{
                      color: "#6ba2ed",
                      fontSize: "1.2em",
                      marginBottom: "10px",
                      textTransform: "capitalize",
                    }}
                  >
                    {type.replace("_", " ")}
                  </h2>
                  <div
                    className="list"
                    style={{ display: "flex", flexFlow: "column", gap: "10px" }}
                  >
                    {roomsOfType.map((room: any) => (
                      <Link key={room.id} href={`/games/${room.id}`}>
                        <div
                          className="gameItem"
                          style={{
                            backgroundColor: "var(--site-primary-color)",
                            padding: "15px",
                            borderRadius: "8px",
                            cursor: "pointer",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            transition: "transform 0.1s ease",
                          }}
                        >
                          <div>
                            <div
                              style={{
                                color: "#cee0f6",
                                fontSize: "1.1em",
                                fontWeight: "500",
                              }}
                            >
                              {room.name}
                            </div>
                            <div style={{ color: "#636c76", fontSize: "0.9em" }}>
                              Status:{" "}
                              <span
                                style={{
                                  color:
                                    room.status === "ended"
                                      ? "#f47373"
                                      : "#6ba2ed",
                                }}
                              >
                                {room.status}
                              </span>{" "}
                              | Ended:{" "}
                              {room.ends_at
                                ? new Date(room.ends_at).toLocaleString()
                                : "N/A"}
                            </div>
                          </div>
                          <div style={{ color: "#6ba2ed", fontWeight: "bold" }}>
                            #{room.id}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style>{`.gameItem:hover{transform:translateY(-2px);filter:brightness(1.1);}`}</style>
    </>
  );
}
