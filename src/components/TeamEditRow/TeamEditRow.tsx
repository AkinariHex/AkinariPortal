"use client";

import { useState } from "react";
import { Save, Trash2 } from "lucide-react";
import { removeTeam, updateTeam } from "@/app/tournaments/[slug]/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Team } from "@/lib/tournaments/bundle";
import { useServerAction } from "@/lib/tournaments/useServerAction";

export default function TeamEditRow({ slug, index, team, editable }: { slug: string; index: number; team: Team; editable: boolean }) {
  const { pending, run } = useServerAction();
  const [form, setForm] = useState({ name: team.name, acronym: team.acronym ?? "", image: team.image ?? "", seed: team.seed ? String(team.seed) : "" });
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <li className="flex flex-col gap-3 rounded-md border border-border bg-site-primary px-4 py-3">
      <fieldset disabled={!editable || pending} className="grid gap-2 sm:grid-cols-[2fr_1fr_3fr_80px]">
        <Input aria-label="Team name" value={form.name} onChange={set("name")} />
        <Input aria-label="Acronym" value={form.acronym} onChange={set("acronym")} placeholder="Acronym" />
        <Input aria-label="Image URL" value={form.image} onChange={set("image")} placeholder="Image URL" />
        <Input aria-label="Seed" value={form.seed} onChange={set("seed")} placeholder="Seed" inputMode="numeric" />
      </fieldset>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs text-muted-foreground">
          {team.players.map((p) => `${p.name} (${p.country || "?"})`).join(" · ")}
        </span>
        {editable && (
          <div className="flex gap-2">
            <Button type="button" size="sm" variant="outline" disabled={pending} onClick={() => run(() => updateTeam(slug, index, form), "Team saved.")}>
              <Save /> Save
            </Button>
            <Button type="button" size="sm" variant="destructive" disabled={pending} onClick={() => run(() => removeTeam(slug, index), "Team removed.")}>
              <Trash2 /> Remove
            </Button>
          </div>
        )}
      </div>
    </li>
  );
}
