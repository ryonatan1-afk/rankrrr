"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function NavLogo() {
  const pathname = usePathname();
  if (pathname === "/") return null;

  return (
    <Link href="/" aria-label="Rankr home">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-shadow">
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M13 2L3 14h8l-1 8 11-12h-8l1-8z" fill="#fb923c" />
        </svg>
      </span>
    </Link>
  );
}
