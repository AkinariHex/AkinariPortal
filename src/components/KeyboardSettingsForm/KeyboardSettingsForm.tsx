"use client";

import { useRef } from "react";
import { Gauge, Info, Keyboard, RotateCcw, Upload } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import SwitchModelCombobox from "@/components/SwitchModelCombobox/SwitchModelCombobox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  isAnalog,
  parseWootilityProfile,
  SWITCH_FEELS,
  SWITCH_TECHS,
  type KeyboardSettings,
  type KeyboardViewVariant,
  type SwitchFeel,
  type SwitchTech,
} from "@/lib/keyboardSettings";

const TECH_LABELS: Record<SwitchTech, string> = {
  mechanical: "Mechanical",
  optical: "Optical",
  magnetic: "Magnetic (hall effect)",
};

const VIEWS: {
  id: KeyboardViewVariant;
  name: string;
  hint: string;
}[] = [
  {
    id: "instrumented",
    name: "Instrumented",
    hint: "Muted board plus the actuation of every tap key.",
  },
  {
    id: "plate",
    name: "Plate",
    hint: "Physical render with case, plate and lit keycaps.",
  },
];

const POLLING_RATES = [125, 500, 1000, 8000];

type Props = {
  view: KeyboardViewVariant;
  onViewChange: (view: KeyboardViewVariant) => void;
  settings: KeyboardSettings;
  onSettingsChange: (settings: KeyboardSettings) => void;
  tapKeys: string[];
  className?: string;
};

