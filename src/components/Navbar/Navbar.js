import { signIn, signOut } from "next-auth/react";
import { useRouter } from "next/router";
import NavLink from "../NavLink/NavLink";
import Link from "next/link";
import { useState, useRef } from "react";
import { useClickOutside } from "react-haiku";
import { Home2, Login, Logout, User, Setting2 } from "iconsax-react";
/* import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBell } from "@fortawesome/free-solid-svg-icons"; */
import { motion } from "framer-motion";
/* import NotificationsContainer from "../NotificationsContainer/NotificationsContainer"; */

export default function Navbar({ session }) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const variants = {
    open: { opacity: 1, y: 0, display: "block" },
    closed: { opacity: 0, y: -10, display: "none" },
  };

  const ref = useRef(null);
  useClickOutside(ref, () => {
    setTimeout(() => {
      if (isDropdownOpen) setIsDropdownOpen(false);
    }, 100);
  });

  return (
    <>
      <header>
        <Link href={"/"}>
          <object
            style={{
              filter: "brightness(1.1)",
            }}
            type="image/webp"
            data="/img/logoFull.webp"
            className="logoNavbar"
          />
        </Link>
        {useRouter().pathname !== "/users/[id]" && (
          <nav className="navbar">
            <ul className="navLinks">
              <li>
                <NavLink
                  activeClassName="active"
                  aria-current="page"
                  href={"/"}
                >
                  <a className="navLinks_link">Home</a>
                </NavLink>
              </li>
              {/* <li>
                <NavLink
                  activeClassName="active"
                  aria-current="page"
                  href={"/skins"}
                >
                  <a className="navLinks_link">Skins</a>
                </NavLink>
              </li>
              <li>
                <NavLink
                  activeClassName="active"
                  aria-current="page"
                  href={"/users"}
                >
                  <a className="navLinks_link">Users</a>
                </NavLink>
              </li> */}
            </ul>
          </nav>
        )}

        <div className="userInfo">
          {session ? (
            <>
              {/* <div className="notificationSection">
                <FontAwesomeIcon icon={faBell} className="notificationIcon" />
                <NotificationsContainer />
              </div> */}
              <div className="userInfoContent">
                <div
                  onClick={() =>
                    setIsDropdownOpen((isDropdownOpen) => !isDropdownOpen)
                  }
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
                    <div
                      className="item"
                      onClick={() => setIsDropdownOpen(false)}
                    >
                      <User size="16" color="#d9e3f0" />
                      Profile
                    </div>
                  </Link>
                  <Link href="/settings">
                    <div
                      className="item"
                      onClick={() => setIsDropdownOpen(false)}
                    >
                      <Setting2 size="16" color="#d9e3f0" />
                      Settings
                    </div>
                  </Link>
                  <div
                    className="item"
                    onClick={() => {
                      signOut(), setIsDropdownOpen(false);
                    }}
                  >
                    <Logout size="16" color="#F47373" />
                    Logout
                  </div>
                </motion.div>
              </div>
            </>
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
                <span
                  style={{
                    margin: "auto",
                    fontFamily: "Poppins",
                  }}
                >
                  Login
                </span>
              </button>
            </div>
          )}
        </div>
      </header>
      <div className="mobileNav">
        <div className="nav">
          <NavLink activeClassName="active" aria-current="page" href={"/"}>
            <div className="item">
              <Home2 color="#D9E3F0" />
            </div>
          </NavLink>
          {/* <NavLink
            activeClassName="active"
            aria-current="page"
            href={"/tournaments"}
          >
            <div className="item">
              <Cup color="#d9e3f0" />
            </div>
          </NavLink>
          <NavLink
            activeClassName="active"
            aria-current="page"
            href={"/documentation"}
          >
            <div className="item">
              <TableDocument color="#d9e3f0" />
            </div>
          </NavLink> */}
          {session ? (
            <>
              <NavLink
                activeClassName="active"
                aria-current="page"
                href={"/settings"}
              >
                <div className="item">
                  <Setting2 color="#d9e3f0" />
                </div>
              </NavLink>
              <Link href={`/users/${session.id}`} passHref>
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
