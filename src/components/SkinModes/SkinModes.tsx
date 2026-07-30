import { cn } from "@/lib/utils";

interface ModeDef {
  key: string;
  src: string;
  rotate?: boolean;
}

const MODE_DEFS: ModeDef[] = [
  { key: "osu!standard", src: "/img/modes/mode-osu.png" },
  { key: "osu!mania", src: "/img/modes/mode-mania.png" },
  { key: "osu!taiko", src: "/img/modes/mode-taiko.png" },
  { key: "osu!ctb", src: "/img/modes/mode-fruits.png", rotate: true },
];

interface SkinModesProps {
  modes: string[];
}

/**
 * The four gamemode icons. Active modes render at full brightness, inactive
 * ones dimmed to 52% - matching the original `.gamemodes .skinMode` styling.
 */
export default function SkinModes({ modes }: SkinModesProps) {
  return (
    <div className="flex flex-row items-center">
      {MODE_DEFS.map((mode) => {
        const active = modes.includes(mode.key);
        return (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={mode.key}
            src={mode.src}
            alt={mode.key}
            className={cn(
              "size-[21px] select-none transition-[filter] duration-150",
              active ? "brightness-100" : "brightness-[0.52]"
            )}
            style={mode.rotate ? { rotate: "-90deg" } : undefined}
          />
        );
      })}
    </div>
  );
}
