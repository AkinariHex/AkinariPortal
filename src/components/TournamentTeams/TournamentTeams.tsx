"use client";

import { useState } from "react";
import { importTeams } from "@/app/tournaments/[slug]/actions";
import SheetImport from "@/components/SheetImport/SheetImport";
import TeamEditRow from "@/components/TeamEditRow/TeamEditRow";
import TournamentPanel from "@/components/TournamentPanel/TournamentPanel";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import type { Team } from "@/lib/tournaments/bundle";
import { useServerAction } from "@/lib/tournaments/useServerAction";

export default function TournamentTeams({ slug, teams, editable }: { slug: string; teams: Team[]; editable: boolean }) {
  const { pending, run } = useServerAction();
  const [append, setAppend] = useState(false);

  return (
    <div className="flex flex-col gap-6">
      {editable && (
        <TournamentPanel
          title="Import teams"
          description="One row per team: team name, then each player's osu! id or username. A cell starting with http is used as the team image. Names, countries and avatars come from osu!."
        >
          <SheetImport
            placeholder={"Team name\tplayer 1\tplayer 2\tplayer 3\nPasta al dente\t2\t124493\tWhiteCat"}
            pending={pending}
            onImport={async (text) => (await run(() => importTeams(slug, text, append ? "append" : "replace"), "Imported."))?.status === "done"}
          >
            <div className="flex items-center gap-2">
              <Switch id="append" checked={append} onCheckedChange={setAppend} />
              <Label htmlFor="append">Append instead of replace</Label>
            </div>
          </SheetImport>
        </TournamentPanel>
      )}
      <TournamentPanel title={`Teams (${teams.length})`}>
        {teams.length === 0 ? (
          <p className="text-sm text-muted-foreground">No teams yet.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {teams.map((team, i) => (
              <TeamEditRow key={`${team.name}-${i}`} slug={slug} index={i} team={team} editable={editable} />
            ))}
          </ul>
        )}
      </TournamentPanel>
    </div>
  );
}
