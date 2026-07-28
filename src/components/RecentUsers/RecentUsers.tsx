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
    <section
      id="recentUsers"
      className="flex w-[92%] flex-col items-center justify-center gap-5 rounded-2xl bg-site-primary px-6 pb-6 pt-[18px] shadow-[0px_1px_15px_0px_#232931] md:w-[70%]"
    >
      <h2 className="select-none text-center text-[22pt] font-semibold text-[#eee] md:text-[26pt]">
        Recent Users
      </h2>
      <div className="flex w-full flex-row flex-wrap justify-center gap-4">
        {rUsers.map((user, index) => (
          <motion.div
            key={user.id ?? index}
            initial={reduce ? false : { opacity: 0, y: 12 }}
            whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            whileHover={reduce ? undefined : { scale: 1.02, y: -2 }}
          >
            <Link
              href={`/users/${user.id}`}
              className="block h-[150px] w-[200px] cursor-pointer select-none overflow-hidden rounded-[0.7em] bg-site-secondary"
            >
              <div
                className="relative h-[40%] rounded-t-[0.7em] bg-cover bg-center"
                style={{ backgroundImage: `url(${user.banner})` }}
              >
                <div className="h-full w-full rounded-t-[0.7em] bg-black/60" />
                <img
                  src={`https://s.ppy.sh/a/${user.id}`}
                  alt={user.username}
                  className="absolute left-1/2 top-full size-[60px] -translate-x-1/2 -translate-y-1/2 rounded-full shadow-[0px_2px_15px_1px_#1c2025b6]"
                />
              </div>
              <div className="flex h-[60%] w-full flex-col items-center justify-center">
                <div className="break-words px-2 text-center text-[13pt] font-semibold text-accent-blue">
                  {user.username}
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

export default RecentUsers;
