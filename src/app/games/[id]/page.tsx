import { auth } from "@/auth";
import { osuApiFetch } from "@/lib/osu";

export const revalidate = 300;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  try {
    const session: any = await auth();
    const room: any = await osuApiFetch(`rooms/${id}`, session?.access_token);
    return { title: `${room.name} - Game Details` };
  } catch {
    return { title: "Game Details" };
  }
}

export default async function GameDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session: any = await auth();

  let room: any = null;
  let events: any[] = [];
  let error: string | null = null;

  try {
    room = await osuApiFetch(`rooms/${id}`, session?.access_token);
    const eventsData: any = await osuApiFetch(
      `rooms/${id}/events`,
      session?.access_token
    );
    events = eventsData.events || [];
  } catch (err: any) {
    console.error(`Error fetching room ${id}:`, err);
    error = err.message;
  }

  if (error) {
    return (
      <div className="flex min-h-screen w-full flex-col items-center bg-site-users px-2.5 -mt-[4.2em] pt-[4.2em] pb-24 md:pb-10">
        <div className="my-8 w-full max-w-[60em] rounded-[20px] bg-site-secondary p-5 text-foreground">
          <h1 className="text-2xl font-bold">Error loading game details</h1>
          <p className="mt-2 text-destructive">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-col items-center bg-site-users px-2.5 -mt-[4.2em] pt-[4.2em] pb-24 md:pb-10">
      <div className="my-8 w-full max-w-[60em] rounded-[20px] bg-site-secondary">
        <div className="p-5 md:p-6">
          <div className="mb-3 flex items-center">
            <div className="text-2xl font-bold text-foreground">{room.name}</div>
            <div className="ml-auto font-bold text-accent-blue">#{room.id}</div>
          </div>

          <div className="mt-5 text-foreground">
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div className="rounded-xl bg-site-primary p-5">
                <h3 className="mb-3 text-lg font-semibold text-accent-blue">
                  Room Info
                </h3>
                <div className="flex flex-col gap-1 text-sm">
                  <p>
                    <strong>Status:</strong> {room.status}
                  </p>
                  <p>
                    <strong>Type:</strong> {room.type}
                  </p>
                  <p>
                    <strong>Category:</strong> {room.category}
                  </p>
                  <p>
                    <strong>Host:</strong> {room.host?.username}
                  </p>
                  <p>
                    <strong>Players:</strong> {room.participant_count}
                  </p>
                </div>
              </div>
              {room.current_playlist_item && (
                <div className="rounded-xl bg-site-primary p-5">
                  <h3 className="mb-3 text-lg font-semibold text-accent-blue">
                    Current / Last Map
                  </h3>
                  <div className="flex flex-col gap-1 text-sm">
                    <p>
                      <strong>Map:</strong>{" "}
                      {room.current_playlist_item.beatmap?.beatmapset?.title} [
                      {room.current_playlist_item.beatmap?.version}]
                    </p>
                    <p>
                      <strong>Mapper:</strong>{" "}
                      {room.current_playlist_item.beatmap?.beatmapset?.creator}
                    </p>
                    <p>
                      <strong>Mode:</strong>{" "}
                      {room.current_playlist_item.ruleset_id === 0
                        ? "osu!"
                        : room.current_playlist_item.ruleset_id === 1
                        ? "Taiko"
                        : room.current_playlist_item.ruleset_id === 2
                        ? "Catch"
                        : "Mania"}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="mt-8">
            <h2 className="text-xl font-semibold text-accent-blue">
              Match History / Events
            </h2>
            <div className="mt-2.5 flex flex-col gap-2.5">
              {events && events.length > 0 ? (
                events.map((event: any, index: number) => (
                  <div
                    key={index}
                    className={`rounded-lg bg-site-primary p-4 ${
                      event.type === "match-finished"
                        ? "border-l-4 border-accent-blue"
                        : "border-l-4 border-border"
                    }`}
                  >
                    <div className="font-bold capitalize text-foreground">
                      {event.type.replace(/-/g, " ")}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(event.timestamp).toLocaleString()}
                    </div>
                    {event.detail && (
                      <div className="mt-1.5 text-sm text-card-foreground">
                        {event.type === "match-finished" &&
                          event.detail.playlist_item && (
                            <div>
                              Map:{" "}
                              {
                                event.detail.playlist_item.beatmap?.beatmapset
                                  ?.title
                              }
                            </div>
                          )}
                        {event.type === "user-joined" && (
                          <div>User {event.detail.user_id} joined</div>
                        )}
                        {event.type === "user-left" && (
                          <div>User {event.detail.user_id} left</div>
                        )}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground">
                  No events found for this room.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
