"use client";

import { useState } from "react";
import { FileCog } from "lucide-react";
import { generateReadKey } from "@/app/tournaments/[slug]/actions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { downloadJson } from "@/lib/tournaments/downloadJson";
import { useServerAction } from "@/lib/tournaments/useServerAction";

type Source = "portal" | "local";

// overlay.config.json for tosu-overlay-preset overlays: goes next to
// index.html in the overlay folder and sets the data source (and, for live
// data, API URL + read key) with no tosu dashboard step. The raw key exists
// only right after generation, so without one in this session a live config
// mints a new key (old overlays then stop until they get the new file).
export default function OverlayConfigDownload({
  slug,
  apiUrl,
  editable,
  freshKey,
  onKey,
}: {
  slug: string;
  apiUrl: string;
  editable: boolean;
  freshKey: string | null;
  onKey: (key: string) => void;
}) {
  const { pending, run } = useServerAction();
  const [source, setSource] = useState<Source>(editable ? "portal" : "local");

  const save = (readKey?: string) =>
    downloadJson(source === "portal" ? { dataSource: "portal", apiUrl, readKey, pollSeconds: 0 } : { dataSource: "local" }, "overlay.config.json");

  const download = async () => {
    if (source === "local" || freshKey) return save(freshKey ?? undefined);
    const res = await run(() => generateReadKey(slug), "New key generated.");
    if (res?.key) {
      onKey(res.key);
      save(res.key);
    }
  };

  return (
    <div className="flex flex-col gap-3 rounded-md border border-border bg-site-primary p-4">
      <div className="flex flex-col gap-1">
        <span className="text-sm font-medium text-foreground">overlay.config.json</span>
        <span className="text-xs text-muted-foreground">
          Put it in the overlay folder next to <code>index.html</code> (inside tosu&apos;s <code>static</code> folder). The overlay reads it on load:
          no settings to type in tosu. It contains the read key, so don&apos;t share it publicly.
        </span>
      </div>
      <div className="flex flex-wrap items-end gap-2">
        <div className="flex flex-col gap-2">
          <Label>Data source</Label>
          <Select value={source} onValueChange={(v) => setSource(v === "local" ? "local" : "portal")}>
            <SelectTrigger className="w-56">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {editable && <SelectItem value="portal">Live from the Portal</SelectItem>}
              <SelectItem value="local">Local bundle.json</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button type="button" disabled={pending} onClick={download}>
          <FileCog /> {source === "portal" && !freshKey ? "New key + download config" : "Download config"}
        </Button>
      </div>
      {source === "portal" && !freshKey && (
        <span className="text-xs text-amber-500">The current key can&apos;t be read back, so this creates a new one: overlays with an older config stop updating until they get this file.</span>
      )}
    </div>
  );
}
