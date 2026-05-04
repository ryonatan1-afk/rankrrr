"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { submitVote } from "@/app/actions";
import {
  getCurrentMatchup,
  getRoundProgress,
  isBracketComplete,
  getBracketWinner,
  type BracketState,
} from "@/lib/bracket";

interface Item {
  id: string;
  name: string;
  emoji: string | null;
  color: string | null;
  description: string | null;
}

interface Props {
  categoryId: string;
  categorySlug: string;
  initialBracketState: BracketState;
  itemMap: Record<string, Item>;
}

function ConfettiParticle({ x, y, color, angle, dist }: { x: number; y: number; color: string; angle: number; dist: number }) {
  return (
    <span
      style={{
        position: "fixed", left: x, top: y, width: 7, height: 7,
        borderRadius: Math.random() > 0.5 ? "50%" : "2px",
        background: color,
        transform: "translate(-50%,-50%)",
        animation: "confetti 0.7s ease-out forwards",
        "--angle": `${angle}deg`,
        "--dist": `${dist}px`,
        pointerEvents: "none", zIndex: 9999,
      } as React.CSSProperties}
    />
  );
}

function MatchupCard({
  item,
  isSelected,
  isLoser,
  isIdle,
  onSelect,
}: {
  item: Item;
  isSelected: boolean;
  isLoser: boolean;
  isIdle: boolean;
  onSelect: (id: string, cx: number, cy: number) => void;
}) {
  const [hovered, setHovered] = useState(false);
  const [ripple, setRipple] = useState<{ x: number; y: number } | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  const handleClick = (e: React.MouseEvent) => {
    if (!isIdle) return;
    const rect = ref.current!.getBoundingClientRect();
    setRipple({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    setTimeout(() => setRipple(null), 600);
    onSelect(item.id, e.clientX, e.clientY);
  };

  const color = item.color ?? "#6366F1";
  const border = isSelected ? "#34D399" : isLoser ? "rgba(255,255,255,0.04)" : hovered && isIdle ? "rgba(99,102,241,0.7)" : "rgba(255,255,255,0.08)";
  const bg = isSelected ? "rgba(52,211,153,0.05)" : hovered && isIdle ? "rgba(99,102,241,0.07)" : "rgba(255,255,255,0.03)";
  const shadow = isSelected
    ? "0 0 0 1px #34D399, 0 8px 48px rgba(52,211,153,0.25)"
    : hovered && isIdle
    ? "0 0 0 1px rgba(99,102,241,0.6), 0 8px 48px rgba(99,102,241,0.2)"
    : "0 0 0 1px rgba(255,255,255,0.06), 0 4px 24px rgba(0,0,0,0.3)";

  return (
    <div
      ref={ref}
      onClick={handleClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        flex: 1, minWidth: 0,
        background: bg,
        border: `1px solid ${border}`,
        borderRadius: 22,
        padding: "28px 22px 24px",
        cursor: isIdle ? "pointer" : "default",
        transform: `scale(${isSelected ? 1.04 : isLoser ? 0.95 : hovered && isIdle ? 1.025 : 1})`,
        opacity: isLoser ? 0.35 : 1,
        boxShadow: shadow,
        backdropFilter: "blur(12px)",
        transition: "transform 0.25s cubic-bezier(.34,1.56,.64,1), opacity 0.28s ease, box-shadow 0.22s ease, border-color 0.18s ease, background 0.18s ease",
        position: "relative",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 16,
        userSelect: "none",
        touchAction: "none",
      }}
    >
      {/* Glow */}
      {(hovered || isSelected) && (
        <div style={{
          position: "absolute", inset: 0, borderRadius: "inherit",
          background: `radial-gradient(ellipse at 50% 0%, ${isSelected ? "#34D39918" : "#6366F118"} 0%, transparent 70%)`,
          pointerEvents: "none",
        }} />
      )}

      {/* Winner badge */}
      <div style={{
        position: "absolute", top: 12, right: 14,
        background: isSelected ? "rgba(52,211,153,0.15)" : "rgba(255,255,255,0.05)",
        border: `1px solid ${isSelected ? "rgba(52,211,153,0.4)" : "rgba(255,255,255,0.08)"}`,
        color: isSelected ? "#34D399" : "rgba(255,255,255,0.3)",
        fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase",
        padding: "3px 9px", borderRadius: 99,
      }}>
        {isSelected ? "✓ Winner" : "vs"}
      </div>

      {/* Emoji */}
      <div style={{
        width: 88, height: 88, borderRadius: 20, flexShrink: 0,
        background: `linear-gradient(135deg, ${color}33, ${color}11)`,
        border: `1.5px solid ${color}44`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 40,
        transition: "transform 0.25s cubic-bezier(.34,1.56,.64,1)",
        transform: hovered && isIdle ? "scale(1.1) rotate(-4deg)" : "scale(1) rotate(0deg)",
      }}>
        {item.emoji}
      </div>

      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, textAlign: "center" }}>
        <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1.2 }}>
          {item.name}
        </div>
        {item.description && (
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", lineHeight: 1.55, maxWidth: 200 }}>
            {item.description}
          </div>
        )}
      </div>

      {isIdle && (
        <div style={{
          background: hovered ? "rgba(99,102,241,0.9)" : "rgba(255,255,255,0.05)",
          color: hovered ? "#fff" : "rgba(255,255,255,0.4)",
          border: `1px solid ${hovered ? "transparent" : "rgba(255,255,255,0.08)"}`,
          borderRadius: 12, padding: "8px 22px",
          fontSize: 13, fontWeight: 600,
          transition: "all 0.18s ease", pointerEvents: "none",
          boxShadow: hovered ? "0 4px 20px rgba(99,102,241,0.4)" : "none",
        }}>
          Choose →
        </div>
      )}

      {ripple && (
        <span style={{
          position: "absolute", left: ripple.x, top: ripple.y,
          width: 8, height: 8, borderRadius: "50%",
          background: "rgba(99,102,241,0.4)",
          transform: "translate(-50%, -50%) scale(0)",
          animation: "ripple 0.55s ease-out forwards",
          pointerEvents: "none", zIndex: 10,
        }} />
      )}
    </div>
  );
}

