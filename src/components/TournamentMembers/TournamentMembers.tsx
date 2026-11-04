"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, UserPlus } from "lucide-react";
import { addMember, deleteTournament, removeMember } from "@/app/tournaments/[slug]/actions";
import TournamentPanel from "@/components/TournamentPanel/TournamentPanel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { TournamentMember } from "@/lib/tournaments/types";
import { useServerAction } from "@/lib/tournaments/useServerAction";

// Site admin only: who can open this tournament. Hosts edit everything and
// manage the overlay key; viewers can read and download.
export default function TournamentMembers({ slug, members }: { slug: string; members: TournamentMember[] }) {
  const router = useRouter();
  const { pending, run } = useServerAction();
  const [user, setUser] = useState("");
  const [role, setRole] = useState<"host" | "viewer">("host");
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <div className="flex flex-col gap-6">
      <TournamentPanel title="Access" description="Add people by osu! username or id. They see this tournament after logging in with osu!.">
        <form
          className="flex flex-wrap gap-2"
          onSubmit={async (e) => {
            e.preventDefault();
            const res = await run(() => addMember(slug, user, role), "Added.");
            if (res?.status === "done") setUser("");
          }}
        >
          <Input value={user} onChange={(e) => setUser(e.target.value)} placeholder="osu! username or id" className="min-w-48 flex-1" />
          <Select value={role} onValueChange={(v) => setRole(v as "host" | "viewer")}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="host">Host</SelectItem>
              <SelectItem value="viewer">Viewer</SelectItem>
            </SelectContent>
          </Select>
          <Button type="submit" disabled={pending || !user.trim()}>
            <UserPlus /> Add
          </Button>
        </form>
        {members.length === 0 ? (
          <p className="text-sm text-muted-foreground">Only site admins can open this tournament.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {members.map((m) => (
              <li key={m.user_id} className="flex items-center justify-between gap-2 rounded-md border border-border bg-site-primary px-4 py-2 text-sm">
                <span>
                  <span className="font-medium text-foreground">{m.username}</span> <span className="text-muted-foreground">#{m.user_id} · {m.role}</span>
                </span>
                <Button type="button" size="icon-sm" variant="ghost" disabled={pending} onClick={() => run(() => removeMember(slug, m.user_id), "Removed.")} aria-label={`Remove ${m.username}`}>
                  <Trash2 />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </TournamentPanel>

      <TournamentPanel title="Danger zone" description="Deleting removes the tournament, its data and all access. It can't be undone.">
        <Button
          type="button"
          variant="destructive"
          className="self-start"
          disabled={pending}
          onClick={async () => {
            if (!confirmDelete) return setConfirmDelete(true);
            const res = await run(() => deleteTournament(slug), "Tournament deleted.");
            if (res?.status === "done") router.push("/tournaments");
          }}
        >
          <Trash2 /> {confirmDelete ? "Click again to delete" : "Delete tournament"}
        </Button>
      </TournamentPanel>
    </div>
  );
}
