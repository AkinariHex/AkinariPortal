"use client";

import { signIn, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import NavLink from "@/components/NavLink/NavLink";
import Link from "next/link";
import { useState, useRef } from "react";
import { useClickOutside } from "react-haiku";
import { Home2, Login, Logout, User, Setting2, Cup } from "iconsax-react";
import { motion } from "motion/react";

export default function Navbar({ session }: { session: any }) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const pathname = usePathname();
  const variants = {
    open: { opacity: 1, y: 0, display: "block" },
    closed: { opacity: 0, y: -10, display: "none" },
  };

  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, () => {
    setTimeout(() => {
      if (isDropdownOpen) setIsDropdownOpen(false);
    }, 100);
  });

  return (
    <>
      <header>
        <Link href="/">
          <object
            style={{ filter: "brightness(1.1)" }}
            type="image/webp"
            data="/img/logoFull.webp"
            className="logoNavbar"
          />
        </Link>
        {!pathname.startsWith("/users/") && (
          <nav className="navbar">
            <ul className="navLinks">
              <li>
                <NavLink
                  href="/"
                  className="navLinks_link"
                  activeClassName="active"
                  aria-current="page"
                >
                  Home
                </NavLink>
              </li>
              <li>
                <NavLink
                  href="/games"
                  className="navLinks_link"
                  activeClassName="active"
                  aria-current="page"
                >
                  Games
                </NavLink>
              </li>
            </ul>
          </nav>
        )}

        <div className="userInfo">
          {session ? (
            <div className="userInfoContent">
              <div
                onClick={() => setIsDropdownOpen((prev) => !prev)}
              >
                <a>
                  <div className="userContent">
                    <span className="userInfo_name">{session.username}</span>
                    <img
                      className="userInfo_image"
                      src={session.avatar_url}
                      alt="user image"
                    />
                  </div>
                </a>
              </div>
              <motion.div
                className="profileActions"
                animate={isDropdownOpen ? "open" : "closed"}
                variants={variants}
                transition={{ duration: 0.2 }}
                ref={ref}
              >
                <Link href={`/users/${session.id}`}>
                  <div className="item" onClick={() => setIsDropdownOpen(false)}>
                    <User size="16" color="#d9e3f0" />
                    Profile
                  </div>
                </Link>
                <Link href="/settings">
                  <div className="item" onClick={() => setIsDropdownOpen(false)}>
                    <Setting2 size="16" color="#d9e3f0" />
                    Settings
                  </div>
                </Link>
                <div
                  className="item"
                  onClick={() => {
                    signOut();
                    setIsDropdownOpen(false);
                  }}
                >
                  <Logout size="16" color="#F47373" />
                  Logout
                </div>
              </motion.div>
            </div>
          ) : (
            <div className="userLogin">
              <button onClick={() => signIn("osu")}>
                <img
                  style={{
                    height: "28px",
                    width: "28px",
                    filter: "contrast(0) brightness(2)",
                  }}
                  src="https://img.icons8.com/ios/50/000000/osu.png"
                  alt="osu! logo"
                />{" "}
                <span style={{ margin: "auto", fontFamily: "Poppins" }}>
                  Login
                </span>
              </button>
            </div>
          )}
        </div>
      </header>
      <div className="mobileNav">
        <div className="nav">
          <NavLink href="/" activeClassName="active" aria-current="page">
            <div className="item">
              <Home2 color="#D9E3F0" />
            </div>
          </NavLink>
          <NavLink href="/games" activeClassName="active" aria-current="page">
            <div className="item">
              <Cup color="#D9E3F0" />
            </div>
          </NavLink>
          {session ? (
            <>
              <NavLink
                href="/settings"
                activeClassName="active"
                aria-current="page"
              >
                <div className="item">
                  <Setting2 color="#d9e3f0" />
                </div>
              </NavLink>
              <Link href={`/users/${session.id}`}>
                <div className="item">
                  <img src={session.avatar_url} alt="user propic" />
                </div>
              </Link>
            </>
          ) : (
            <div className="item" onClick={() => signIn("osu")}>
              <Login color="#d9e3f0" />
            </div>
          )}
        </div>
      </div>
    </>
  );
}
