"use client";

import NumberFlow from "@number-flow/react";
import { motion, useReducedMotion } from "motion/react";
import { Palette, Users, type LucideIcon } from "lucide-react";

type Props = {
  skins: number;
  users: number;
};

function HomeStats({ skins, users }: Props) {
  const reduce = useReducedMotion();

  const tiles: { key: string; label: string; value: number; Icon: LucideIcon }[] =
    [
      { key: "skins", label: "Skins", value: skins, Icon: Palette },
      { key: "users", label: "Players", value: users, Icon: Users },
    ];

  return (
    <div className="box-border flex w-[92%] flex-wrap justify-center gap-3 md:w-[70%] md:gap-[18px]">
      {tiles.map(({ key, label, value, Icon }, index) => (
        <motion.div
          key={key}
          className="flex max-w-[320px] flex-1 basis-[140px] items-center gap-3 rounded-2xl border border-[hsla(219,40%,60%,0.12)] bg-site-primary p-4 shadow-[0px_1px_15px_0px_#232931] transition-colors hover:border-[hsla(219,40%,60%,0.28)] md:basis-[220px] md:gap-4 md:px-[22px] md:py-[18px]"
          initial={reduce ? false : { opacity: 0, y: 12 }}
          animate={reduce ? undefined : { opacity: 1, y: 0 }}
          whileHover={reduce ? undefined : { y: -2 }}
          transition={{ duration: 0.3, ease: "easeOut", delay: index * 0.06 }}
        >
          <div className="flex size-[46px] shrink-0 items-center justify-center rounded-[0.7em] bg-[hsla(219,40%,60%,0.12)] text-accent-blue">
            <Icon className="size-6" />
          </div>
          <div className="flex min-w-0 flex-col items-start gap-0.5">
            <NumberFlow
              className="text-[18pt] font-bold leading-tight tabular-nums text-[#eee] md:text-[22pt]"
              value={value}
            />
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
