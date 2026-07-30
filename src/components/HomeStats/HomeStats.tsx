"use client";

import NumberFlow from "@number-flow/react";
import { motion, useReducedMotion } from "motion/react";
import { Palette, Users, Tablet, Keyboard, type LucideIcon } from "lucide-react";

type Props = {
  skins: number;
  users: number;
  tablet: string | null;
  keyboard: string | null;
};

type Tile = {
  key: string;
  label: string;
  Icon: LucideIcon;
  value: number | null;
  text?: string | null;
};

function HomeStats({ skins, users, tablet, keyboard }: Props) {
  const reduce = useReducedMotion();

  const tiles: Tile[] = [
    { key: "skins", label: "Skins", Icon: Palette, value: skins },
    { key: "users", label: "Players", Icon: Users, value: users },
    {
      key: "tablet",
      label: "Most used tablet",
      Icon: Tablet,
      value: null,
      text: tablet,
    },
    {
      key: "keyboard",
      label: "Most used keyboard",
      Icon: Keyboard,
      value: null,
      text: keyboard,
    },
  ];

  return (
    <div className="box-border grid w-[92%] grid-cols-1 gap-3 sm:grid-cols-2 md:w-[70%] md:grid-cols-4 md:gap-[18px]">
      {tiles.map(({ key, label, Icon, value, text }, index) => (
        <motion.div
          key={key}
          className="flex items-center gap-3 rounded-2xl border border-[hsla(219,40%,60%,0.12)] bg-site-primary p-4 shadow-[0px_1px_15px_0px_#232931] md:gap-4 md:px-[22px] md:py-[18px]"
          initial={reduce ? false : { opacity: 0, y: 12 }}
          animate={reduce ? undefined : { opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: "easeOut", delay: index * 0.06 }}
        >
          <div className="flex size-[46px] shrink-0 items-center justify-center rounded-[0.7em] bg-[hsla(219,40%,60%,0.12)] text-accent-blue">
            <Icon className="size-6" />
          </div>
          <div className="flex min-w-0 flex-col items-start gap-0.5">
            {value !== null ? (
              <NumberFlow
                className="-mb-1 text-[18pt] font-bold leading-none tabular-nums text-[#eee] md:text-[22pt]"
                value={value}
              />
            ) : (
              <span
                className="line-clamp-2 max-w-full text-[14pt] font-bold leading-tight text-[#eee] md:text-[15pt]"
                title={text ?? undefined}
              >
                {text && text.trim() ? text : "—"}
              </span>
            )}
            <span className="text-[10.5pt] font-medium uppercase tracking-[0.06em] text-[#92a9c6]">
              {label}
            </span>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

export default HomeStats;
