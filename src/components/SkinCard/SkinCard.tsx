"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { Download } from "lucide-react";
import { cn } from "@/lib/utils";

type Skin = {
  id: number | string;
  Banner: string;
  URL: string;
  Modes: string;
  Name: string;
  Player: { id: number | string; username: string };
  Downloads: number | string;
};

const MODE_ACTIVE =
  "[filter:brightness(0)_saturate(100%)_invert(84%)_sepia(5%)_saturate(2279%)_hue-rotate(183deg)_brightness(88%)_contrast(89%)]";
const MODE_IDLE =
  "[filter:brightness(0)_saturate(100%)_invert(33%)_sepia(24%)_saturate(349%)_hue-rotate(172deg)_brightness(98%)_contrast(89%)]";

const MODES: { key: string; src: string; rotate?: boolean }[] = [
  { key: "osu!standard", src: "/img/modes/mode-osu.webp" },
  { key: "osu!mania", src: "/img/modes/mode-mania.webp" },
  { key: "osu!taiko", src: "/img/modes/mode-taiko.webp" },
  { key: "osu!ctb", src: "/img/modes/mode-fruits.webp", rotate: true },
];

function SkinCard({ skin }: { skin: Skin | any }) {
  const reduce = useReducedMotion();

  return (
    <motion.div
      className="h-[180px] w-[275px] select-none overflow-hidden rounded-[0.7em] bg-site-secondary"
      initial={reduce ? false : { opacity: 0, y: 12 }}
      whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      whileHover={reduce ? undefined : { scale: 1.02, y: -2 }}
    >
      <div
        className="relative h-[40%] rounded-t-[0.7em] bg-cover bg-center"
        style={{ backgroundImage: `url(${skin.Banner})` }}
      >
        <div className="h-full w-full rounded-t-[0.7em] bg-black/60" />
      </div>
      <div className="flex h-[60%] w-full flex-col">
        <Link
          href={skin.URL}
          target="_blank"
          className="flex flex-1 items-center justify-center break-words px-2 text-center text-[13pt] font-semibold leading-tight text-accent-blue"
        >
          {skin.Name}
        </Link>
        <div className="flex h-[60px] w-full items-end gap-2 px-2 pb-2">
          <div className="flex w-full items-center gap-1.5 text-[10.5pt] font-medium text-[#92a9c6]">
            <Link href={`/users/${skin.Player.id}`}>
              <img
                src={`https://s.ppy.sh/a/${skin.Player.id}`}
                alt={skin.Player.username}
                className="size-5 rounded-full"
              />
            </Link>
            <Link href={`/users/${skin.Player.id}`}>
              <span>{skin.Player.username}</span>
            </Link>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-0.5">
            <div className="flex items-center gap-0.5 text-[10pt] font-medium tabular-nums text-[#92a9c6]">
              {skin.Downloads}
              <Download className="size-[18px]" />
            </div>
            <div className="flex items-center gap-px">
              {MODES.map(({ key, src, rotate }) => (
                <object
                  key={key}
                  data={src}
                  type="image/webp"
                  className={cn(
                    "pointer-events-none size-5 select-none",
                    skin.Modes.includes(key) ? MODE_ACTIVE : MODE_IDLE,
                    rotate && "-rotate-90"
                  )}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default SkinCard;
