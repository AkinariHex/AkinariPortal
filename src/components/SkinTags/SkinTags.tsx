import { cn } from "@/lib/utils";

interface TagDef {
  key: string;
  label: string;
  /** Whether this tag has a dedicated grid-view color variant (`.gridTag`). */
  grid?: boolean;
}

/**
 * Single source of truth for skin tag rendering, replacing the ~21-branch
 * ladder that used to be duplicated 4x across the profile. Colors come from the
 * global `.tag` classes in tags.css so the look is preserved exactly.
 */
const TAG_DEFS: TagDef[] = [
  { key: "lazer", label: "Lazer", grid: true },
  { key: "current", label: "Currently Using" },
  { key: "tournaments", label: "Using in Tournaments" },
  { key: "casual", label: "Casual" },
  { key: "old", label: "Old" },
  { key: "aim", label: "Aim" },
  { key: "stream", label: "Stream" },
  { key: "tech", label: "Tech" },
  { key: "reading", label: "Reading" },
  { key: "speed", label: "Speed" },
  { key: "highAR", label: "HighAR" },
  { key: "lowAR", label: "LowAR" },
  { key: "highCS", label: "HighCS" },
  { key: "lowCS", label: "LowCS" },
  { key: "troll", label: "Troll" },
  { key: "NM", label: "NM", grid: true },
  { key: "HD", label: "HD", grid: true },
  { key: "HR", label: "HR", grid: true },
  { key: "DT", label: "DT", grid: true },
  { key: "EZ", label: "EZ", grid: true },
  { key: "FL", label: "FL", grid: true },
];

interface SkinTagsProps {
  tags: string[];
  grid?: boolean;
  className?: string;
}

export default function SkinTags({ tags, grid, className }: SkinTagsProps) {
  const active = TAG_DEFS.filter((def) => tags.includes(def.key));
  if (active.length === 0) return null;

  return (
    <div className={cn("flex flex-row flex-wrap gap-1", className)}>
      {active.map((def) => (
        <div
          key={def.key}
          className={cn("tag", def.key, grid && def.grid && "gridTag")}
        >
          {def.label}
        </div>
      ))}
    </div>
  );
}
