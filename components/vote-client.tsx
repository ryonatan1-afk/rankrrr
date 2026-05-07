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
import { BracketTree } from "@/components/bracket-tree";

interface Item {
  id: string;
  name: string;
  emoji: string | null;
  color: string | null;
  description: string | null;
}

interface CrowdItem {
  itemId: string;
  winRate: number;
  totalVotes: number;
}

interface Props {
  categoryId: string;
  categorySlug: string;
  categoryName: string;
  initialBracketState: BracketState;
  itemMap: Record<string, Item>;
  part: number;
  canStartPart2: boolean;
  crowdData?: CrowdItem[];
}

function getInitials(name: string): string {
  const words = name.trim().split(/\s+/);
  if (words.length === 1) return name.slice(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
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
  showKeyHint,
  keyHint,
  onSelect,
}: {
  item: Item;
  isSelected: boolean;
  isLoser: boolean;
  isIdle: boolean;
  showKeyHint: boolean;
  keyHint: "←" | "→";
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
        padding: "clamp(16px, 4vw, 28px) clamp(14px, 3vw, 22px) clamp(14px, 4vw, 24px)",
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
      {isSelected && (
        <div style={{
          position: "absolute", top: 12, right: 14,
          background: "rgba(52,211,153,0.15)",
          border: "1px solid rgba(52,211,153,0.4)",
          color: "#34D399",
          fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase",
          padding: "3px 9px", borderRadius: 99,
        }}>
          ✓ Winner
        </div>
      )}

      {/* Keyboard hint overlay — fades after first vote */}
      {showKeyHint && isIdle && !isSelected && !isLoser && (
        <div style={{
          position: "absolute", bottom: 10, left: "50%", transform: "translateX(-50%)",
          background: "rgba(99,102,241,0.12)",
          border: "1px solid rgba(99,102,241,0.2)",
          borderRadius: 8, padding: "4px 12px",
          fontSize: 18, color: "rgba(255,255,255,0.3)",
          pointerEvents: "none",
          whiteSpace: "nowrap",
        }}>
          {keyHint}
        </div>
      )}

      {/* Color avatar with initials */}
      <div style={{
        width: 88, height: 88, borderRadius: 20, flexShrink: 0,
        background: `linear-gradient(135deg, ${color}44, ${color}18)`,
        border: `1.5px solid ${color}44`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 26, fontWeight: 800, color: color,
        letterSpacing: "-0.03em",
        fontFamily: "inherit",
        textShadow: `0 0 24px ${color}66`,
        transition: "transform 0.25s cubic-bezier(.34,1.56,.64,1)",
        transform: hovered && isIdle ? "scale(1.1) rotate(-4deg)" : "scale(1) rotate(0deg)",
      }}>
        {getInitials(item.name)}
      </div>

      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1.2 }}>
          {item.name}
        </div>
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

