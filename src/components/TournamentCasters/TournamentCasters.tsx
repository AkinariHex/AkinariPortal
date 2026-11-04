"use client";

import { importCasters } from "@/app/tournaments/[slug]/actions";
import SheetImport from "@/components/SheetImport/SheetImport";
import TournamentPanel from "@/components/TournamentPanel/TournamentPanel";
import type { Caster } from "@/lib/tournaments/bundle";
import { useServerAction } from "@/lib/tournaments/useServerAction";

export default function TournamentCasters({ slug, casters, editable }: { slug: string; casters: Caster[]; editable: boolean }) {
  const { pending, run } = useServerAction();
  return (
    <div className="flex flex-col gap-6">
      {editable && (
        <TournamentPanel title="Casters" description="One row per caster: display name, osu! id or username (optional), twitch channel (optional). Replaces the list.">
          <SheetImport
            placeholder={"Name\tosu!\tTwitch\nAkinari\t2\takinari"}
            label="Save casters"
            pending={pending}
            onImport={async (text) => (await run(() => importCasters(slug, text), "Saved."))?.status === "done"}
          />
        </TournamentPanel>
      )}
      <TournamentPanel title={`Casters (${casters.length})`}>
        {casters.length === 0 ? (
          <p className="text-sm text-muted-foreground">No casters yet.</p>
        ) : (
          <ul className="flex flex-col gap-1 text-sm">
            {casters.map((c, i) => (
              <li key={i} className="flex gap-2">
                <span className="font-medium text-foreground">{c.name}</span>
                <span className="text-muted-foreground">
                  {[c.country, c.osuId && `osu ${c.osuId}`, c.twitch && `twitch ${c.twitch}`].filter(Boolean).join(" · ")}
                </span>
              </li>
            ))}
          </ul>
        )}
      </TournamentPanel>
    </div>
  );
}
