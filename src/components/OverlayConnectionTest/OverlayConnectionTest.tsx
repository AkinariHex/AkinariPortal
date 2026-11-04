"use client";

import { useState } from "react";
import { PlugZap } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// Calls the live API exactly like an overlay does (x-api-key header) and
// reports what came back. The key never leaves this browser + the Portal.
export default function OverlayConnectionTest({ apiUrl, initialKey }: { apiUrl: string; initialKey: string | null }) {
  const [key, setKey] = useState(initialKey ?? "");
  const [pending, setPending] = useState(false);

  const test = async () => {
    setPending(true);
    try {
      const res = await fetch(apiUrl, { headers: { "x-api-key": key.trim() }, cache: "no-store" });
      if (res.status === 200) {
        const bundle = await res.json();
        toast.success(`Connected: ${bundle.teams?.length ?? 0} teams, stage ${bundle.tournament?.currentStage ?? "-"}.`);
      } else if (res.status === 401) {
        toast.error("401: wrong or revoked key.");
      } else if (res.status === 429) {
        toast.error("429: rate limited, retry in a minute.");
      } else {
        toast.error(`HTTP ${res.status}: is the migration (docs/tournaments.sql) applied?`);
      }
    } catch {
      toast.error("Could not reach the API URL.");
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs text-muted-foreground">Test the key</span>
      <div className="flex gap-2">
        <Input type="password" value={key} onChange={(e) => setKey(e.target.value)} placeholder="Paste the read key" className="flex-1 font-mono text-xs" />
        <Button type="button" variant="outline" disabled={pending || key.trim().length < 16} onClick={test}>
          <PlugZap /> {pending ? "Testing..." : "Test"}
        </Button>
      </div>
    </div>
  );
}
