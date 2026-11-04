"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { clearQualifiers, importQualifiers } from "@/app/tournaments/[slug]/actions";
import SheetImport from "@/components/SheetImport/SheetImport";
import TournamentPanel from "@/components/TournamentPanel/TournamentPanel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Qualifiers } from "@/lib/tournaments/bundle";
import { useServerAction } from "@/lib/tournaments/useServerAction";

const nf = new Intl.NumberFormat("en-US");

export default function TournamentQualifiers({ slug, qualifiers, editable }: { slug: string; qualifiers: Qualifiers | null; editable: boolean }) {
  const { pending, run } = useServerAction();
  const [qualified, setQualified] = useState(String(qualifiers?.qualified ?? 16));

  return (
    <div className="flex flex-col gap-6">
      {editable && (
        <TournamentPanel
          title="Import qualifier scores"
          description="One row per score: team name, slot, score. Placements, z-sum seeding and per-mod seeds are computed from the Qualifiers stage pool."
        >
          <SheetImport
            placeholder={"Team\tSlot\tScore\nPasta al dente\tNM1\t812345"}
            label="Compute seeding"
            pending={pending}
            onImport={async (text) => (await run(() => importQualifiers(slug, text, Number(qualified)), "Seeding computed."))?.status === "done"}
          >
            <div className="flex items-center gap-2">
              <Label htmlFor="q-cut">Teams qualified</Label>
              <Input id="q-cut" type="number" min={1} value={qualified} onChange={(e) => setQualified(e.target.value)} className="w-24" />
            </div>
          </SheetImport>
        </TournamentPanel>
      )}

      <TournamentPanel title="Seeding">
        {!qualifiers ? (
          <p className="text-sm text-muted-foreground">No qualifier results yet.</p>
        ) : (
          <>
            <table className="w-full text-sm tabular-nums">
              <thead className="text-left text-xs text-muted-foreground">
                <tr>
                  <th className="py-2 pr-3">Seed</th>
                  <th className="py-2 pr-3">Team</th>
                  <th className="py-2 pr-3 text-right">Z-sum</th>
                  <th className="py-2 text-right">Avg. score</th>
                </tr>
              </thead>
              <tbody>
                {qualifiers.teams.map((t) => (
                  <tr key={t.team} className={`border-t border-border ${t.seed > qualifiers.qualified ? "opacity-50" : ""}`}>
                    <td className="py-2 pr-3 font-semibold">#{t.seed}</td>
                    <td className="py-2 pr-3">{t.team}</td>
                    <td className="py-2 pr-3 text-right">{t.zsum}</td>
                    <td className="py-2 text-right">{nf.format(t.avgScore)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {editable && (
              <Button type="button" variant="destructive" size="sm" className="self-start" disabled={pending} onClick={() => run(() => clearQualifiers(slug), "Qualifiers cleared.")}>
                <Trash2 /> Clear
              </Button>
            )}
          </>
        )}
      </TournamentPanel>
    </div>
  );
}
