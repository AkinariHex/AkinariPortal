import { z } from "zod";

// Tournament bundle v1: the single document a tosu overlay consumes, served by
// GET /api/overlay/[slug] and downloadable as bundle.json.
// SAME FILE as tosu-overlay-preset/src/core/schema/bundle.ts: edit both, and
// bump BUNDLE_VERSION on any breaking change. Spec: docs/overlay-bundle.md.
export const BUNDLE_VERSION = 1;

export const MODS = ["NM", "HD", "HR", "DT", "FM", "EZ", "FL", "CS", "TB"] as const;

export const playerSchema = z.object({
  osuId: z.number().int().positive(),
  name: z.string(),
  country: z.string(), // ISO 3166 alpha-2, "" when unknown
});

export const teamSchema = z.object({
  name: z.string().min(1),
  acronym: z.string().optional(),
  image: z.string().optional(),
  seed: z.number().int().optional(),
  players: z.array(playerSchema),
});

export const poolMapSchema = z.object({
  slot: z.string().min(1), // "NM1"
  mods: z.enum(MODS),
  beatmapId: z.number().int(),
  setId: z.number().int(),
  title: z.string(),
  artist: z.string(),
  version: z.string(), // difficulty name
  mapper: z.string(),
  sr: z.number(), // star rating with the slot's mods
  bpm: z.number(),
  cs: z.number(),
  ar: z.number(),
  od: z.number(),
  length: z.number(), // drain seconds, after DT
});

export const qualifierTeamSchema = z.object({
  team: z.string(),
  seed: z.number().int(),
  zsum: z.number(),
  avgScore: z.number(),
  modSeeds: z.record(z.string(), z.number().int()),
  maps: z.record(z.string(), z.object({ score: z.number(), placement: z.number().int() })),
});

export const qualifiersSchema = z.object({
  qualified: z.number().int(),
  teams: z.array(qualifierTeamSchema),
});

export const casterSchema = z.object({
  name: z.string().min(1),
  osuId: z.number().int().optional(),
  country: z.string().optional(),
  twitch: z.string().optional(),
});

export const tournamentBundleSchema = z.object({
  version: z.literal(BUNDLE_VERSION),
  updatedAt: z.string(),
  tournament: z.object({
    slug: z.string(),
    name: z.string(),
    acronym: z.string(),
    teamSize: z.number().int(),
    stages: z.array(z.string()),
    currentStage: z.string(),
  }),
  teams: z.array(teamSchema),
  pool: z.record(z.string(), z.array(poolMapSchema)),
  qualifiers: qualifiersSchema.nullable(),
  casters: z.array(casterSchema),
  theme: z.object({ teamA: z.string(), teamB: z.string() }).partial().optional(),
});

export type Player = z.infer<typeof playerSchema>;
export type Team = z.infer<typeof teamSchema>;
export type PoolMap = z.infer<typeof poolMapSchema>;
export type QualifierTeam = z.infer<typeof qualifierTeamSchema>;
export type Qualifiers = z.infer<typeof qualifiersSchema>;
export type Caster = z.infer<typeof casterSchema>;
export type TournamentBundle = z.infer<typeof tournamentBundleSchema>;
export type Mod = (typeof MODS)[number];
