import type { OsuSettings } from "@/lib/osuConfig";
import { cn } from "@/lib/utils";

type Props = {
  settings: OsuSettings;
  className?: string;
};

const WINDOW_MODE_LABEL = {
  fullscreen: "Fullscreen",
  borderless: "Borderless",
  windowed: "Windowed",
} as const;

const CONFINE_LABEL = {
  never: "Never",
  "during-gameplay": "During gameplay",
  fullscreen: "Fullscreen",
  always: "Always",
} as const;

const RENDERER_LABEL = {
  automatic: "Automatic",
  opengl: "OpenGL",
  direct3d11: "Direct3D 11",
  vulkan: "Vulkan",
  metal: "Metal",
} as const;

function frameLimiterLabel(settings: OsuSettings) {
  const limiter = settings.display?.frameLimiter;
  if (!limiter) return undefined;
  switch (limiter) {
    case "vsync":
      return "VSync";
    case "unlimited":
      return "Unlimited";
    case "custom":
      return settings.display?.customFrameLimit
        ? `${settings.display.customFrameLimit} fps`
        : "Custom";
    case "120fps":
      return "120 fps";
    case "240fps":
      return "240 fps";
    default:
      return `${limiter} refresh rate`;
  }
}

const onOff = (value: boolean | undefined) =>
  value === undefined ? undefined : value ? "On" : "Off";

function Row({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div className="flex flex-row items-baseline justify-between gap-3 border-b border-white/[0.04] py-1 last:border-b-0">
      <span className="text-[0.78rem] text-[#8fa2b8]">{label}</span>
      <span className="text-right text-[0.85rem] tabular-nums text-[#cee0f6]">
        {value}
      </span>
    </div>
  );
}

function Group({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-0.5">
      <span className="mb-1 text-[0.7rem] uppercase tracking-wide text-accent-blue">
        {title}
      </span>
      {children}
    </div>
  );
}

function VolumeBar({ label, value }: { label: string; value?: number }) {
  if (value === undefined) return null;
  return (
    <div className="flex flex-row items-center gap-2 py-1">
      <span className="w-[4.2rem] shrink-0 text-[0.78rem] text-[#8fa2b8]">
        {label}
      </span>
      <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/[0.08]">
        <span
          className="block h-full rounded-full bg-accent-blue"
          style={{ width: `${value}%` }}
        />
      </span>
      <span className="w-9 shrink-0 text-right text-[0.78rem] tabular-nums text-[#cee0f6]">
        {value}%
      </span>
    </div>
  );
}

/**
 * Read-only view of a player's osu! settings. Renders only the groups that
 * actually hold something, so a half-filled profile never shows empty rows.
 */
export default function OsuSettingsCard({ settings, className }: Props) {
  const { display, audio, cursor, gameplay } = settings;

  const hasDisplay = display && Object.keys(display).length > 0;
  const hasAudio = audio && Object.keys(audio).length > 0;
  const hasCursor = cursor && Object.keys(cursor).length > 0;
  const hasGameplay = gameplay && Object.keys(gameplay).length > 0;

  if (!hasDisplay && !hasAudio && !hasCursor && !hasGameplay) return null;

  const resolution = display?.resolution
    ? [
        `${display.resolution.width} x ${display.resolution.height}`,
        display.windowMode ? WINDOW_MODE_LABEL[display.windowMode] : null,
      ]
        .filter(Boolean)
        .join(", ")
    : display?.windowMode
      ? WINDOW_MODE_LABEL[display.windowMode]
      : undefined;

  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2",
        className
      )}
    >
      {hasDisplay && (
        <Group title="Display">
          <Row label="Resolution" value={resolution} />
          <Row label="Letterboxing" value={onOff(display?.letterboxing)} />
          {display?.letterboxOffset && (
            <Row
              label="Letterbox offset"
              value={`X ${display.letterboxOffset.x}, Y ${display.letterboxOffset.y}`}
            />
          )}
          <Row label="Frame limiter" value={frameLimiterLabel(settings)} />
          <Row
            label="Refresh rate"
            value={display?.refreshRate ? `${display.refreshRate} Hz` : undefined}
          />
          <Row
            label="Renderer"
            value={display?.renderer ? RENDERER_LABEL[display.renderer] : undefined}
          />
          <Row
            label="Compatibility mode"
            value={onOff(display?.compatibilityMode)}
          />
        </Group>
      )}

      {hasAudio && (
        <Group title="Audio">
          <VolumeBar label="Master" value={audio?.master} />
          <VolumeBar label="Music" value={audio?.music} />
          <VolumeBar label="Effects" value={audio?.effects} />
          <Row
            label="Universal offset"
            value={
              audio?.offsetMs !== undefined ? `${audio.offsetMs} ms` : undefined
            }
          />
          <Row
            label="Beatmap hitsounds"
            value={
              audio?.ignoreBeatmapHitsounds === undefined
                ? undefined
                : audio.ignoreBeatmapHitsounds
                  ? "Ignored"
                  : "Used"
            }
          />
          <Row label="Skin samples" value={onOff(audio?.useSkinSamples)} />
        </Group>
      )}

      {hasCursor && (
        <Group title="Cursor">
          <Row
            label="Size"
            value={cursor?.size !== undefined ? String(cursor.size) : undefined}
          />
          <Row label="Automatic sizing" value={onOff(cursor?.automaticSizing)} />
          <Row label="Raw input" value={onOff(cursor?.rawInput)} />
          <Row
            label="Sensitivity"
            value={
              cursor?.sensitivity !== undefined
                ? `${cursor.sensitivity}x`
                : undefined
            }
          />
          <Row
            label="Absolute to window"
            value={onOff(cursor?.mapAbsoluteToWindow)}
          />
          <Row
            label="Mouse buttons"
            value={
              cursor?.disableButtons === undefined
                ? undefined
                : cursor.disableButtons
                  ? "Disabled"
                  : "Enabled"
            }
          />
          <Row
            label="Mouse wheel"
            value={
              cursor?.disableWheel === undefined
                ? undefined
                : cursor.disableWheel
                  ? "Disabled"
                  : "Enabled"
            }
          />
          <Row
            label="Confine cursor"
            value={cursor?.confine ? CONFINE_LABEL[cursor.confine] : undefined}
          />
          <Row label="Skin cursor" value={onOff(cursor?.useSkinCursor)} />
          <Row label="Cursor ripples" value={onOff(cursor?.ripples)} />
        </Group>
      )}

      {hasGameplay && (
        <Group title="Gameplay">
          <Row
            label="Background dim"
            value={
              gameplay?.backgroundDim !== undefined
                ? `${gameplay.backgroundDim}%`
                : undefined
            }
          />
          <Row label="Background video" value={onOff(gameplay?.backgroundVideo)} />
          <Row label="Storyboard" value={onOff(gameplay?.storyboard)} />
          <Row label="Snaking sliders" value={onOff(gameplay?.snakingSliders)} />
          <Row label="Hit lighting" value={onOff(gameplay?.hitLighting)} />
          <Row label="Combo bursts" value={onOff(gameplay?.comboBursts)} />
          <Row
            label="Mania scroll speed"
            value={
              gameplay?.maniaScrollSpeed !== undefined
                ? String(gameplay.maniaScrollSpeed)
                : undefined
            }
          />
          <Row label="Scale with BPM" value={onOff(gameplay?.maniaScaleWithBpm)} />
          <Row
            label="Speed per beatmap"
            value={onOff(gameplay?.maniaSpeedPerBeatmap)}
          />
        </Group>
      )}
    </div>
  );
}
