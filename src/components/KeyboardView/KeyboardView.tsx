"use client";

import { TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";

export type KeyboardDevice = {
  id: string;
  name: string;
  brand?: string | null;
  type?: string | null;
  layout?: { rows: { label: string; w?: number }[][] } | null;
  model_url?: string | null;
};

type Props = {
  device?: KeyboardDevice | null;
  tapKeys?: string[];
  interactive?: boolean;
  onToggleKey?: (label: string) => void;
  className?: string;
};

function isTap(tapKeys: string[], label: string) {
  return tapKeys.some((k) => k.toLowerCase() === label.toLowerCase());
}

function Keycap({
  label,
  active,
  interactive,
  onClick,
  width = 1,
}: {
  label: string;
  active: boolean;
  interactive?: boolean;
  onClick?: () => void;
  width?: number;
}) {
  return (
    <button
      type="button"
      disabled={!interactive}
      onClick={onClick}
      style={{ width: `${width * 2.9}rem` }}
      className={cn(
        "flex h-[2.9rem] items-center justify-center rounded-md border-b-4 text-sm font-semibold transition-colors select-none",
        active
          ? "border-[#3f74b3] bg-accent-blue text-[#0b1220]"
          : "border-black/40 bg-site-primary text-foreground/80",
        interactive && "cursor-pointer hover:brightness-110"
      )}
    >
      {label}
    </button>
  );
}

function WootingKeyBadge({ label }: { label?: string }) {
  return (
    <div
      className={cn(
        "flex size-14 shrink-0 items-center justify-center rounded-xl border text-base font-semibold select-none",
        label
          ? "border-wooting-key-border bg-wooting-key-bg text-wooting-key-text"
          : "border-wooting-key-border bg-wooting-key-bg"
      )}
    >
      {label ? label : <TriangleAlert className="size-6 text-wooting-warn" />}
    </div>
  );
}

// Wootility-style key preview: a gradient pill card (the Wooting brand
// gradient) holding a row of key badges. Unset key slots show a warning
// triangle instead of a label.
function WootingKeyCard({ tapKeys }: { tapKeys: string[] }) {
  const keys = tapKeys.length > 0 ? tapKeys : [undefined];

  return (
    <div
      className="inline-flex rounded-[2.25rem] p-[5px]"
      style={{
        background:
          "conic-gradient(from 180deg, var(--color-wooting-purple), var(--color-wooting-magenta), var(--color-wooting-teal), var(--color-wooting-purple))",
      }}
    >
      <div className="flex items-center justify-center gap-3 rounded-[calc(2.25rem-5px)] bg-wooting-card-bg px-8 py-6">
        {keys.map((k, i) => (
          <WootingKeyBadge key={k ?? `empty-${i}`} label={k} />
        ))}
      </div>
    </div>
  );
}

// Semi-3D keycap view. Renders the device's keypad layout (keys colored when
// tapped), or — for keyboards without a layout — just the tap keys as keycaps.
// If the device has a model_url image, it's shown instead. Wooting devices
// get a Wootility-style gradient key preview card instead of plain keycaps.
export default function KeyboardView({
  device,
  tapKeys = [],
  interactive,
  onToggleKey,
  className,
}: Props) {
  const rows = device?.layout?.rows;
  const isWooting = device?.brand?.trim().toLowerCase() === "wooting";

  if (isWooting && !device?.model_url) {
    return (
      <div className={cn("flex justify-center", className)}>
        <WootingKeyCard tapKeys={tapKeys} />
      </div>
    );
  }

  if (device?.model_url) {
    return (
      <div className={cn("flex flex-col items-center gap-3", className)}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={device.model_url}
          alt={device.name}
          className="max-h-52 w-auto rounded-lg object-contain"
        />
        {tapKeys.length > 0 && (
          <div className="flex gap-2 [perspective:600px]">
            <div className="flex gap-2 [transform:rotateX(16deg)]">
              {tapKeys.map((k) => (
                <Keycap key={k} label={k} active />
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Keypad with an explicit layout.
  if (rows && rows.length > 0) {
    return (
      <div className={cn("flex justify-center [perspective:700px]", className)}>
        <div className="flex flex-col gap-2 [transform:rotateX(18deg)]">
          {rows.map((row, ri) => (
            <div key={ri} className="flex justify-center gap-2">
              {row.map((key, ki) => (
                <Keycap
                  key={`${ri}-${ki}`}
                  label={key.label}
                  width={key.w}
                  active={isTap(tapKeys, key.label)}
                  interactive={interactive}
                  onClick={() => onToggleKey?.(key.label)}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Keyboard without a layout / no device: just show the tap keys.
  if (tapKeys.length > 0) {
    return (
      <div className={cn("flex justify-center [perspective:600px]", className)}>
        <div className="flex gap-2 [transform:rotateX(16deg)]">
          {tapKeys.map((k) => (
            <Keycap key={k} label={k} active />
          ))}
        </div>
      </div>
    );
  }

  return null;
}
