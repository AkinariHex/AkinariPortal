"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";

type Skin = {
  id: number | string;
  Banner: string;
  URL: string;
  Modes: string;
  Name: string;
  Player: { id: number | string; username: string };
  Downloads: number | string;
};

function SkinCard({ skin }: { skin: Skin | any }) {
  const reduce = useReducedMotion();

  return (
    <motion.div
      className="item skins"
      initial={reduce ? false : { opacity: 0, y: 12 }}
      whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      whileHover={reduce ? undefined : { scale: 1.02, y: -2 }}
    >
      <div
        className="header"
        style={{ backgroundImage: `url(${skin.Banner})` }}
      >
        <div className="dimForBG"></div>
      </div>
      <div className="content">
        <Link href={skin.URL} target="_blank" className="name">
          {skin.Name}
        </Link>
        <div className="info">
          <div className="owner">
            <Link href={`/users/${skin.Player.id}`}>
              <img
                src={`https://s.ppy.sh/a/${skin.Player.id}`}
                alt={skin.Player.username}
              />
            </Link>{" "}
            <Link href={`/users/${skin.Player.id}`}>
              <span>{skin.Player.username}</span>
            </Link>
          </div>
          <div className="rightSide">
            <div className="downloads">
              {skin.Downloads}
              <i className="bx bxs-download"></i>
            </div>
            <div className="gamemodes">
              <object
                className={`modeImg ${
                  skin.Modes.includes("osu!standard") ? "active" : ""
                }`}
                data="/img/modes/mode-osu.webp"
                type="image/webp"
              />
              <object
                className={`modeImg ${
                  skin.Modes.includes("osu!mania") ? "active" : ""
                }`}
                data="/img/modes/mode-mania.webp"
                type="image/webp"
              />
              <object
                className={`modeImg ${
                  skin.Modes.includes("osu!taiko") ? "active" : ""
                }`}
                data="/img/modes/mode-taiko.webp"
                type="image/webp"
              />
              <object
                className={`modeImg ${
                  skin.Modes.includes("osu!ctb") ? "active" : ""
                }`}
                data="/img/modes/mode-fruits.webp"
                type="image/webp"
                style={{ rotate: "-90deg" }}
              />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default SkinCard;
