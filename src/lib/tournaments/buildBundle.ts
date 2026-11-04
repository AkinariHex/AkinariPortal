import { BUNDLE_VERSION, type TournamentBundle } from "./bundle";
import type { TournamentRow } from "./types";

// Database row -> overlay bundle (docs/overlay-bundle.md).
export function buildBundle(t: TournamentRow): TournamentBundle {
  return {
    version: BUNDLE_VERSION,
    updatedAt: t.updated_at,
    tournament: {
      slug: t.slug,
      name: t.name,
      acronym: t.acronym,
      teamSize: t.team_size,
      stages: t.stages,
      currentStage: t.current_stage,
    },
    teams: t.teams ?? [],
    pool: t.pool ?? {},
    qualifiers: t.qualifiers ?? null,
    casters: t.casters ?? [],
    ...(t.theme ? { theme: t.theme } : {}),
  };
}
