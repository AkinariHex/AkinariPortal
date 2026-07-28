"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";

type User = {
  id: number | string;
  username: string;
  banner: string;
};

function RecentUsers({ rUsers }: { rUsers: User[] }) {
  const reduce = useReducedMotion();

  return (
    <div className="homepageContainer" id="recentUsers">
      <div className="title">Recent Users</div>
      <div className="items">
        {rUsers.map((user, index) => (
          <motion.div
            key={user.id ?? index}
            initial={reduce ? false : { opacity: 0, y: 12 }}
            whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            whileHover={reduce ? undefined : { scale: 1.02, y: -2 }}
          >
            <Link href={`/users/${user.id}`} className="item users">
              <div
                className="header"
                style={{ backgroundImage: `url(${user.banner})` }}
              >
                <div className="dimForBG"></div>
                <img
                  src={`https://s.ppy.sh/a/${user.id}`}
                  alt={user.username}
                />
              </div>
              <div className="content">
                <div className="name">{user.username}</div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

export default RecentUsers;
