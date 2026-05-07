"use client";

import Link from "next/link";
import { useState } from "react";

interface CategoryLinkProps {
  href: string;
  name: string;
  voteCount: number;
}

export function CategoryLink({ href, name, voteCount }: CategoryLinkProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <Link
      href={href}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "12px 14px", borderRadius: 14,
        border: `1px solid ${hovered ? "rgba(99,102,241,0.4)" : "rgba(255,255,255,0.06)"}`,
        background: hovered ? "rgba(99,102,241,0.07)" : "rgba(255,255,255,0.02)",
        textDecoration: "none", transition: "all 0.15s ease",
      }}
    >
      <div style={{ fontSize: 16, fontWeight: 600, letterSpacing: "-0.02em" }}>{name}</div>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ fontSize: 12, color: "rgba(255,255,255,0.25)" }}>{voteCount} votes</span>
        <span style={{ fontSize: 15, color: "rgba(255,255,255,0.25)" }}>→</span>
      </div>
    </Link>
  );
}
