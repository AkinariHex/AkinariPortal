"use client";

import { useMemo } from "react";
import { Gauge, Plus, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  namedLabelsOf,
  slotCountOf,
  slotValues,
} from "@/lib/keyboardSlots";
import {
  actuationFor,
  DEFAULT_KEYBOARD_SETTINGS,
  DEFAULT_KEYBOARD_VIEW,
  hasSwitchOverride,
  isAnalog,
  switchModelFor,
  type KeyboardSettings,
  type KeyboardViewVariant,
} from "@/lib/keyboardSettings";

export type KeyboardDevice = {
  id: string;
  name: string;
  brand?: string | null;
  type?: string | null;
  layout?: { rows: { label: string; w?: number }[][] } | null;
  model_url?: string | null;
};

// A key from the device layout, resolved against the user's tap keys. Layout
// keys with a blank label are positional slots (keypads whose caps carry no
// legend): they take their letter from the tap keys, in order.
type ResolvedKey = {
  label: string | null; // null = an empty slot
  slot: number | null; // null = the layout names this key
  active: boolean;
  w?: number;
};

export type KeyboardKeyClick = { label: string | null; slot: number | null };

type Props = {
  device?: KeyboardDevice | null;
  tapKeys?: string[];
  interactive?: boolean;
  onKeyClick?: (key: KeyboardKeyClick) => void;
  variant?: KeyboardViewVariant;
  settings?: KeyboardSettings;
  className?: string;
};

function keyStyle(w = 1) {
  return {
    width: `calc(${w} * var(--u) - var(--kgap))`,
    height: "calc(var(--u) - var(--kgap))",
  };
}

function resolve(
  rows: { label: string; w?: number }[][],
  tapKeys: string[]
): { rows: ResolvedKey[][]; slots: (string | null)[] } {
  const device = { layout: { rows } };
  const named = namedLabelsOf(device);
  const values = slotValues(tapKeys, named, slotCountOf(device));

  let slot = 0;
  const resolvedRows = rows.map((row) =>
    row.map<ResolvedKey>((key) => {
      const label = key.label.trim();
      if (label) {
        return {
          label,
          slot: null,
          active: tapKeys.some(
            (k) => k.trim().toLowerCase() === label.toLowerCase()
          ),
          w: key.w,
        };
      }
      const index = slot++;
      const bound = values[index] || null;
      return { label: bound, slot: index, active: Boolean(bound), w: key.w };
    })
  );

  return { rows: resolvedRows, slots: values.map((v) => v || null) };
}

