"use client";

import { Check } from "lucide-react";
import { PROFILE_LAYOUTS, type ProfileLayout } from "@/lib/profileLayout";
import { cn } from "@/lib/utils";

type Props = {
  value: ProfileLayout;
  onChange: (layout: ProfileLayout) => void;
  disabled?: boolean;
};

// Wireframe previews. They mirror the real layouts: Rail keeps a pinned side
// column beside a skin grid, Editorial leads with a full-width cover and tabs.
function RailPreview() {
  return (
    <svg
      viewBox="0 0 160 100"
      className="h-auto w-full"
      role="img"
      aria-label="Side rail beside a grid of skins"
    >
      <rect width="160" height="100" rx="6" className="fill-site-users" />

      {/* rail */}
      <rect x="8" y="8" width="44" height="84" rx="5" className="fill-site-secondary" />
      <circle cx="30" cy="26" r="9" className="fill-accent-blue" opacity="0.9" />
      <rect x="18" y="39" width="24" height="4" rx="2" className="fill-white" opacity="0.5" />
      <rect x="22" y="47" width="16" height="3" rx="1.5" className="fill-white" opacity="0.25" />
      <rect x="14" y="56" width="32" height="10" rx="3" className="fill-white" opacity="0.1" />
      <rect x="14" y="70" width="32" height="10" rx="3" className="fill-white" opacity="0.1" />

      {/* main column */}
      <rect x="58" y="8" width="94" height="20" rx="5" className="fill-site-secondary" />
      <rect x="64" y="15" width="26" height="5" rx="2.5" className="fill-white" opacity="0.35" />
      <rect x="58" y="34" width="94" height="58" rx="5" className="fill-site-secondary" />
      {[0, 1, 2].map((col) =>
        [0, 1].map((row) => (
          <rect
            key={`${col}-${row}`}
            x={64 + col * 29}
            y={40 + row * 24}
            width="24"
            height="19"
            rx="3"
            className="fill-white"
            opacity="0.14"
          />
        ))
      )}
    </svg>
  );
}

function EditorialPreview() {
  return (
    <svg
      viewBox="0 0 160 100"
      className="h-auto w-full"
      role="img"
      aria-label="Full width cover with tabs above large skin cards"
    >
      <rect width="160" height="100" rx="6" className="fill-site-users" />

      {/* cover */}
      <path
        d="M0 6a6 6 0 0 1 6-6h148a6 6 0 0 1 6 6v34H0z"
        className="fill-accent-blue"
        opacity="0.35"
      />
      <rect x="12" y="20" width="18" height="18" rx="4" className="fill-accent-blue" opacity="0.9" />
      <rect x="36" y="23" width="60" height="9" rx="3" className="fill-white" opacity="0.7" />
      <rect x="36" y="35" width="34" height="4" rx="2" className="fill-white" opacity="0.3" />

      {/* tabs */}
      <rect x="12" y="47" width="20" height="4" rx="2" className="fill-white" opacity="0.55" />
      <rect x="38" y="47" width="20" height="4" rx="2" className="fill-white" opacity="0.2" />
      <rect x="12" y="54" width="20" height="2" rx="1" className="fill-accent-blue" />
      <rect x="0" y="55" width="160" height="1" className="fill-white" opacity="0.08" />

      {/* two large cards */}
      <rect x="12" y="63" width="65" height="29" rx="5" className="fill-white" opacity="0.16" />
      <rect x="83" y="63" width="65" height="29" rx="5" className="fill-white" opacity="0.16" />
    </svg>
  );
}

const PREVIEWS = {
  rail: RailPreview,
  editorial: EditorialPreview,
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
                "block overflow-hidden rounded-lg transition-opacity duration-150",
                selected ? "opacity-100" : "opacity-70 group-hover:opacity-100"
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