export default function KeyboardSettingsForm({
  view,
  onViewChange,
  settings,
  onSettingsChange,
  tapKeys,
  className,
}: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const analog = isAnalog(settings.switch_tech);

  const patch = (next: Partial<KeyboardSettings>) =>
    onSettingsChange({ ...settings, ...next });

  const overrideKeyOf = (map: Record<string, unknown>, label: string) =>
    Object.keys(map).find((k) => k.toLowerCase() === label.toLowerCase());

  const setKeyActuation = (key: string, mm: number | null) => {
    const next = { ...settings.key_actuation };
    const existing = overrideKeyOf(next, key) ?? key;
    if (mm === null) delete next[existing];
    else next[existing] = mm;
    patch({ key_actuation: next });
  };

  const setKeySwitch = (key: string, model: string) => {
    const next = { ...settings.key_switch };
    const existing = overrideKeyOf(next, key) ?? key;
    if (!model.trim()) delete next[existing];
    else next[existing] = model.trim();
    patch({ key_switch: next });
  };

  const clearKeyOverrides = (key: string) => {
    const actuation = { ...settings.key_actuation };
    const switches = { ...settings.key_switch };
    const a = overrideKeyOf(actuation, key);
    const s = overrideKeyOf(switches, key);
    if (a) delete actuation[a];
    if (s) delete switches[s];
    patch({ key_actuation: actuation, key_switch: switches });
  };

  // Blank entries are unset slots on a positional keypad, not keys.
  const boundKeys = tapKeys.map((k) => k.trim()).filter(Boolean);

  const importProfile = async (file: File) => {
    try {
      const profile = parseWootilityProfile(JSON.parse(await file.text()));
      if (!profile) {
        toast.error("That file does not look like a Wootility profile.");
        return;
      }

      const keyActuation = { ...settings.key_actuation };
      for (const [key, mm] of Object.entries(profile.key_actuation)) {
        keyActuation[key] = mm;
      }

      patch({
        switch_tech: "magnetic",
        actuation_mm: profile.actuation_mm ?? settings.actuation_mm,
        rapid_trigger: profile.rapid_trigger ?? settings.rapid_trigger,
        rapid_trigger_mm: profile.rapid_trigger_mm ?? settings.rapid_trigger_mm,
        key_actuation: keyActuation,
      });

      const imported = Object.keys(profile.key_actuation).length;
      toast.success(
        `Imported ${profile.name ?? file.name}${
          imported > 0 ? ` (${imported} per-key values)` : ""
        }`
      );
    } catch {
      toast.error("Could not read that file. Export the profile as JSON.");
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)}>
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Keyboard className="size-4 text-accent-blue" />
          Profile view
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {VIEWS.map((v) => (
            <button
              key={v.id}
              type="button"
              onClick={() => onViewChange(v.id)}
              aria-pressed={view === v.id}
              className={cn(
                "cursor-pointer rounded-lg border p-4 text-left transition-colors duration-150 ease-out",
                view === v.id
                  ? "border-accent-blue bg-accent-blue/10"
                  : "border-border bg-site-primary hover:border-white/20"
              )}
            >
              <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
                {v.name}
                {v.id === "instrumented" && (
                  <span className="rounded-full bg-white/8 px-2 py-0.5 text-[0.65rem] font-normal text-muted-foreground">
                    default
                  </span>
                )}
              </span>
              <span className="mt-1 block text-sm text-muted-foreground">
                {v.hint}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-4 border-t border-border pt-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Gauge className="size-4 text-accent-blue" />
            Switch settings
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileRef.current?.click()}
          >
            <Upload />
            Import Wootility profile
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) importProfile(file);
              e.target.value = "";
            }}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex min-w-0 flex-col gap-2">
            <Label>Switch type</Label>
            <Select
              value={settings.switch_tech}
              onValueChange={(v) => patch({ switch_tech: v as SwitchTech })}
            >
              <SelectTrigger className="w-full min-w-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SWITCH_TECHS.map((t) => (
                  <SelectItem key={t} value={t}>
                    {TECH_LABELS[t]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex min-w-0 flex-col gap-2">
            <Label>Feel</Label>
            <Select
              value={settings.feel}
              onValueChange={(v) => patch({ feel: v as SwitchFeel })}
            >
              <SelectTrigger className="w-full min-w-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SWITCH_FEELS.map((f) => (
                  <SelectItem key={f} value={f} className="capitalize">
                    {f}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex min-w-0 flex-col gap-2">
            <Label>Switch model</Label>
            <SwitchModelCombobox
              value={settings.switch_model}
              tech={settings.switch_tech}
              onChange={(model) => patch({ switch_model: model })}
            />
          </div>

          <div className="flex min-w-0 flex-col gap-2">
            <Label>Polling rate</Label>
            <Select
              value={String(settings.polling_hz)}
              onValueChange={(v) => patch({ polling_hz: Number(v) })}
            >
              <SelectTrigger className="w-full min-w-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {POLLING_RATES.map((p) => (
                  <SelectItem key={p} value={String(p)}>
                    {p} Hz
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {analog ? (
          <div className="grid gap-5 rounded-lg border border-border bg-site-primary p-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <div className="flex items-baseline justify-between">
                <Label>Actuation point</Label>
                <span className="text-sm text-accent-blue tabular-nums">
                  {settings.actuation_mm.toFixed(2)} mm
                </span>
              </div>
              <Slider
                min={0.1}
                max={settings.travel_mm}
                step={0.05}
                value={[settings.actuation_mm]}
                onValueChange={([v]) => patch({ actuation_mm: v })}
              />
              <div className="flex items-center gap-2">
                <Label htmlFor="travel" className="text-muted-foreground">
                  Total travel
                </Label>
                <Input
                  id="travel"
                  type="number"
                  min={0.5}
                  max={10}
                  step={0.1}
                  value={settings.travel_mm}
                  onChange={(e) =>
                    patch({ travel_mm: Number(e.target.value) || 4 })
                  }
                  className="h-8 w-20 tabular-nums"
                />
                <span className="text-sm text-muted-foreground">mm</span>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="rapid-trigger">Rapid trigger</Label>
                <Switch
                  id="rapid-trigger"
                  checked={settings.rapid_trigger}
                  onCheckedChange={(v) => patch({ rapid_trigger: v })}
                />
              </div>
              <div className="flex items-baseline justify-between">
                <Label
                  className={cn(!settings.rapid_trigger && "opacity-50")}
                >
                  Sensitivity
                </Label>
                <span
                  className={cn(
                    "text-sm text-accent-blue tabular-nums",
                    !settings.rapid_trigger && "opacity-50"
                  )}
                >
                  {settings.rapid_trigger_mm.toFixed(2)} mm
                </span>
              </div>
              <Slider
                min={0.05}
                max={1}
                step={0.05}
                disabled={!settings.rapid_trigger}
                value={[settings.rapid_trigger_mm]}
                onValueChange={([v]) => patch({ rapid_trigger_mm: v })}
              />
            </div>
          </div>
        ) : (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Info className="size-4" />
            Actuation point and rapid trigger only exist on magnetic (hall
            effect) switches.
          </p>
        )}
      </div>

      {boundKeys.length > 0 && (
        <div className="flex flex-col gap-3 border-t border-border pt-5">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <span className="text-sm font-semibold text-foreground">
              Per-key overrides
            </span>
            <span className="text-sm text-muted-foreground">
              For boards built with a different switch under the keys you tap
              with.
            </span>
          </div>

          {boundKeys.map((k) => {
            const actuationOverride = overrideKeyOf(settings.key_actuation, k);
            const switchOverride = overrideKeyOf(settings.key_switch, k);
            const mm = actuationOverride
              ? settings.key_actuation[actuationOverride]
              : settings.actuation_mm;
            const model = switchOverride
              ? settings.key_switch[switchOverride]
              : "";

            return (
              <div
                key={k}
                className="flex flex-col gap-3 rounded-lg border border-border bg-site-primary px-4 py-3 sm:flex-row sm:items-center"
              >
                <span className="w-16 shrink-0 text-sm font-semibold text-foreground">
                  {k}
                </span>

                <div className="min-w-0 flex-1 sm:max-w-[16rem]">
                  <SwitchModelCombobox
                    value={model}
                    tech={settings.switch_tech}
                    size="sm"
                    placeholder={
                      settings.switch_model
                        ? `Same as board (${settings.switch_model})`
                        : "Same as board"
                    }
                    onChange={(next) => setKeySwitch(k, next)}
                  />
                </div>

                {analog && (
                  <>
                    <Slider
                      min={0.1}
                      max={settings.travel_mm}
                      step={0.05}
                      value={[mm]}
                      onValueChange={([v]) => setKeyActuation(k, v)}
                      className="min-w-24 flex-1"
                    />
                    <span
                      className={cn(
                        "w-16 shrink-0 text-right text-sm tabular-nums",
                        actuationOverride
                          ? "text-accent-blue"
                          : "text-muted-foreground"
                      )}
                    >
                      {mm.toFixed(2)} mm
                    </span>
                  </>
                )}

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="self-end sm:self-auto"
                  disabled={!actuationOverride && !switchOverride}
                  aria-label={`Reset the overrides on ${k}`}
                  onClick={() => clearKeyOverrides(k)}
                >
                  <RotateCcw />
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
