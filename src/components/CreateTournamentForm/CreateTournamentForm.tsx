"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, UserPlus } from "lucide-react";
import { createTournament, type NewMember } from "@/app/tournaments/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toastResult } from "@/lib/tournaments/toastResult";

const EMPTY = { name: "", slug: "", acronym: "", teamSize: "2", stages: "Qualifiers, RO16, QF, SF, F, GF" };
const EMPTY_MEMBER: NewMember = { user: "", role: "host" };

// Settings card, site admins only: create a tournament and choose who can open
// it (osu! user id or username) as host or viewer.
export default function CreateTournamentForm() {
  const router = useRouter();
  const [form, setForm] = useState(EMPTY);
  const [members, setMembers] = useState<NewMember[]>([EMPTY_MEMBER]);
  const [pending, startTransition] = useTransition();
  const set = (k: keyof typeof EMPTY) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const setMember = (i: number, patch: Partial<NewMember>) => setMembers((ms) => ms.map((m, j) => (j === i ? { ...m, ...patch } : m)));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      try {
        const res = await createTournament({ ...form, teamSize: Number(form.teamSize), members });
        if (toastResult(res, "Tournament created.")) {
          router.push(`/tournaments/${form.slug.trim().toLowerCase()}`);
          setForm(EMPTY);
          setMembers([EMPTY_MEMBER]);
        }
      } catch {
        toastResult({ status: "error" }, "");
      }
    });
  };

  return (
    <form id="tournaments" onSubmit={submit} className="flex flex-col gap-4 rounded-xl border border-border bg-site-secondary p-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold text-foreground">New tournament</h2>
        <p className="text-sm text-muted-foreground">Only you see this. Hosts edit everything and manage the overlay key, viewers can read and download.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="t-name">Name</Label>
          <Input id="t-name" value={form.name} onChange={set("name")} placeholder="Che Sfondo Cup 2" required />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="t-slug">Slug</Label>
          <Input id="t-slug" value={form.slug} onChange={set("slug")} placeholder="csc2" pattern="[a-z0-9-]{2,40}" required />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="t-acronym">Acronym</Label>
          <Input id="t-acronym" value={form.acronym} onChange={set("acronym")} placeholder="CSC2" />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="t-size">Players per team</Label>
          <Input id="t-size" type="number" min={1} max={8} value={form.teamSize} onChange={set("teamSize")} />
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="t-stages">Stages (comma separated, in order)</Label>
        <Input id="t-stages" value={form.stages} onChange={set("stages")} />
      </div>

      <div className="flex flex-col gap-2">
        <Label>Access</Label>
        {members.map((m, i) => (
          <div key={i} className="flex gap-2">
            <Input
              aria-label={`Member ${i + 1} osu! id or username`}
              value={m.user}
              onChange={(e) => setMember(i, { user: e.target.value })}
              placeholder="osu! user id or username"
              className="flex-1"
            />
            <Select value={m.role} onValueChange={(v) => setMember(i, { role: v === "viewer" ? "viewer" : "host" })}>
              <SelectTrigger className="w-32" aria-label={`Member ${i + 1} permission`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="host">Host</SelectItem>
                <SelectItem value="viewer">Viewer</SelectItem>
              </SelectContent>
            </Select>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              aria-label={`Remove member ${i + 1}`}
              onClick={() => setMembers((ms) => (ms.length > 1 ? ms.filter((_, j) => j !== i) : [EMPTY_MEMBER]))}
            >
              <Trash2 />
            </Button>
          </div>
        ))}
        <Button type="button" variant="outline" size="sm" className="self-start" onClick={() => setMembers((ms) => [...ms, EMPTY_MEMBER])}>
          <UserPlus /> Add person
        </Button>
      </div>

      <Button type="submit" disabled={pending} className="self-start">
        <Plus /> {pending ? "Creating..." : "Create tournament"}
      </Button>
    </form>
  );
}
