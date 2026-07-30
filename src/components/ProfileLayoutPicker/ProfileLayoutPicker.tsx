"use client";

import { Check } from "lucide-react";
import { PROFILE_LAYOUTS, type ProfileLayout } from "@/lib/profileLayout";
import { cn } from "@/lib/utils";

type Props = {
  value: ProfileLayout;
  onChange: (layout: ProfileLayout) => void;
  disabled?: boolean;
};

// Line wireframes of the real layouts: outlines and placeholder rules only, so
// they read as a sketch of the page rather than a flat two-tone mock. The
// accent stroke marks what makes each layout what it is - the side panel in
// one, the cover in the other.
const FRAME = "stroke-white/15";
const LINE = "stroke-white/30";
const MUTED = "stroke-white/20";

/** Classic wireframe image marker: a box with a diagonal through it. */
function ImageBox({
  x,
  y,
  width,
  height,
  className = MUTED,
}: {
  x: number;
  y: number;
  width: number;
  height: number;
  className?: string;
}) {
  return (
    <g className={className}>
      <rect x={x} y={y} width={width} height={height} rx="2" />
      <path d={`M${x} ${y + height} L${x + width} ${y}`} />
    </g>
  );
}

function SidePanelPreview() {
  return (
    <svg
      viewBox="0 0 160 100"
      className="h-auto w-full"
      fill="none"
      strokeWidth="1.4"
      strokeLinecap="round"
      role="img"
      aria-label="Wireframe: a panel on the left beside a grid of skins"
    >
      <rect x="0.7" y="0.7" width="158.6" height="98.6" rx="6" className={FRAME} />

      {/* side panel */}
      <g className="stroke-accent-blue">
        <rect x="9" y="9" width="42" height="82" rx="4" />
      </g>
      <g className={LINE}>
        <circle cx="30" cy="27" r="8" />
        <path d="M20 42h20M24 49h12" />
      </g>
      <g className={MUTED}>
        <rect x="15" y="57" width="14" height="9" rx="2" />
        <rect x="31" y="57" width="14" height="9" rx="2" />
        <rect x="15" y="71" width="30" height="12" rx="2" />
      </g>

      {/* toolbar */}
      <g className={LINE}>
        <rect x="58" y="9" width="93" height="14" rx="3" />
        <path d="M64 16h18M133 16h12" />
      </g>

      {/* skin grid */}
      {[0, 1, 2].map((col) =>
        [0, 1].map((row) => {
          const x = 58 + col * 32;
          const y = 29 + row * 32;
          return (
            <g key={`${col}-${row}`}>
              <ImageBox x={x} y={y} width={27} height={17} />
              <path className={LINE} d={`M${x + 3} ${y + 22}h16`} />
              <path className={MUTED} d={`M${x + 3} ${y + 27}h21`} />
            </g>
          );
        })
      )}
    </svg>
  );
}

function BigCoverPreview() {
  return (
    <svg
      viewBox="0 0 160 100"
      className="h-auto w-full"
      fill="none"
      strokeWidth="1.4"
      strokeLinecap="round"
      role="img"
      aria-label="Wireframe: a full width cover with tabs above large skin cards"
    >
      <rect x="0.7" y="0.7" width="158.6" height="98.6" rx="6" className={FRAME} />

      {/* cover */}
      <g className="stroke-accent-blue">
        <path d="M1 7a6 6 0 0 1 6-6h146a6 6 0 0 1 6 6v34H1z" />
        <path d="M1 41 46 1M31 41 76 1M61 41 106 1M91 41 136 1" opacity="0.5" />
      </g>

      {/* identity over the cover */}
      <g className={LINE}>
        <rect x="12" y="21" width="17" height="17" rx="3" />
        <path strokeWidth="4" d="M36 28h48" />
        <path d="M36 37h26" />
      </g>

      {/* tabs */}
      <g className={LINE}>
        <path d="M12 50h16M36 50h16" opacity="0.7" />
      </g>
      <path className="stroke-accent-blue" strokeWidth="2" d="M12 55h16" />
      <path className={FRAME} d="M1 56h158" />

      {/* two large cards */}
      <ImageBox x={12} y={63} width={64} height={28} className={LINE} />
      <ImageBox x={84} y={63} width={64} height={28} className={LINE} />
    </svg>
  );
}

const PREVIEWS: Record<ProfileLayout, () => React.ReactElement> = {
  "side-panel": SidePanelPreview,
  "big-cover": BigCoverPreview,
};

export default function ProfileLayoutPicker({
  value,
  onChange,
  disabled,
}: Props) {
  return (
    <div role="radiogroup" aria-label="Profile layout" className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {PROFILE_LAYOUTS.map((layout) => {
        const Preview = PREVIEWS[layout.value];
        const selected = value === layout.value;

        return (
          <button
            key={layout.value}
            type="button"
            role="radio"
            aria-checked={selected}
            disabled={disabled}
            onClick={() => onChange(layout.value)}
            className={cn(
              "group relative flex cursor-pointer flex-col gap-3 rounded-xl border bg-site-primary p-3 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-60",
              selected
                ? "border-accent-blue"
                : "border-border hover:border-white/20"
            )}
          >
            <span
              className={cn(
                "absolute right-3 top-3 z-[1] flex size-5 items-center justify-center rounded-full bg-accent-blue text-[#0b1220] transition-opacity duration-150",
                selected ? "opacity-100" : "opacity-0"
              )}
              aria-hidden
            >
              <Check className="size-3.5" strokeWidth={3} />
            </span>

            <span
              className={cn(
                "block overflow-hidden rounded-lg bg-site-users transition-opacity duration-150",
                selected ? "opacity-100" : "opacity-60 group-hover:opacity-100"
              )}
            >
              <Preview />
            </span>

            <span className="flex flex-col gap-1">
              <span className="text-sm font-semibold text-foreground">
                {layout.label}
              </span>
              <span className="text-xs leading-relaxed text-muted-foreground">
                {layout.description}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
