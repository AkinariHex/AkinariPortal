"use client";

import NumberFlow from "@number-flow/react";
import { motion, useReducedMotion } from "motion/react";

type Props = {
  skins: number;
  users: number;
};

function HomeStats({ skins, users }: Props) {
  const reduce = useReducedMotion();

  const tiles = [
    { key: "skins", label: "Skins", value: skins, icon: "bx bxs-palette" },
    { key: "users", label: "Players", value: users, icon: "bx bxs-group" },
  ];

  return (
    <div className="homeStats">
      {tiles.map(({ key, label, value, icon }, index) => (
        <motion.div
          key={key}
          className="homeStat"
          initial={reduce ? false : { opacity: 0, y: 12 }}
          animate={reduce ? undefined : { opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: "easeOut", delay: index * 0.06 }}
        >
          <div className="homeStatIcon">
            <i className={icon}></i>
          </div>
          <div className="homeStatBody">
            <NumberFlow className="homeStatValue" value={value} />
            <span className="homeStatLabel">{label}</span>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

export default HomeStats;
