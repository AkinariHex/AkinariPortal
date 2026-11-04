"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { importPool, removePoolMap } from "@/app/tournaments/[slug]/actions";
import SheetImport from "@/components/SheetImport/SheetImport";
import TournamentPanel from "@/components/TournamentPanel/TournamentPanel";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import type { PoolMap } from "@/lib/tournaments/bundle";
import { useServerAction } from "@/lib/tournaments/useServerAction";

const fmtLength = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

export default function TournamentPool({ slug, stages, pool, editable }: { slug: string; stages: string[]; pool: Record<string, PoolMap[]>; editable: boolean }) {
  const { pending, run } = useServerAction();
  const [stage, setStage] = useState(stages[0]);
  const [replaceAll, setReplaceAll] = useState(false);
  const maps = pool[stage] ?? [];

  return (
    <div className="flex flex-col gap-6">
      <Select value={stage} onValueChange={setStage}>
        <SelectTrigger className="w-56">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {stages.map((s) => (
            <SelectItem key={s} value={s}>
              {s} ({pool[s]?.length ?? 0})
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {editable && (
        <TournamentPanel
          title={`Import ${stage} pool`}
          description="One row per map: slot (NM1, HR2, DT1, FM1, TB...) then beatmap id or link. A slot that already exists is replaced, new slots are added, the others stay. Metadata, mod-adjusted star rating and stats come from osu!."
        >
          <SheetImport
            placeholder={"Slot\tBeatmap\nNM1\t4352345\nHR1\thttps://osu.ppy.sh/beatmapsets/123#osu/456"}
            label={replaceAll ? "Replace stage" : "Add / update"}
            pending={pending}
            onImport={async (text) => (await run(() => importPool(slug, stage, text, replaceAll ? "replace" : "merge"), "Imported."))?.status === "done"}
          >
            <div className="flex items-center gap-2">
              <Switch id="pool-replace" checked={replaceAll} onCheckedChange={setReplaceAll} />
              <Label htmlFor="pool-replace">Replace the whole stage</Label>
            </div>
          </SheetImport>
        </TournamentPanel>
      )}

      <TournamentPanel title={`${stage} (${maps.length} maps)`}>
        {maps.length === 0 ? (
          <p className="text-sm text-muted-foreground">No maps yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm tabular-nums">
              <thead className="text-left text-xs text-muted-foreground">
                <tr>
                  <th className="py-2 pr-3">Slot</th>
                  <th className="py-2 pr-3">Map</th>
                  <th className="py-2 pr-3">SR</th>
                  <th className="py-2 pr-3">BPM</th>
                  <th className="py-2 pr-3">CS / AR / OD</th>
                  <th className="py-2 pr-3">Length</th>
                  {editable && <th className="py-2" aria-label="Actions" />}
                </tr>
              </thead>
              <tbody>
                {maps.map((m) => (
                  <tr key={m.slot} className="border-t border-border">
                    <td className="py-2 pr-3 font-semibold">{m.slot}</td>
                    <td className="py-2 pr-3">
                      <a href={`https://osu.ppy.sh/b/${m.beatmapId}`} target="_blank" rel="noreferrer" className="hover:underline">
                        {m.artist} - {m.title} [{m.version}]
                      </a>
                      <span className="block text-xs text-muted-foreground">by {m.mapper}</span>
                    </td>
                    <td className="py-2 pr-3">{m.sr.toFixed(2)}</td>
                    <td className="py-2 pr-3">{m.bpm}</td>
                    <td className="py-2 pr-3">
                      {m.cs} / {m.ar} / {m.od}
                    </td>
                    <td className="py-2 pr-3">{fmtLength(m.length)}</td>
                    {editable && (
                      <td className="py-2 text-right">
                        <Button
                          type="button"
                          size="icon-sm"
                          variant="ghost"
                          disabled={pending}
                          aria-label={`Remove ${m.slot}`}
                          onClick={() => run(() => removePoolMap(slug, stage, m.slot), "Removed.")}
                        >
                          <Trash2 />
                        </Button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </TournamentPanel>
    </div>
  );
}
