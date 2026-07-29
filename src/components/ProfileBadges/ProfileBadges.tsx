"use client";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

type Props = {
  badges: any[];
  /** Badge height in px. Layouts pick their own scale. */
  size?: number;
  className?: string;
};

export default function ProfileBadges({
  badges,
  size = 38,
  className,
}: Props) {
  if (!badges?.length) return null;

  return (
    <div
      className={cn(
        "flex flex-row flex-wrap items-center gap-1.5",
        className
      )}
    >
      {badges.map((badge: any, index: number) => (
        <Tooltip key={badge.id ?? index}>
          <TooltipTrigger asChild>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/img/badges/${badge.id}.webp`}
              alt={badge.title}
              style={{ height: `${size}px` }}
              className="block w-auto max-w-none shrink-0 rounded-[4px] object-contain shadow-[0_0_0_1px_rgba(0,0,0,0.05)] outline outline-1 outline-white/10 transition-transform duration-150 will-change-transform hover:-translate-y-0.5"
            />
          </TooltipTrigger>
          <TooltipContent>{badge.title}</TooltipContent>
        </Tooltip>
      ))}
    </div>
  );
}
