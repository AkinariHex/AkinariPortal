import type { Caster, PoolMap, Qualifiers, Team } from "./bundle";

export type TournamentRole = "admin" | "host" | "viewer";

export type TournamentRow = {
  id: number;
  slug: string;
  name: string;
  acronym: string;
  team_size: number;
  stages: string[];
  current_stage: string;
  teams: Team[];
  pool: Record<string, PoolMap[]>;
  qualifiers: Qualifiers | null;
  casters: Caster[];
  theme: { teamA?: string; teamB?: string } | null;
  read_key_created_at: string | null;
  updated_at: string;
};

export type TournamentMember = {
  user_id: string;
  username: string;
  role: "host" | "viewer";
  added_at: string;
};

// Every tournament column except read_key_hash, which never leaves the server.
export const TOURNAMENT_COLUMNS =
  "id,slug,name,acronym,team_size,stages,current_stage,teams,pool,qualifiers,casters,theme,read_key_created_at,updated_at";