function Board({
  rows,
  interactive,
  onKeyClick,
  renderKey,
}: {
  rows: ResolvedKey[][];
  interactive?: boolean;
  onKeyClick?: (key: KeyboardKeyClick) => void;
  renderKey: (key: ResolvedKey) => {
    style?: React.CSSProperties;
    className?: string;
    content: React.ReactNode;
  };
}) {
  return (
    <div className="flex flex-col gap-[var(--kgap)]">
      {rows.map((row, ri) => (
        <div key={ri} className="flex justify-center gap-[var(--kgap)]">
          {row.map((key, ki) => {
            const rendered = renderKey(key);
            return (
              <button
                key={`${ri}-${ki}`}
                type="button"
                disabled={!interactive}
                aria-pressed={key.active}
                aria-label={key.label ?? "Empty key"}
                onClick={() => onKeyClick?.({ label: key.label, slot: key.slot })}
                style={rendered.style}
                className={cn(rendered.className, interactive && "cursor-pointer")}
              >
                {rendered.content}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}

// Physical render: case, plate, keycaps with a skirt. The tapped keys are lit.
function PlateView({
  rows,
  interactive,
  onKeyClick,
  deviceName,
}: {
  rows: ResolvedKey[][];
  interactive?: boolean;
  onKeyClick?: (key: KeyboardKeyClick) => void;
  deviceName?: string;
}) {
  return (
    <div
      className="w-fit rounded-2xl p-[0.9rem]"
      style={{
        ["--u" as string]: "clamp(1.45rem, 3.6vw, 2.7rem)",
        ["--kgap" as string]: "0.28rem",
        background:
          "linear-gradient(180deg, #454f5c 0%, #2c333d 22%, #232931 100%)",
        boxShadow:
          "0 18px 40px -12px rgba(0,0,0,0.65), inset 0 1px 0 rgba(255,255,255,0.10), inset 0 -2px 0 rgba(0,0,0,0.45)",
      }}
    >
      <div className="rounded-xl bg-[#15181d] p-[0.55rem] shadow-[inset_0_2px_8px_rgba(0,0,0,0.7)]">
        <Board
          rows={rows}
          interactive={interactive}
          onKeyClick={onKeyClick}
          renderKey={(key) => ({
            style: {
              ...keyStyle(key.w),
              background: key.active
                ? "linear-gradient(180deg, #8fbcf5 0%, #6ba2ed 55%, #4d84d1 100%)"
                : "linear-gradient(180deg, #3d4652 0%, #333b46 55%, #272e37 100%)",
              boxShadow: key.active
                ? "inset 0 1px 0 rgba(255,255,255,0.45), 0 2px 0 #2f5a8a, 0 0 18px rgba(107,162,237,0.45)"
                : "inset 0 1px 0 rgba(255,255,255,0.07), 0 2px 0 rgba(0,0,0,0.55)",
              fontSize: "clamp(0.42rem, 1vw, 0.72rem)",
            },
            className: cn(
              "flex items-center justify-center rounded-[0.35rem] px-1 text-center leading-none font-semibold select-none",
              "transition-[filter,transform] duration-150 ease-out",
              interactive && "hover:brightness-115 active:translate-y-[1px]",
              key.active ? "text-[#0b1220]" : "text-foreground/75"
            ),
            content: key.label ?? (
              <span className="text-foreground/25">
                {interactive ? <Plus className="size-3" /> : ""}
              </span>
            ),
          })}
        />
      </div>
      {deviceName && (
        <div className="mt-[0.55rem] flex justify-center">
          <span className="text-[0.5rem] tracking-[0.35em] text-white/20 uppercase">
            {deviceName}
          </span>
        </div>
      )}
    </div>
  );
}

// Config render: the board is muted plumbing, the switch setup is the subject.
// Each bound key is filled from the top down to its actuation point.
function InstrumentedView({
  rows,
  entries,
  interactive,
  onKeyClick,
  settings,
}: {
  rows: ResolvedKey[][];
  entries: { label: string | null; slot: number | null }[];
  interactive?: boolean;
  onKeyClick?: (key: KeyboardKeyClick) => void;
  settings: KeyboardSettings;
}) {
  const analog = isAnalog(settings.switch_tech);

  return (
    <div className="flex w-full flex-col items-center gap-5 lg:flex-row lg:items-start lg:justify-center">
      <div
        className="w-fit rounded-xl border border-white/6 bg-site-secondary p-[0.7rem]"
        style={{
          ["--u" as string]: "clamp(1.35rem, 3.3vw, 2.5rem)",
          ["--kgap" as string]: "0.24rem",
        }}
      >
        <Board
          rows={rows}
          interactive={interactive}
          onKeyClick={onKeyClick}
          renderKey={(key) => {
            const mm = key.label ? actuationFor(settings, key.label) : 0;
            const fill = Math.min(100, (mm / settings.travel_mm) * 100);
            return {
              style: {
                ...keyStyle(key.w),
                fontSize: "clamp(0.38rem, 0.95vw, 0.66rem)",
              },
              className: cn(
                "relative flex items-center justify-center overflow-hidden rounded-[0.28rem] px-1 leading-none select-none",
                "transition-colors duration-150 ease-out",
                key.active
                  ? "bg-[#1b2430] text-accent-blue ring-1 ring-accent-blue/70"
                  : cn(
                      "bg-[#2a313b] text-foreground/35",
                      key.slot !== null && "border border-dashed border-white/10",
                      interactive && "hover:text-foreground/60"
                    )
              ),
              content: (
                <>
                  {key.active && analog && (
                    <span
                      aria-hidden
                      className="absolute inset-x-0 bottom-0 bg-accent-blue/35"
                      style={{ height: `${100 - fill}%` }}
                    />
                  )}
                  <span className="relative font-semibold">
                    {key.label ??
                      (interactive ? <Plus className="size-3" /> : "")}
                  </span>
                </>
              ),
            };
          }}
        />
      </div>

      <div className="flex w-full max-w-[17rem] flex-col gap-2">
        <div className="flex items-center gap-2 text-xs tracking-wide text-foreground/45 uppercase">
          <Gauge className="size-3.5" />
          {analog ? "Per-key actuation" : "Switches"}
        </div>

        {entries.length === 0 && (
          <p className="text-sm text-foreground/45">No tap keys set.</p>
        )}

        {entries.map((entry, i) => {
          if (!entry.label) {
            return (
              <div
                key={`unset-${i}`}
                className="rounded-lg border border-dashed border-white/10 px-3 py-2.5"
              >
                <span className="text-sm font-semibold text-foreground/35">
                  Unset
                </span>
              </div>
            );
          }

          const mm = actuationFor(settings, entry.label);
          return (
            <div
              key={`${entry.label}-${i}`}
              className="rounded-lg border border-white/6 bg-site-secondary px-3 py-2.5"
            >
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-sm font-semibold text-foreground">
                  {entry.label}
                </span>
                {analog && (
                  <span className="text-sm text-accent-blue tabular-nums">
                    {mm.toFixed(2)} mm
                  </span>
                )}
              </div>
              {analog && (
                <div className="mt-2 h-1.5 w-full rounded-full bg-black/40">
                  <div
                    className="h-full rounded-full bg-accent-blue"
                    style={{
                      width: `${Math.min(100, (mm / settings.travel_mm) * 100)}%`,
                    }}
                  />
                </div>
              )}
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[0.7rem] text-foreground/45">
                {analog && settings.rapid_trigger && (
                  <>
                    <Zap className="size-3" />
                    Rapid trigger {settings.rapid_trigger_mm.toFixed(2)} mm
                    <span className="text-foreground/25">/</span>
                  </>
                )}
                <span className="capitalize">{settings.feel}</span>
                {switchModelFor(settings, entry.label) && (
                  <>
                    <span className="text-foreground/25">/</span>
                    <span
                      className={cn(
                        hasSwitchOverride(settings, entry.label) &&
                          "text-accent-blue/80"
                      )}
                    >
                      {switchModelFor(settings, entry.label)}
                    </span>
                  </>
                )}
              </div>
            </div>
          );
        })}

        <p className="text-[0.7rem] text-foreground/35 tabular-nums">
          {settings.polling_hz} Hz polling
        </p>
      </div>
    </div>
  );
}

// Renders the device's layout with the tapped keys highlighted, in the style
// the user picked (Instrumented by default). Devices without a layout fall back
// to a single row built from the tap keys.
export default function KeyboardView({
  device,
  tapKeys = [],
  interactive,
  onKeyClick,
  variant = DEFAULT_KEYBOARD_VIEW,
  settings = DEFAULT_KEYBOARD_SETTINGS,
  className,
}: Props) {
  const { rows, entries } = useMemo(() => {
    const layoutRows = device?.layout?.rows;
    const source =
      layoutRows && layoutRows.length > 0
        ? layoutRows
        : tapKeys.length > 0
          ? [tapKeys.map((label) => ({ label }))]
          : [];

    if (source.length === 0) return { rows: [], entries: [] };

    const resolved = resolve(source, tapKeys);
    const hasSlots = resolved.slots.length > 0;

    // Positional keypads list their slots (so an unset one still shows);
    // named layouts list the keys the user actually tapped.
    const entries: { label: string | null; slot: number | null }[] = hasSlots
      ? resolved.slots.map((label, slot) => ({ label, slot }))
      : resolved.rows
          .flat()
          .filter((k) => k.active)
          .map((k) => ({ label: k.label, slot: null }));

    return { rows: resolved.rows, entries };
  }, [device, tapKeys]);

  if (rows.length === 0) return null;

  return (
    <div className={cn("flex w-full flex-col items-center gap-3", className)}>
      {device?.model_url && (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={device.model_url}
          alt={device.name}
          className="max-h-40 w-auto rounded-lg object-contain"
        />
      )}
      {variant === "plate" ? (
        <PlateView
          rows={rows}
          interactive={interactive}
          onKeyClick={onKeyClick}
          deviceName={device?.name}
        />
      ) : (
        <InstrumentedView
          rows={rows}
          entries={entries}
          interactive={interactive}
          onKeyClick={onKeyClick}
          settings={settings}
        />
      )}
    </div>
  );
}
