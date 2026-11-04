"use client";

import { useState } from "react";
import { Download, KeyRound, Trash2 } from "lucide-react";
import { generateReadKey, revokeReadKey } from "@/app/tournaments/[slug]/actions";
import CopyField from "@/components/CopyField/CopyField";
import OverlayConfigDownload from "@/components/OverlayConfigDownload/OverlayConfigDownload";
import OverlayConnectionTest from "@/components/OverlayConnectionTest/OverlayConnectionTest";
import TournamentPanel from "@/components/TournamentPanel/TournamentPanel";
import { Button } from "@/components/ui/button";
import { tournamentBundleSchema, type TournamentBundle } from "@/lib/tournaments/bundle";
import { downloadJson } from "@/lib/tournaments/downloadJson";
import { useServerAction } from "@/lib/tournaments/useServerAction";

export default function TournamentOverlay({
  slug,
  bundle,
  editable,
  keyCreatedAt,
  apiUrl,
}: {
  slug: string;
  bundle: TournamentBundle;
  editable: boolean;
  keyCreatedAt: string | null;
  apiUrl: string;
}) {
  const { pending, run } = useServerAction();
  const [freshKey, setFreshKey] = useState<string | null>(null);
  const check = tournamentBundleSchema.safeParse(bundle);

  return (
    <div className="flex flex-col gap-6">
      <TournamentPanel
        title="Overlay file"
        description="bundle.json goes into the overlay's public/ folder (offline mode), or let the overlay read it live with the settings below."
      >
        {!check.success && (
          <p className="text-sm text-destructive">The bundle has errors: {check.error.issues[0]?.path.join(".")} {check.error.issues[0]?.message}</p>
        )}
        <Button type="button" className="self-start" onClick={() => downloadJson(bundle, "bundle.json")}>
          <Download /> Download bundle.json
        </Button>
        <details>
          <summary className="cursor-pointer text-sm text-muted-foreground">Preview</summary>
          <pre className="mt-2 max-h-96 overflow-auto rounded-md bg-site-primary p-3 text-xs">{JSON.stringify(bundle, null, 2)}</pre>
        </details>
      </TournamentPanel>

      <TournamentPanel
        title="Live overlay"
        description="The overlay downloads this tournament by itself every few seconds. The key is shown once; generating a new one disconnects overlays using the old one."
      >
        <OverlayConfigDownload slug={slug} apiUrl={apiUrl} editable={editable} freshKey={freshKey} onKey={setFreshKey} />
        <span className="text-sm font-medium text-foreground">Or set it by hand in tosu</span>
        <ol className="flex list-decimal flex-col gap-1 pl-5 text-sm text-muted-foreground">
          <li>Generate a key below and copy it.</li>
          <li>
            On the streaming PC, with tosu running, open <code>http://127.0.0.1:24050</code>, find the overlay (built from{" "}
            <code>tosu-overlay-preset</code> and copied into tosu&apos;s <code>static</code> folder) and open its <b>settings</b>.
          </li>
          <li>
            Set <b>Data source</b> = <code>portal</code>, <b>Portal API URL</b> = the URL below, <b>Portal read key</b> = the key. Save.
          </li>
          <li>
            In the overlay SidePanel (OBS: right-click the source &gt; Interact) the status shows <code>data portal</code>. After edits here press <b>Refresh data</b> in the SidePanel: the
            overlay only calls the Portal on load (when it has no saved copy) and on that button.
          </li>
        </ol>
        {/^https?:\/\/(localhost|127\.0\.0\.1)/.test(apiUrl) && (
          <p className="rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-foreground">
            This URL points to a local Portal (NEXTAUTH_URL). It only works on the PC running it; on the deployed site it becomes the public
            address automatically.
          </p>
        )}
        <CopyField label="API URL" value={apiUrl} />
        <CopyField label="Tournament slug" value={slug} />
        {keyCreatedAt && <OverlayConnectionTest key={freshKey ?? "saved"} apiUrl={apiUrl} initialKey={freshKey} />}
        {freshKey ? (
          <CopyField label="Read key (copy it now, it won't be shown again)" value={freshKey} />
        ) : (
          <p className="text-sm text-muted-foreground">{keyCreatedAt ? `Key active since ${new Date(keyCreatedAt).toLocaleString()}.` : "No key yet: the live API is off."}</p>
        )}
        {editable && (
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              disabled={pending}
              onClick={async () => {
                const res = await run(() => generateReadKey(slug), "New key generated.");
                if (res?.key) setFreshKey(res.key);
              }}
            >
              <KeyRound /> {keyCreatedAt ? "Regenerate key" : "Generate key"}
            </Button>
            {keyCreatedAt && (
              <Button
                type="button"
                variant="destructive"
                disabled={pending}
                onClick={async () => {
                  const res = await run(() => revokeReadKey(slug), "Key revoked.");
                  if (res?.status === "done") setFreshKey(null);
                }}
              >
                <Trash2 /> Revoke
              </Button>
            )}
          </div>
        )}
      </TournamentPanel>
    </div>
  );
}