export default function VoteClient({ categoryId, categorySlug, categoryName, initialBracketState, itemMap, part, crowdData }: Props) {
  const router = useRouter();
  const [state, setState] = useState<BracketState>(initialBracketState);
  const [animPhase, setAnimPhase] = useState<"idle" | "selected" | "transitioning">("idle");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [confetti, setConfetti] = useState<Array<{ id: number; x: number; y: number; color: string; angle: number; dist: number }>>([]);
  const [visible, setVisible] = useState(true);
  const [hasVotedOnce, setHasVotedOnce] = useState(false);
  const [showHowItWorks] = useState(() => {
    const initialDone = initialBracketState.rounds
      .reduce((s, r) => s + r.matchups.filter((m) => m.winnerId !== null).length, 0);
    return initialDone === 0 && part === 1;
  });
  const swipeStartX = useRef<number | null>(null);

  const currentMatchup = getCurrentMatchup(state);
  const { done, total } = getRoundProgress(state);
  const isComplete = isBracketComplete(state);
  const winner = isComplete ? itemMap[getBracketWinner(state) ?? ""] : null;

  const doVote = useCallback(async (winnerId: string, loserId: string, cx?: number, cy?: number) => {
    if (animPhase !== "idle") return;
    setSelectedId(winnerId);
    setAnimPhase("selected");
    setHasVotedOnce(true);

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

    const votePromise = submitVote(categoryId, winnerId, loserId, state.currentRound, part);
    const FADE_OUT_DELAY = 300;
    const MIN_BLANK_MS = 120;

    setTimeout(() => setVisible(false), FADE_OUT_DELAY);

    const [nextState] = await Promise.all([
      votePromise,
      new Promise<void>(resolve => setTimeout(resolve, FADE_OUT_DELAY + MIN_BLANK_MS)),
    ]);

    setState(nextState);
    setAnimPhase("idle");
    setSelectedId(null);
    setVisible(true);
  }, [animPhase, categoryId, state.currentRound, part]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (animPhase !== "idle" || !currentMatchup) return;
      if (e.key === "1" || e.key === "ArrowLeft") doVote(currentMatchup.itemAId, currentMatchup.itemBId);
      if (e.key === "2" || e.key === "ArrowRight") doVote(currentMatchup.itemBId, currentMatchup.itemAId);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [animPhase, currentMatchup, doVote]);

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

  const currentRoundMatchups = state.rounds[state.currentRound - 1]?.matchups ?? [];
  const completedInRound = currentRoundMatchups.filter((m) => m.winnerId !== null).length;
  const matchInRound = completedInRound + 1;
  const totalInRound = currentRoundMatchups.length;
  const bracketLabel = `Bracket ${part} of 2`;

  if (isComplete && winner) {
    const isLastPart = part === 2;
    const winnerCrowdRank = crowdData ? crowdData.findIndex((cd) => cd.itemId === winner.id) + 1 : 0;
    const crowdTop = crowdData && crowdData.length > 0 ? itemMap[crowdData[0].itemId] : null;
    const crowdAgreed = crowdData && crowdData.length > 0 && crowdData[0].itemId === winner.id;
    const shareText = `I picked ${winner.name} as the best in ${categoryName} — what's yours?`;
    const shareUrl = `https://rankrrr.vercel.app/categories/${categorySlug}/vote`;

    return (
      <div className="flex flex-col gap-8" style={{ animation: "fadeup 0.45s ease forwards" }}>
        {/* Completion header */}
        <div className="flex flex-col items-center gap-4 text-center">
          <div style={{
            width: 72, height: 72, borderRadius: 20,
            background: isLastPart ? "rgba(52,211,153,0.1)" : "rgba(99,102,241,0.1)",
            border: `1px solid ${isLastPart ? "rgba(52,211,153,0.3)" : "rgba(99,102,241,0.3)"}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 24, fontWeight: 800,
            color: isLastPart ? "#34D399" : "#818CF8",
            boxShadow: isLastPart ? "0 8px 40px rgba(52,211,153,0.2)" : "0 8px 40px rgba(99,102,241,0.2)",
          }}>
            {getInitials(winner.name)}
          </div>
          <div>
            <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: "-0.04em", marginBottom: 6 }}>
              {isLastPart ? "All done!" : "Bracket 1 complete"}
            </div>
            <div style={{ fontSize: 14, color: "rgba(255,255,255,0.45)", lineHeight: 1.6 }}>
              {isLastPart ? (
                <><strong style={{ color: "#fff" }}>{winner.name}</strong> topped your bracket.</>
              ) : (
                <>Top of Bracket 1: <strong style={{ color: "#fff" }}>{winner.name}</strong></>
              )}
            </div>
          </div>
        </div>

        {/* Continue to Bracket 2 — shown only after Bracket 1 */}
        {!isLastPart && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <a
              href={`/categories/${categorySlug}/vote?part=2`}
              style={{
                background: "linear-gradient(135deg, #6366F1, #8B5CF6)", color: "#fff",
                borderRadius: 14, width: "100%", textAlign: "center",
                padding: "15px 28px", fontSize: 15, fontWeight: 700,
                boxShadow: "0 4px 24px rgba(99,102,241,0.45)", textDecoration: "none",
                display: "block", border: "none",
              }}
            >
              Continue to Bracket 2 →
            </a>
            <a
              href={`/categories/${categorySlug}/leaderboard`}
              style={{
                display: "block", textAlign: "center",
                fontSize: 13, color: "rgba(255,255,255,0.35)", textDecoration: "none",
                padding: "8px",
              }}
            >
              View leaderboard so far
            </a>
          </div>
        )}

        {/* You vs. crowd — shown on both brackets if crowd data exists */}
        {crowdData && crowdData.length > 0 && (
          <div style={{
            background: "rgba(255,255,255,0.025)",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 14, padding: "16px 18px",
            display: "flex", flexDirection: "column", gap: 12,
          }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.25)" }}>
              You vs. the crowd
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
              <div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", marginBottom: 3 }}>Your pick</div>
                <div style={{ fontSize: 16, fontWeight: 700 }}>{winner.name}</div>
                {winnerCrowdRank > 0 && (
                  <div style={{ fontSize: 11.5, color: "rgba(255,255,255,0.3)", marginTop: 3 }}>
                    #{winnerCrowdRank} in crowd rankings
                  </div>
                )}
              </div>
              <div style={{
                padding: "5px 14px", borderRadius: 99, fontSize: 11.5, fontWeight: 700,
                background: crowdAgreed ? "rgba(52,211,153,0.12)" : "rgba(255,255,255,0.05)",
                border: `1px solid ${crowdAgreed ? "rgba(52,211,153,0.3)" : "rgba(255,255,255,0.08)"}`,
                color: crowdAgreed ? "#34D399" : "rgba(255,255,255,0.45)",
                flexShrink: 0,
              }}>
                {crowdAgreed ? "✓ Crowd agrees" : "↕ You diverge from crowd"}
              </div>
            </div>
            {!crowdAgreed && crowdTop && (
              <div style={{ fontSize: 12.5, color: "rgba(255,255,255,0.35)", paddingTop: 4, borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                Crowd&apos;s current #1:{" "}
                <strong style={{ color: "rgba(255,255,255,0.65)" }}>{crowdTop.name}</strong>
                {crowdData[0].totalVotes > 0 && (
                  <span style={{ color: "rgba(255,255,255,0.25)" }}> · {Math.round(crowdData[0].winRate)}% win rate</span>
                )}
              </div>
            )}
          </div>
        )}

        {/* Share (WhatsApp only) — shown after both brackets */}
        {isLastPart && (
          <div style={{ display: "flex", justifyContent: "center" }}>
            <a
              href={`https://wa.me/?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`}
              target="_blank" rel="noopener noreferrer"
              style={{
                fontSize: 14, fontWeight: 700, padding: "11px 26px", borderRadius: 12,
                background: "rgba(37,211,102,0.12)",
                border: "1px solid rgba(37,211,102,0.3)",
                color: "#25D366",
                textDecoration: "none",
                display: "flex", alignItems: "center", gap: 8,
              }}
            >
              💬 Share on WhatsApp
            </a>
          </div>
        )}

        {/* Final actions */}
        {isLastPart && (
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
            <a
              href={`/categories/${categorySlug}/leaderboard`}
              style={{
                background: "var(--accent)", color: "#fff",
                borderRadius: 12, padding: "12px 28px", fontSize: 14, fontWeight: 700,
                textDecoration: "none", boxShadow: "0 4px 20px var(--accent-glow)",
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
        )}

        {/* Bracket tree */}
        <div style={{
          background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: 16, padding: "20px 16px",
        }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.2)", marginBottom: 16 }}>
            Your bracket
          </div>
          <BracketTree state={state} itemMap={itemMap} />
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
      {/* How it works — shown only on very first matchup of bracket 1 */}
      {showHowItWorks && !hasVotedOnce && (
        <div style={{
          background: "rgba(99,102,241,0.07)",
          border: "1px solid rgba(99,102,241,0.18)",
          borderRadius: 12, padding: "12px 16px",
          display: "flex", alignItems: "center", gap: 12,
        }}>
          <span style={{ fontSize: 18, flexShrink: 0 }}>ℹ️</span>
          <div style={{ fontSize: 12.5, color: "rgba(255,255,255,0.5)", lineHeight: 1.5 }}>
            <strong style={{ color: "rgba(255,255,255,0.75)" }}>16 items, 2 brackets, 14 quick matchups.</strong>{" "}
            Vote with arrow keys, click, or swipe.
          </div>
        </div>
      )}

      {/* Progress */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
          <span style={{ fontSize: 11.5, color: "var(--muted)", fontWeight: 500 }}>
            {bracketLabel} · {roundLabels[state.currentRound - 1]} — Match {matchInRound} of {totalInRound}
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
      <style>{`
        .cards-row { display: flex; flex-direction: row; gap: 16px; align-items: stretch; }
        .cards-vs { display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        @media (max-width: 480px) {
          .cards-row { flex-direction: column; gap: 12px; }
          .cards-vs { flex-direction: row; gap: 12px; }
          .cards-vs::before, .cards-vs::after { content: ""; flex: 1; height: 1px; background: rgba(255,255,255,0.07); }
        }
      `}</style>
      <div
        className="cards-row"
        style={{
          opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(10px)",
          transition: "opacity 0.22s ease, transform 0.22s ease",
        }}
      >
        <MatchupCard
          key={itemA.id}
          item={itemA}
          isSelected={selectedId === itemA.id}
          isLoser={selectedId !== null && selectedId !== itemA.id}
          isIdle={animPhase === "idle"}
          showKeyHint={!hasVotedOnce}
          keyHint="←"
          onSelect={(id, cx, cy) => doVote(id, itemB.id, cx, cy)}
        />
        <div className="cards-vs">
          <div style={{
            width: 40, height: 40, borderRadius: "50%",
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.1)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 11, fontWeight: 800, color: "rgba(255,255,255,0.3)", letterSpacing: "0.08em",
            flexShrink: 0,
          }}>VS</div>
        </div>
        <MatchupCard
          key={itemB.id}
          item={itemB}
          isSelected={selectedId === itemB.id}
          isLoser={selectedId !== null && selectedId !== itemB.id}
          isIdle={animPhase === "idle"}
          showKeyHint={!hasVotedOnce}
          keyHint="→"
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
