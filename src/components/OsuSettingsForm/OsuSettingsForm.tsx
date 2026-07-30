"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import type {
  OsuAudioSettings,
  OsuCursorSettings,
  OsuDisplaySettings,
  OsuGameplaySettings,
  OsuSettings,
} from "@/lib/osuConfig";

type Props = {
  value: OsuSettings;
  onChange: (next: OsuSettings) => void;
};

const UNSET = "__unset__";

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3 border-t border-border pt-4 first:border-t-0 first:pt-0">
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
      <div className="flex flex-col gap-3">{children}</div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <Label className="text-sm font-normal text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function SwitchField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean | undefined;
  onChange: (next: boolean) => void;
}) {
  return (
    <Row label={label}>
      <Switch checked={value === true} onCheckedChange={onChange} />
    </Row>
  );
}

function NumberField({
  label,
  value,
  onChange,
  min,
  max,
  suffix,
  placeholder,
}: {
  label: string;
  value: number | undefined;
  onChange: (next: number | undefined) => void;
  min?: number;
  max?: number;
  suffix?: string;
  placeholder?: string;
}) {
  return (
    <Row label={label}>
      <div className="flex items-center gap-2">
        <Input
          type="number"
          inputMode="numeric"
          min={min}
          max={max}
          placeholder={placeholder}
          value={value ?? ""}
          onChange={(e) => {
            const raw = e.target.value;
            if (raw === "") return onChange(undefined);
            const parsed = Number(raw);
            onChange(Number.isFinite(parsed) ? parsed : undefined);
          }}
          className="w-28 tabular-nums"
        />
        {suffix && (
          <span className="w-6 text-sm text-muted-foreground">{suffix}</span>
        )}
      </div>
    </Row>
  );
}

function SliderField({
  label,
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  format,
}: {
  label: string;
  value: number | undefined;
  onChange: (next: number) => void;
  min?: number;
  max?: number;
  step?: number;
  format?: (value: number) => string;
}) {
  const current = value ?? min;
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between gap-3">
        <Label className="text-sm font-normal text-muted-foreground">{label}</Label>
        <span className="text-sm tabular-nums text-foreground">
          {value === undefined ? "-" : (format?.(value) ?? String(value))}
        </span>
      </div>
      <Slider
        min={min}
        max={max}
        step={step}
        value={[current]}
        onValueChange={([next]) => onChange(next)}
      />
    </div>
  );
}

function SelectField<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T | undefined;
  options: { value: T; label: string }[];
  onChange: (next: T | undefined) => void;
}) {
  return (
    <Row label={label}>
      <Select
        value={value ?? UNSET}
        onValueChange={(next) =>
          onChange(next === UNSET ? undefined : (next as T))
        }
      >
        <SelectTrigger className="w-44">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={UNSET}>Not set</SelectItem>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Row>
  );
}

/**
 * Controlled editor for the osu! settings object. A field left untouched stays
 * `undefined` and is simply not published - the profile card renders only what
 * is actually set, so nothing is invented on the player's behalf.
 */
