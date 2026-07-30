"use client";

import { signIn, signOut } from "next-auth/react";
import NavLink from "@/components/NavLink/NavLink";
import Link from "next/link";
import { useState, useEffect } from "react";
import {
  Home,
  LogIn,
  LogOut,
  User,
  Settings,
  Search,
  ShieldCheck,
} from "lucide-react";
import { useSearch } from "@/components/Search/SearchProvider";
import { useNavbarSurface } from "@/components/Navbar/NavbarSurface";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

export default function Navbar({
  session,
  isAdmin,
}: {
  session: any;
  isAdmin?: boolean;
}) {
  const { openSearch } = useSearch();
  const { overlay, docked } = useNavbarSurface();
  const [isMac, setIsMac] = useState(false);

  useEffect(() => {
    setIsMac(/Mac|iPhone|iPad/.test(navigator.userAgent));
  }, []);

  const desktopLink =
    "relative py-1 text-foreground/80 transition-colors hover:text-foreground after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:origin-left after:scale-x-0 after:rounded-full after:bg-foreground after:transition-transform after:duration-150 hover:after:scale-x-100";

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-50 hidden h-[4.2em] w-full items-center gap-6 px-24 md:flex",
          // Over artwork the page owns the surface; everywhere else the navbar
          // keeps its own frosted one.
          !overlay && "backdrop-blur-md"
        )}
      >
        {/*
          At rest, continue the page's scrim so the navbar fades into the
          artwork instead of cutting a band across it. Once the page's sticky
          bar docks, this clears out entirely and that bar's own glass extends
          up behind the navbar - one surface for both, so no seam where two
          separate blurs would each sample a different backdrop.
        */}
        {overlay && (
          <div
            aria-hidden
            className={cn(
              "pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-site-users/90 via-site-users/45 to-transparent transition-opacity duration-200 ease-out",
              docked ? "opacity-0" : "opacity-100"
            )}
          />
        )}

        <Link href="/" className="flex items-center">
          <object
            type="image/webp"
            data="/img/logoFull.webp"
            className="pointer-events-none h-[3.1em] brightness-110"
          />
        </Link>

        <nav className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <ul className="flex list-none gap-8 p-0 font-medium">
            <li>
              <NavLink
                href="/"
                className={desktopLink}
                activeClassName="text-accent-blue"
                aria-current="page"
              >
                Home
              </NavLink>
            </li>
          </ul>
        </nav>

        <div className="ml-auto flex items-center gap-4">
          <button
            type="button"
            onClick={openSearch}
            aria-label="Search skins and players"
            className="flex items-center gap-2 rounded-[10px] bg-site-secondary px-3 py-[7px] text-[10.5pt] text-navbar-text transition-colors hover:bg-[#3f4a58]"
          >
            <Search className="size-[18px]" />
            <span className="opacity-85">Search</span>
            <kbd className="rounded-md border border-white/[0.06] bg-site-bg px-1.5 py-[3px] text-[8.5pt] leading-none text-[#92a9c6]">
              {isMac ? "⌘" : "Ctrl"} K
            </kbd>
          </button>
          {session ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 outline-none focus:outline-none focus-visible:outline-none">
                  <span className="font-medium text-foreground">
                    {session.username}
                  </span>
                  <img
                    src={session.avatar_url}
                    alt="user avatar"
                    className="size-[2.6em] rounded-full"
                  />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem asChild>
                  <Link href={`/users/${session.id}`}>
                    <User className="size-4" />
                    Profile
                  </Link>
                </DropdownMenuItem>
                {isAdmin && (
                  <DropdownMenuItem asChild>
                    <Link href="/admin">
                      <ShieldCheck className="size-4" />
                      Admin
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem asChild>
                  <Link href="/settings">
                    <Settings className="size-4" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => signOut()}
                >
                  <LogOut className="size-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <button
              onClick={() => signIn("osu")}
              className="flex h-11 items-center gap-2 rounded-[10px] bg-[#414d5b] px-3.5 py-1.5 text-white transition-colors hover:bg-[#607086b4]"
            >
              <img
                src="https://img.icons8.com/ios/50/000000/osu.png"
                alt="osu! logo"
                className="h-7 w-7 [filter:contrast(0)_brightness(2)]"
              />
              <span>Login</span>
            </button>
          )}
        </div>
      </header>

      <div className="fixed inset-x-0 bottom-2.5 z-[999] flex justify-center md:hidden">
        <nav className="flex h-[4.2em] items-center gap-8 rounded-full bg-[hsla(218,16%,13%,0.7)] px-2.5 text-navbar-text shadow-[rgba(0,0,0,0.1)_0px_10px_15px_-3px,rgba(0,0,0,0.05)_0px_4px_6px_-2px] backdrop-blur-md">
          <NavLink
            href="/"
            className="flex items-center rounded-full p-2.5 transition-colors"
            activeClassName="bg-white/10"
            aria-current="page"
          >
            <Home className="size-6" />
          </NavLink>
          {session ? (
            <>
              <NavLink
                href="/settings"
                className="flex items-center rounded-full p-2.5 transition-colors"
                activeClassName="bg-white/10"
                aria-current="page"
              >
                <Settings className="size-6" />
              </NavLink>
              <Link
                href={`/users/${session.id}`}
                className="flex items-center rounded-full p-2.5"
              >
                <img
                  src={session.avatar_url}
                  alt="user avatar"
                  className="size-6 rounded-full"
                />
              </Link>
            </>
          ) : (
            <button
              type="button"
              onClick={() => signIn("osu")}
              className="flex items-center rounded-full p-2.5"
              aria-label="Login"
            >
              <LogIn className="size-6" />
            </button>
          )}
        </nav>
      </div>
    </>
  );
}
