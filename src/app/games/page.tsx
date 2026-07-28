import Link from "next/link";
import { auth } from "@/auth";
import { osuApiFetch } from "@/lib/osu";

export const revalidate = 300;

export const metadata = { title: "My Ranked Matches" };

export default async function GamesListPage() {
  const session: any = await auth();

  if (!session) {
    return (
      <div className="flex min-h-screen w-full flex-col items-center bg-site-users px-2.5 pb-24 md:pb-10">
        <div className="my-8 w-full max-w-[60em] rounded-[20px] bg-site-secondary p-10 text-center text-foreground">
          <h1 className="text-2xl font-bold">Login Required</h1>
          <p className="mt-2 text-muted-foreground">
            Please log in with your osu! account to see your match history.
          </p>
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
      <div className="flex min-h-screen w-full flex-col items-center bg-site-users px-2.5 pb-24 md:pb-10">
        <div className="my-8 w-full max-w-[60em] rounded-[20px] bg-site-secondary p-5 text-foreground">
          <h1 className="text-2xl font-bold">Error loading games</h1>
          <p className="mt-2 text-destructive">{error}</p>
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
    <div className="flex min-h-screen w-full flex-col items-center bg-site-users px-2.5 pb-24 md:pb-10">
      <div className="my-8 w-full max-w-[60em] rounded-[20px] bg-site-secondary">
        <div className="p-5 md:p-6">
          <div className="mb-3 flex items-center">
            <div className="text-2xl font-bold text-foreground">My osu! lazer Ranked Matches</div>
          </div>

          <div className="mt-5 flex flex-col gap-5">
            {rooms.length === 0 && (
              <p className="p-5 text-center text-muted-foreground">
                You haven&apos;t participated in any ranked matches yet.
              </p>
            )}

            {Object.entries(groupedRooms).map(([type, roomsOfType]) => (
              <div key={type} className="">
                <h2 className="mb-2.5 text-xl font-medium capitalize text-accent-blue">
                  {type.replace("_", " ")}
                </h2>
                <div className="flex flex-col gap-2.5">
                  {roomsOfType.map((room: any) => (
                    <Link key={room.id} href={`/games/${room.id}`}>
                      <div className="flex cursor-pointer items-center justify-between rounded-lg bg-site-primary p-4 transition-transform duration-150 hover:-translate-y-0.5 hover:brightness-110">
                        <div>
                          <div className="text-lg font-medium text-foreground">
                            {room.name}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Status:{" "}
                            <span
                              className={
                                room.status === "ended"
                                  ? "text-destructive"
                                  : "text-accent-blue"
                              }
                            >
                              {room.status}
                            </span>{" "}
                            | Ended:{" "}
                            {room.ends_at
                              ? new Date(room.ends_at).toLocaleString()
                              : "N/A"}
                          </div>
                        </div>
                        <div className="font-bold text-accent-blue">
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
  );
}