export default function OsuSettingsForm({ value, onChange }: Props) {
  // Offered when the resolution is blank. lazer stores fullscreen as
  // `SizeFullscreen = 9999x9999`, a sentinel meaning "whatever the desktop is",
  // so an import from lazer leaves this empty by design: the file simply does
  // not know the number. The browser does.
  const [screenSize, setScreenSize] = useState<{
    width: number;
    height: number;
  } | null>(null);

  useEffect(() => {
    const ratio = window.devicePixelRatio || 1;
    const width = Math.round(window.screen.width * ratio);
    const height = Math.round(window.screen.height * ratio);
    if (width >= 320 && width <= 15360 && height >= 240 && height <= 8640) {
      setScreenSize({ width, height });
    }
  }, []);

  const display = value.display ?? {};
  const audio = value.audio ?? {};
  const cursor = value.cursor ?? {};
  const gameplay = value.gameplay ?? {};

  const setDisplay = (patch: Partial<OsuDisplaySettings>) =>
    onChange({ ...value, display: { ...display, ...patch } });
  const setAudio = (patch: Partial<OsuAudioSettings>) =>
    onChange({ ...value, audio: { ...audio, ...patch } });
  const setCursor = (patch: Partial<OsuCursorSettings>) =>
    onChange({ ...value, cursor: { ...cursor, ...patch } });
  const setGameplay = (patch: Partial<OsuGameplaySettings>) =>
    onChange({ ...value, gameplay: { ...gameplay, ...patch } });

  const setResolution = (side: "width" | "height", next: number | undefined) => {
    const width = side === "width" ? next : display.resolution?.width;
    const height = side === "height" ? next : display.resolution?.height;
    setDisplay({
      resolution:
        width !== undefined && height !== undefined ? { width, height } : undefined,
    });
  };

  const setLetterboxOffset = (axis: "x" | "y", next: number | undefined) => {
    const x = axis === "x" ? next : display.letterboxOffset?.x;
    const y = axis === "y" ? next : display.letterboxOffset?.y;
    setDisplay({
      letterboxOffset: x !== undefined && y !== undefined ? { x, y } : undefined,
    });
  };

  return (
    <div className="flex flex-col gap-5">
      <Group title="Display">
        <SelectField
          label="Window mode"
          value={display.windowMode}
          onChange={(windowMode) => setDisplay({ windowMode })}
          options={[
            { value: "fullscreen", label: "Fullscreen" },
            { value: "borderless", label: "Borderless" },
            { value: "windowed", label: "Windowed" },
          ]}
        />
        <Row label="Resolution">
          <div className="flex items-center gap-2">
            <Input
              type="number"
              inputMode="numeric"
              placeholder="1920"
              value={display.resolution?.width ?? ""}
              onChange={(e) =>
                setResolution(
                  "width",
                  e.target.value === "" ? undefined : Number(e.target.value)
                )
              }
              className="w-24 tabular-nums"
            />
            <span className="text-sm text-muted-foreground">x</span>
            <Input
              type="number"
              inputMode="numeric"
              placeholder="1080"
              value={display.resolution?.height ?? ""}
              onChange={(e) =>
                setResolution(
                  "height",
                  e.target.value === "" ? undefined : Number(e.target.value)
                )
              }
              className="w-24 tabular-nums"
            />
          </div>
        </Row>
        {!display.resolution && screenSize && (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-site-primary px-3 py-2">
            <span className="text-sm text-muted-foreground">
              {display.windowMode === "fullscreen" ||
              display.windowMode === "borderless"
                ? "osu! lazer stores fullscreen as your desktop resolution, so the file has no number to import."
                : "No resolution set."}
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                setDisplay({
                  resolution: {
                    width: screenSize.width,
                    height: screenSize.height,
                  },
                })
              }
            >
              Use my screen ({screenSize.width} x {screenSize.height})
            </Button>
          </div>
        )}
        <SwitchField
          label="Letterboxing"
          value={display.letterboxing}
          onChange={(letterboxing) => setDisplay({ letterboxing })}
        />
        {display.letterboxing && (
          <>
            <NumberField
              label="Letterbox offset X"
              value={display.letterboxOffset?.x}
              min={-100}
              max={100}
              onChange={(next) => setLetterboxOffset("x", next)}
            />
            <NumberField
              label="Letterbox offset Y"
              value={display.letterboxOffset?.y}
              min={-100}
              max={100}
              onChange={(next) => setLetterboxOffset("y", next)}
            />
          </>
        )}
        <SelectField
          label="Frame limiter"
          value={display.frameLimiter}
          onChange={(frameLimiter) => setDisplay({ frameLimiter })}
          options={[
            { value: "vsync", label: "VSync" },
            { value: "120fps", label: "120 fps" },
            { value: "240fps", label: "240 fps" },
            { value: "unlimited", label: "Unlimited" },
            { value: "custom", label: "Custom" },
            { value: "2x", label: "2x refresh rate" },
            { value: "4x", label: "4x refresh rate" },
            { value: "8x", label: "8x refresh rate" },
          ]}
        />
        {display.frameLimiter === "custom" && (
          <NumberField
            label="Custom frame limit"
            value={display.customFrameLimit}
            min={30}
            max={10000}
            suffix="fps"
            onChange={(customFrameLimit) => setDisplay({ customFrameLimit })}
          />
        )}
        <NumberField
          label="Refresh rate"
          value={display.refreshRate}
          min={24}
          max={1000}
          suffix="Hz"
          onChange={(refreshRate) => setDisplay({ refreshRate })}
        />
        <SelectField
          label="Renderer (lazer)"
          value={display.renderer}
          onChange={(renderer) => setDisplay({ renderer })}
          options={[
            { value: "automatic", label: "Automatic" },
            { value: "opengl", label: "OpenGL" },
            { value: "direct3d11", label: "Direct3D 11" },
            { value: "vulkan", label: "Vulkan" },
            { value: "metal", label: "Metal" },
          ]}
        />
        <SwitchField
          label="Compatibility mode (stable)"
          value={display.compatibilityMode}
          onChange={(compatibilityMode) => setDisplay({ compatibilityMode })}
        />
      </Group>

      <Group title="Audio">
        <SliderField
          label="Master"
          value={audio.master}
          onChange={(master) => setAudio({ master })}
          format={(v) => `${v}%`}
        />
        <SliderField
          label="Music"
          value={audio.music}
          onChange={(music) => setAudio({ music })}
          format={(v) => `${v}%`}
        />
        <SliderField
          label="Effects"
          value={audio.effects}
          onChange={(effects) => setAudio({ effects })}
          format={(v) => `${v}%`}
        />
        <NumberField
          label="Universal offset"
          value={audio.offsetMs}
          min={-500}
          max={500}
          suffix="ms"
          onChange={(offsetMs) => setAudio({ offsetMs })}
        />
        <SwitchField
          label="Ignore beatmap hitsounds"
          value={audio.ignoreBeatmapHitsounds}
          onChange={(ignoreBeatmapHitsounds) =>
            setAudio({ ignoreBeatmapHitsounds })
          }
        />
        <SwitchField
          label="Use skin sound samples"
          value={audio.useSkinSamples}
          onChange={(useSkinSamples) => setAudio({ useSkinSamples })}
        />
      </Group>

      <Group title="Cursor">
        <SliderField
          label="Cursor size"
          value={cursor.size}
          min={0.1}
          max={2}
          step={0.05}
          onChange={(size) => setCursor({ size: Math.round(size * 100) / 100 })}
        />
        <SwitchField
          label="Automatic cursor sizing"
          value={cursor.automaticSizing}
          onChange={(automaticSizing) => setCursor({ automaticSizing })}
        />
        <SwitchField
          label="Raw input"
          value={cursor.rawInput}
          onChange={(rawInput) => setCursor({ rawInput })}
        />
        <SliderField
          label="Sensitivity"
          value={cursor.sensitivity}
          min={0.1}
          max={6}
          step={0.05}
          format={(v) => `${v}x`}
          onChange={(sensitivity) =>
            setCursor({ sensitivity: Math.round(sensitivity * 100) / 100 })
          }
        />
        <SwitchField
          label="Map absolute raw input to window"
          value={cursor.mapAbsoluteToWindow}
          onChange={(mapAbsoluteToWindow) => setCursor({ mapAbsoluteToWindow })}
        />
        <SwitchField
          label="Disable mouse buttons in play"
          value={cursor.disableButtons}
          onChange={(disableButtons) => setCursor({ disableButtons })}
        />
        <SwitchField
          label="Disable mouse wheel in play"
          value={cursor.disableWheel}
          onChange={(disableWheel) => setCursor({ disableWheel })}
        />
        <SelectField
          label="Confine cursor"
          value={cursor.confine}
          onChange={(confine) => setCursor({ confine })}
          options={[
            { value: "never", label: "Never" },
            { value: "during-gameplay", label: "During gameplay" },
            { value: "fullscreen", label: "Fullscreen" },
            { value: "always", label: "Always" },
          ]}
        />
        <SwitchField
          label="Always use skin cursor"
          value={cursor.useSkinCursor}
          onChange={(useSkinCursor) => setCursor({ useSkinCursor })}
        />
        <SwitchField
          label="Cursor ripples"
          value={cursor.ripples}
          onChange={(ripples) => setCursor({ ripples })}
        />
      </Group>

      <Group title="Gameplay">
        <SliderField
          label="Background dim"
          value={gameplay.backgroundDim}
          onChange={(backgroundDim) => setGameplay({ backgroundDim })}
          format={(v) => `${v}%`}
        />
        <SwitchField
          label="Background video"
          value={gameplay.backgroundVideo}
          onChange={(backgroundVideo) => setGameplay({ backgroundVideo })}
        />
        <SwitchField
          label="Storyboards"
          value={gameplay.storyboard}
          onChange={(storyboard) => setGameplay({ storyboard })}
        />
        <SwitchField
          label="Snaking sliders"
          value={gameplay.snakingSliders}
          onChange={(snakingSliders) => setGameplay({ snakingSliders })}
        />
        <SwitchField
          label="Hit lighting"
          value={gameplay.hitLighting}
          onChange={(hitLighting) => setGameplay({ hitLighting })}
        />
        <SwitchField
          label="Combo bursts"
          value={gameplay.comboBursts}
          onChange={(comboBursts) => setGameplay({ comboBursts })}
        />
        <NumberField
          label="osu!mania scroll speed"
          value={gameplay.maniaScrollSpeed}
          min={1}
          max={40}
          onChange={(maniaScrollSpeed) => setGameplay({ maniaScrollSpeed })}
        />
        <SwitchField
          label="Scale mania speed with BPM"
          value={gameplay.maniaScaleWithBpm}
          onChange={(maniaScaleWithBpm) => setGameplay({ maniaScaleWithBpm })}
        />
        <SwitchField
          label="Remember mania speed per beatmap"
          value={gameplay.maniaSpeedPerBeatmap}
          onChange={(maniaSpeedPerBeatmap) => setGameplay({ maniaSpeedPerBeatmap })}
        />
      </Group>
    </div>
  );
}
