"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

/** Height of the sticky desktop navbar, in root em (see Navbar's `h-[4.2em]`). */
const NAVBAR_EM = 4.2;

type NavbarSurface = {
  /** The page draws its own artwork under the navbar (a cover, a banner). */
  overlay: boolean;
  /** The page's own sticky bar has reached the navbar and sits right below it. */
  docked: boolean;
  setOverlay: (value: boolean) => void;
  setDocked: (value: boolean) => void;
};

const NOOP: NavbarSurface = {
  overlay: false,
  docked: false,
  setOverlay: () => {},
  setDocked: () => {},
};

const NavbarSurfaceContext = createContext<NavbarSurface | null>(null);

export function NavbarSurfaceProvider({ children }: { children: ReactNode }) {
  const [overlay, setOverlay] = useState(false);
  const [docked, setDocked] = useState(false);

  const value = useMemo(
    () => ({ overlay, docked, setOverlay, setDocked }),
    [overlay, docked]
  );

  return (
    <NavbarSurfaceContext.Provider value={value}>
      {children}
    </NavbarSurfaceContext.Provider>
  );
}

/** Read the current surface. Falls back to the plain navbar with no provider. */
export function useNavbarSurface(): NavbarSurface {
  return useContext(NavbarSurfaceContext) ?? NOOP;
}

/**
 * Opt a page into the overlay navbar: it fades into the artwork behind it while
 * the page is at rest, then takes the same glass surface as the page's own
 * sticky bar once the two meet, so they read as one band.
 *
 * Returns a ref for a sentinel element to render immediately before that sticky
 * bar. Docking is detected with an IntersectionObserver against the viewport
 * rather than scroll offsets, because `html`/`body` are `position: fixed` with
 * their own overflow (see globals.css) - so the page scroll never reaches
 * `window` and a scroll listener would never fire.
 */
export function useNavbarOverlay() {
  const { setOverlay, setDocked } = useNavbarSurface();
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setOverlay(true);
    return () => {
      setOverlay(false);
      setDocked(false);
    };
  }, [setOverlay, setDocked]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;

    const navbarHeight = Math.round(
      NAVBAR_EM * parseFloat(getComputedStyle(document.documentElement).fontSize)
    );

    const observer = new IntersectionObserver(
      ([entry]) => setDocked(!entry.isIntersecting),
      { rootMargin: `-${navbarHeight}px 0px 0px 0px`, threshold: 0 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [setDocked]);

  return sentinelRef;
}
