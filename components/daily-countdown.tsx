"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function DailyCountdown() {
  const router = useRouter();
  const [timeLeft, setTimeLeft] = useState<string | null>(null);

  useEffect(() => {
    function compute() {
      const now = new Date();
      const midnight = new Date(now);
      midnight.setHours(24, 0, 0, 0);
      const diff = midnight.getTime() - now.getTime();

      if (diff <= 0) {
        router.refresh();
        return "Resets now";
      }

      const h = Math.floor(diff / 3_600_000);
      const m = Math.floor((diff % 3_600_000) / 60_000);
      const s = Math.floor((diff % 60_000) / 1_000);

      if (h > 0) return `${h}h ${String(m).padStart(2, "0")}m ${String(s).padStart(2, "0")}s`;
      return `${m}m ${String(s).padStart(2, "0")}s`;
    }

    setTimeLeft(compute());
    const id = setInterval(() => setTimeLeft(compute()), 1000);
    return () => clearInterval(id);
  }, [router]);

  if (timeLeft === null) return null;

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
      <span style={{ fontSize: 13, color: "rgba(255,255,255,0.25)" }}>⏰ Resets in</span>
      <span style={{
        fontSize: 15, fontWeight: 700, color: "#fff",
        fontVariantNumeric: "tabular-nums", letterSpacing: "0.03em",
      }}>
        {timeLeft}
      </span>
    </div>
  );
}
