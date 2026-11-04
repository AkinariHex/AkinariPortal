"use client";

import { useState } from "react";
import { Save } from "lucide-react";
import { updateTournamentInfo } from "@/app/tournaments/[slug]/actions";
import TournamentPanel from "@/components/TournamentPanel/TournamentPanel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { TournamentRow } from "@/lib/tournaments/types";
import { useServerAction } from "@/lib/tournaments/useServerAction";

export default function TournamentInfoForm({ tournament: t, editable }: { tournament: TournamentRow; editable: boolean }) {
  const { pending, run } = useServerAction();
  const [form, setForm] = useState({
    name: t.name,
    acronym: t.acronym,
    teamSize: String(t.team_size),
    stages: t.stages.join(", "),
    currentStage: t.current_stage,
    teamA: t.theme?.teamA ?? "",
    teamB: t.theme?.teamB ?? "",
  });
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <TournamentPanel title="Overview" description="The current stage picks which mappool the overlay shows. Theme colours are optional (#RRGGBB).">
      <fieldset disabled={!editable} className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="i-name">Name</Label>
          <Input id="i-name" value={form.name} onChange={set("name")} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="i-acronym">Acronym</Label>
          <Input id="i-acronym" value={form.acronym} onChange={set("acronym")} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="i-size">Players per team</Label>
          <Input id="i-size" type="number" min={1} max={8} value={form.teamSize} onChange={set("teamSize")} />
        </div>
        <div className="flex flex-col gap-2">
          <Label>Current stage</Label>
          <Select value={form.currentStage} onValueChange={(v) => setForm((f) => ({ ...f, currentStage: v }))}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {t.stages.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-2 sm:col-span-2">
          <Label htmlFor="i-stages">Stages (comma separated, in order)</Label>
          <Input id="i-stages" value={form.stages} onChange={set("stages")} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="i-a">Team A colour</Label>
          <Input id="i-a" value={form.teamA} onChange={set("teamA")} placeholder="#F25D0D" />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="i-b">Team B colour</Label>
          <Input id="i-b" value={form.teamB} onChange={set("teamB")} placeholder="#0DB5F2" />
        </div>
      </fieldset>
      {editable && (
        <Button
          type="button"
          className="self-start"
          disabled={pending}
          onClick={() => run(() => updateTournamentInfo(t.slug, { ...form, teamSize: Number(form.teamSize) }), "Saved.")}
        >
          <Save /> Save
        </Button>
      )}
    </TournamentPanel>
  );
}
