"use client";

import { useState } from "react";
import TournamentCasters from "@/components/TournamentCasters/TournamentCasters";
import TournamentInfoForm from "@/components/TournamentInfoForm/TournamentInfoForm";
import TournamentMembers from "@/components/TournamentMembers/TournamentMembers";
import TournamentOverlay from "@/components/TournamentOverlay/TournamentOverlay";
import TournamentPool from "@/components/TournamentPool/TournamentPool";
import TournamentQualifiers from "@/components/TournamentQualifiers/TournamentQualifiers";
import TournamentTeams from "@/components/TournamentTeams/TournamentTeams";
import type { TournamentBundle } from "@/lib/tournaments/bundle";
import type { TournamentMember, TournamentRole, TournamentRow } from "@/lib/tournaments/types";
import { cn } from "@/lib/utils";

const TABS = ["Overview", "Teams", "Mappool", "Qualifiers", "Casters", "Overlay", "Access"] as const;
type Tab = (typeof TABS)[number];

export default function TournamentClient({
  tournament: t,
  bundle,
  role,
  members,
  apiUrl,
}: {
  tournament: TournamentRow;
  bundle: TournamentBundle;
  role: TournamentRole;
  members: TournamentMember[];
  apiUrl: string;
}) {
  const [tab, setTab] = useState<Tab>("Overview");
  const editable = role !== "viewer";
  const tabs = TABS.filter((x) => x !== "Access" || role === "admin");

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold text-foreground">{t.name}</h1>
          <span className="text-sm text-muted-foreground">
            {t.acronym || t.slug} · {t.current_stage} · {role}
          </span>
        </div>

        <nav className="flex flex-wrap gap-1 border-b border-border" aria-label="Tournament sections">
          {tabs.map((x) => (
            <button
              key={x}
              type="button"
              onClick={() => setTab(x)}
              className={cn(
                "-mb-px border-b-2 px-3 py-2 text-sm transition-colors",
                tab === x ? "border-foreground text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              {x}
            </button>
          ))}
        </nav>

        {tab === "Overview" && <TournamentInfoForm tournament={t} editable={editable} />}
        {tab === "Teams" && <TournamentTeams slug={t.slug} teams={t.teams} editable={editable} />}
        {tab === "Mappool" && <TournamentPool slug={t.slug} stages={t.stages} pool={t.pool} editable={editable} />}
        {tab === "Qualifiers" && <TournamentQualifiers slug={t.slug} qualifiers={t.qualifiers} editable={editable} />}
        {tab === "Casters" && <TournamentCasters slug={t.slug} casters={t.casters} editable={editable} />}
        {tab === "Overlay" && (
          <TournamentOverlay slug={t.slug} bundle={bundle} editable={editable} keyCreatedAt={t.read_key_created_at} apiUrl={apiUrl} />
        )}
        {tab === "Access" && role === "admin" && <TournamentMembers slug={t.slug} members={members} />}
      </div>
    </div>
  );
}
