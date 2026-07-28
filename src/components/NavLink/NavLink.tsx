"use client";

import Link, { type LinkProps } from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

type NavLinkProps = LinkProps & {
  href: string;
  activeClassName?: string;
  className?: string;
  children: ReactNode;
};

export default function NavLink({
  href,
  activeClassName = "",
  className = "",
  children,
  ...props
}: NavLinkProps) {
  const pathname = usePathname();
  const isActive = pathname === href;
  const composed = `${className} ${isActive ? activeClassName : ""}`.trim();

  return (
    <Link href={href} className={composed} {...props}>
      {children}
    </Link>
  );
}