export default function VoteClient({ categoryId, categorySlug, initialBracketState, itemMap }: Props) {
  const router = useRouter();
  const [state, setState] = useState<BracketState>(initialBracketState);
  const [animPhase, setAnimPhase] = useState<"idle" | "selected" | "transitioning">("idle");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [confetti, setConfetti] = useState<Array<{ id: number; x: number; y: number; color: string; angle: number; dist: number }>>([]);
  const [visible, setVisible] = useState(true);
  const swipeStartX = useRef<number | null>(null);

  const currentMatchup = getCurrentMatchup(state);
  const { done, total } = getRoundProgress(state);
  const isComplete = isBracketComplete(state);
  const winner = isComplete ? itemMap[getBracketWinner(state) ?? ""] : null;

  const doVote = useCallback(async (winnerId: string, loserId: string, cx?: number, cy?: number) => {
    if (animPhase !== "idle") return;
    setSelectedId(winnerId);
    setAnimPhase("selected");

    // Confetti
    const particles = Array.from({ length: 16 }, (_, i) => ({
      id: i,
      x: cx ?? window.innerWidth / 2,
      y: cy ?? window.innerHeight / 2,
      color: ["#6366F1", "#818CF8", "#34D399", "#A5B4FC", "#FCD34D", "#6EE7B7"][i % 6],
      angle: (i / 16) * 360,
      dist: 52 + Math.random() * 56,
    }));
    setConfetti(particles);
    setTimeout(() => setConfetti([]), 800);

    // Start transition
    setTimeout(() => {
      setVisible(false);
      setTimeout(async () => {
        const nextState = await submitVote(categoryId, winnerId, loserId, state.currentRound);
        setState(nextState);
        setAnimPhase("idle");
        setSelectedId(null);
        setVisible(true);
      }, 260);
    }, 480);
  }, [animPhase, categoryId, state.currentRound]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (animPhase !== "idle" || !currentMatchup) return;
      if (e.key === "1" || e.key === "ArrowLeft") doVote(currentMatchup.itemAId, currentMatchup.itemBId);
      if (e.key === "2" || e.key === "ArrowRight") doVote(currentMatchup.itemBId, currentMatchup.itemAId);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [animPhase, currentMatchup, doVote]);

  // Touch swipe
  const handleTouchStart = (e: React.TouchEvent) => { swipeStartX.current = e.touches[0].clientX; };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (swipeStartX.current === null || !currentMatchup || animPhase !== "idle") return;
    const dx = e.changedTouches[0].clientX - swipeStartX.current;
    if (Math.abs(dx) < 50) return;
    if (dx > 0) doVote(currentMatchup.itemAId, currentMatchup.itemBId);
    else doVote(currentMatchup.itemBId, currentMatchup.itemAId);
    swipeStartX.current = null;
  };

  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  const roundLabels = ["Quarter-finals", "Semi-finals", "Final"];

  if (isComplete && winner) {
    return (
      <div className="flex flex-col items-center gap-8 py-12 text-center" style={{ animation: "fadeup 0.45s ease forwards" }}>
        <div style={{
          width: 96, height: 96, borderRadius: 24,
          background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.3)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 52, boxShadow: "0 8px 40px rgba(52,211,153,0.2)",
        }}>
          {winner.emoji}
        </div>
        <div>
          <div style={{ fontSize: 32, fontWeight: 700, letterSpacing: "-0.05em", marginBottom: 10 }}>All done!</div>
          <div style={{ fontSize: 15, color: "rgba(255,255,255,0.45)", maxWidth: 300, lineHeight: 1.6 }}>
            <strong style={{ color: "#fff" }}>{winner.name}</strong> topped your bracket. See how the crowd voted.
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
          <a
            href={`/categories/${categorySlug}/leaderboard`}
            style={{
              background: "var(--accent)", color: "#fff", border: "none", borderRadius: 12,
              padding: "12px 28px", fontSize: 14, fontWeight: 700, cursor: "pointer",
              boxShadow: "0 4px 20px var(--accent-glow)", textDecoration: "none",
            }}
          >
            View Rankings →
          </a>
          <button
            onClick={() => router.push("/categories")}
            style={{
              background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.5)",
              border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12,
              padding: "12px 22px", fontSize: 14, fontWeight: 600, cursor: "pointer",
            }}
          >
            ← Categories
          </button>
        </div>
      </div>
    );
  }

  if (!currentMatchup) return null;

  const itemA = itemMap[currentMatchup.itemAId];
  const itemB = itemMap[currentMatchup.itemBId];
  if (!itemA || !itemB) return null;

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="flex flex-col gap-6"
    >
      {/* Progress */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
          <span style={{ fontSize: 11.5, color: "var(--muted)", fontWeight: 500 }}>
            {roundLabels[state.currentRound - 1]} · Round {state.currentRound} of 3
          </span>
          <span style={{ fontSize: 11.5, color: "var(--accent)", fontWeight: 600 }}>{pct}% done</span>
        </div>
        <div style={{ height: 3, borderRadius: 99, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
          <div style={{
            height: "100%", width: `${pct}%`,
            background: "linear-gradient(90deg, var(--accent), #34D399)",
            borderRadius: 99, transition: "width 0.4s cubic-bezier(.4,0,.2,1)",
          }} />
        </div>
      </div>

      <div style={{ textAlign: "center", fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.25)", letterSpacing: "0.14em", textTransform: "uppercase" }}>
        Which do you prefer?
      </div>

      {/* Cards */}
      <div
        style={{
          display: "flex", gap: 16, alignItems: "stretch",
          opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(10px)",
          transition: "opacity 0.22s ease, transform 0.22s ease",
        }}
      >
        <MatchupCard
          item={itemA}
          isSelected={selectedId === itemA.id}
          isLoser={selectedId !== null && selectedId !== itemA.id}
          isIdle={animPhase === "idle"}
          onSelect={(id, cx, cy) => doVote(id, itemB.id, cx, cy)}
        />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <div style={{
            width: 40, height: 40, borderRadius: "50%",
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.1)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 11, fontWeight: 800, color: "rgba(255,255,255,0.3)", letterSpacing: "0.08em",
          }}>VS</div>
        </div>
        <MatchupCard
          item={itemB}
          isSelected={selectedId === itemB.id}
          isLoser={selectedId !== null && selectedId !== itemB.id}
          isIdle={animPhase === "idle"}
          onSelect={(id, cx, cy) => doVote(id, itemA.id, cx, cy)}
        />
      </div>

      <div style={{ textAlign: "center", fontSize: 11.5, color: "rgba(255,255,255,0.15)" }}>
        Click, use arrow keys, or swipe to vote
      </div>

      {/* Confetti */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 9999 }}>
        {confetti.map((p) => <ConfettiParticle key={p.id} {...p} />)}
      </div>
    </div>
  );
}
