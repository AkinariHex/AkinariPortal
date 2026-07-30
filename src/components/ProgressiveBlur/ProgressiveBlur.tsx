import { cn } from "@/lib/utils";

type Props = {
  /** Blur radii in px, sharpest first. Each layer is masked to a lower band. */
  layers?: number[];
  className?: string;
};

const DEFAULT_LAYERS = [1, 2, 4, 8];

/**
 * Progressive blur: a stack of backdrop-filter layers, each masked to a band
 * further down, so whatever sits behind fades from sharp at the top to fully
 * blurred at the bottom instead of switching in one hard step.
 *
 * Purely decorative - it never receives pointer events and paints below the
 * content it sits under.
 */
export default function ProgressiveBlur({
  layers = DEFAULT_LAYERS,
  className,
}: Props) {
  const step = 100 / layers.length;

  return (
    <div aria-hidden className={cn("pointer-events-none absolute inset-0", className)}>
      {layers.map((blur, i) => {
        // Each layer starts transparent, reaches full opacity one band lower,
        // and stays opaque to the bottom, so radii accumulate downward.
        const start = i * step;
        const full = Math.min(100, start + step * 1.4);
        const mask = `linear-gradient(to bottom, transparent ${start}%, black ${full}%, black 100%)`;

        return (
          <div
            key={blur}
            className="absolute inset-0"
            style={{
              backdropFilter: `blur(${blur}px)`,
              WebkitBackdropFilter: `blur(${blur}px)`,
              maskImage: mask,
              WebkitMaskImage: mask,
            }}
          />
        );
      })}
    </div>
  );
}
