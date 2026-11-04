import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { isAdmin } from "@/lib/authz";
import { listMyTournaments } from "@/lib/tournaments/data";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Tournaments",
  description: "Tournament data and overlay files for hosts and staff.",
};

export default async function TournamentsPage() {
  const session: any = await auth();
  if (!session?.id) redirect("/");

  const [tournaments, admin] = await Promise.all([listMyTournaments(String(session.id)), isAdmin()]);

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8">
      <div className="flex flex-col gap-6">
        <h1 className="text-2xl font-bold text-foreground">Tournaments</h1>
        {admin && (
          <p className="text-sm text-muted-foreground">
            New tournaments are created from{" "}
            <Link href="/settings#tournaments" className="text-accent-blue hover:underline">
              Settings
            </Link>
            .
          </p>
        )}
        {tournaments.length === 0 ? (
          <p className="text-sm text-muted-foreground">You don&apos;t have access to any tournament yet. Ask an admin to add you.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {tournaments.map((t) => (
              <li key={t.slug}>
                <Link
                  href={`/tournaments/${t.slug}`}
                  className="flex items-center justify-between gap-4 rounded-xl border border-border bg-site-secondary px-5 py-4 transition-colors hover:bg-site-primary"
                >
                  <div className="flex flex-col">
                    <span className="font-semibold text-foreground">{t.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {t.acronym || t.slug} · {t.current_stage}
                    </span>
                  </div>
                  <span className="text-xs uppercase tracking-wide text-muted-foreground">{t.role}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
