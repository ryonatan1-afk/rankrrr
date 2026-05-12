"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { submitVote } from "@/app/actions";
import {
  getCurrentMatchup,
  getRoundProgress,
  isBracketComplete,
  getBracketWinner,
  type BracketState,
} from "@/lib/bracket";
import { BracketTree } from "@/components/bracket-tree";
import HowToModal from "@/components/how-to-modal";

interface Item {
  id: string;
  name: string;
  emoji: string | null;
  color: string | null;
  description: string | null;
  imageUrl: string | null;
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
  crowdData?: CrowdItem[];
  streak?: number;
  totalCompleted?: number;
  showImages?: boolean;
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
  onSelect,
  showImages = true,
}: {
  item: Item;
  isSelected: boolean;
  isLoser: boolean;
  isIdle: boolean;
  onSelect: (id: string, cx: number, cy: number) => void;
  showImages?: boolean;
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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isIdle) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      const rect = ref.current!.getBoundingClientRect();
      onSelect(item.id, rect.left + rect.width / 2, rect.top + rect.height / 2);
    }
  };

  const border = isSelected ? "var(--green)" : isLoser ? "rgba(255,255,255,0.04)" : hovered && isIdle ? "rgba(99,102,241,0.7)" : "rgba(255,255,255,0.08)";
  const bg = isSelected ? "rgba(52,211,153,0.05)" : hovered && isIdle ? "rgba(99,102,241,0.07)" : "rgba(255,255,255,0.03)";
  const shadow = isSelected
    ? "0 0 0 1px var(--green), 0 8px 48px rgba(52,211,153,0.25)"
    : hovered && isIdle
    ? "0 0 0 1px rgba(99,102,241,0.6), 0 8px 48px rgba(99,102,241,0.2)"
    : "0 0 0 1px rgba(255,255,255,0.06), 0 4px 24px rgba(0,0,0,0.3)";

  return (
    <div
      ref={ref}
      role="button"
      tabIndex={isIdle ? 0 : -1}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="matchup-card"
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
        transition: "transform 0.25s cubic-bezier(.34,1.56,.64,1), opacity 0.28s ease, box-shadow 0.22s ease, border-color 0.18s ease, background 0.18s ease",
        position: "relative",
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
          background: `radial-gradient(ellipse at 50% 0%, ${isSelected ? "var(--green)18" : "#6366F118"} 0%, transparent 70%)`,
          pointerEvents: "none",
        }} />
      )}

      {/* Winner badge */}
      {isSelected && (
        <div style={{
          position: "absolute", top: 12, right: 14,
          background: "rgba(52,211,153,0.15)",
          border: "1px solid rgba(52,211,153,0.4)",
          color: "var(--green)",
          fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase",
          padding: "3px 9px", borderRadius: 99,
        }}>
          âœ“ Winner
        </div>
      )}


      {/* Image slot */}
      {showImages && (
        <div style={{
          width: 88, height: 88, borderRadius: 16, overflow: "hidden", flexShrink: 0,
          position: "relative",
          background: item.imageUrl ? "transparent" : "rgba(255,255,255,0.04)",
          border: item.imageUrl ? "none" : "1px solid var(--border)",
          boxShadow: item.imageUrl ? "0 4px 20px rgba(0,0,0,0.4)" : "none",
        }}>
          {item.imageUrl && (
            <Image
              src={item.imageUrl}
              alt={item.name}
              fill
              sizes="88px"
              style={{ objectFit: "cover" }}
            />
          )}
        </div>
      )}

      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1.2 }}>
          {item.name}
        </div>
      </div>

      {/* Ripple clip layer */}
      <div style={{ position: "absolute", inset: 0, borderRadius: 22, overflow: "hidden", pointerEvents: "none" }}>
        {ripple && (
          <span style={{
            position: "absolute", left: ripple.x, top: ripple.y,
            width: 8, height: 8, borderRadius: "50%",
            background: "rgba(99,102,241,0.4)",
            transform: "translate(-50%, -50%) scale(0)",
            animation: "ripple 0.55s ease-out forwards",
          }} />
        )}
      </div>
    </div>
  );
}

export default function VoteClient({ categoryId, categorySlug, categoryName, initialBracketState, itemMap, crowdData, streak = 0, totalCompleted = 0, showImages = true }: Props) {
  const router = useRouter();
  const [state, setState] = useState<BracketState>(initialBracketState);
  const [animPhase, setAnimPhase] = useState<"idle" | "selected" | "transitioning">("idle");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [confetti, setConfetti] = useState<Array<{ id: number; x: number; y: number; color: string; angle: number; dist: number }>>([]);
  const [visible, setVisible] = useState(true);
  const cardsContainerRef = useRef<HTMLDivElement>(null);
  const [showSharePopup, setShowSharePopup] = useState(false);
  const hasVoted = useRef(false);

  const currentMatchup = getCurrentMatchup(state);
  const { done, total } = getRoundProgress(state);
  const isComplete = isBracketComplete(state);
  const winner = isComplete ? itemMap[getBracketWinner(state) ?? ""] : null;

  const doVote = useCallback(async (winnerId: string, loserId: string, cx?: number, cy?: number) => {
    if (animPhase !== "idle") return;
    hasVoted.current = true;
    setSelectedId(winnerId);
    setAnimPhase("selected");

    const particles = Array.from({ length: 16 }, (_, i) => ({
      id: i,
      x: cx ?? window.innerWidth / 2,
      y: cy ?? window.innerHeight / 2,
      color: ["#6366F1", "#818CF8", "var(--green)", "#A5B4FC", "#FCD34D", "#6EE7B7"][i % 6],
      angle: (i / 16) * 360,
      dist: 52 + Math.random() * 56,
    }));
    setConfetti(particles);
    setTimeout(() => setConfetti([]), 800);

    const votePromise = submitVote(categoryId, winnerId, loserId, state.currentRound);
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
  }, [animPhase, categoryId, state.currentRound]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (animPhase !== "idle" || !currentMatchup) return;
      if (e.key === "1" || e.key === "ArrowLeft") doVote(currentMatchup.itemAId, currentMatchup.itemBId);
      if (e.key === "2" || e.key === "ArrowRight") doVote(currentMatchup.itemBId, currentMatchup.itemAId);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [animPhase, currentMatchup, doVote]);

  useEffect(() => {
    if (!visible || animPhase !== "idle" || !hasVoted.current) return;
    const first = cardsContainerRef.current?.querySelector<HTMLElement>('[role="button"]');
    first?.focus({ preventScroll: true });
  }, [visible, animPhase]);

  useEffect(() => {
    if (!isBracketComplete(state)) return;
    const t = setTimeout(() => setShowSharePopup(true), 600);
    return () => clearTimeout(t);
  }, [state]);


  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  const roundLabels = ["Round of 16", "Quarter-finals", "Semi-finals", "Final"];

  const currentRoundMatchups = state.rounds[state.currentRound - 1]?.matchups ?? [];
  const completedInRound = currentRoundMatchups.filter((m) => m.winnerId !== null).length;
  const matchInRound = completedInRound + 1;
  const totalInRound = currentRoundMatchups.length;

  if (isComplete && winner) {
    const crowdWisdomScore = (() => {
      if (!crowdData || crowdData.length === 0) return null;
      const crowdMap = new Map(crowdData.map(cd => [cd.itemId, cd.winRate]));
      const matchups = state.rounds.flatMap(r => r.matchups).filter(m => m.winnerId !== null);
      if (matchups.length === 0) return null;
      const matching = matchups.filter(m => {
        const aRate = crowdMap.get(m.itemAId) ?? 0;
        const bRate = crowdMap.get(m.itemBId) ?? 0;
        return m.winnerId === (aRate >= bRate ? m.itemAId : m.itemBId);
      }).length;
      return Math.round((matching / matchups.length) * 100);
    })();

    const winnerCrowdRank = crowdData ? crowdData.findIndex((cd) => cd.itemId === winner.id) + 1 : 0;
    const crowdTop = crowdData && crowdData.length > 0 ? itemMap[crowdData[0].itemId] : null;
    const crowdAgreed = crowdData && crowdData.length > 0 && crowdData[0].itemId === winner.id;
    const shareText = `I picked ${winner.name} as the best in ${categoryName}. What's yours?`;
    const shareUrl = `https://rankrrr.vercel.app/categories/${categorySlug}/vote`;

    return (
      <>
        <HowToModal />
        <div className="flex flex-col gap-8" style={{ animation: "fadein 0.45s ease forwards" }}>
        {/* Completion header */}
        <div className="flex flex-col items-center gap-4 text-center">
          <div style={{
            width: 72, height: 72, borderRadius: 20,
            background: "rgba(52,211,153,0.1)",
            border: "1px solid rgba(52,211,153,0.3)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 24, fontWeight: 800,
            color: "var(--green)",
            boxShadow: "0 8px 40px rgba(52,211,153,0.2)",
          }}>
            {getInitials(winner.name)}
          </div>
          <div>
            <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: "-0.04em", marginBottom: 6 }}>
              All done!
            </div>
            <div style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.6 }}>
              <strong style={{ color: "#fff" }}>{winner.name}</strong> topped your bracket.
            </div>
          </div>
        </div>

        {/* You vs. crowd */}
        {crowdData && crowdData.length > 0 && (
          <div style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
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
                color: crowdAgreed ? "var(--green)" : "var(--muted)",
                flexShrink: 0,
              }}>
                {crowdAgreed ? "âœ“ Crowd agrees" : "â†• You diverge from crowd"}
              </div>
            </div>
            {!crowdAgreed && crowdTop && (
              <div style={{ fontSize: 12.5, color: "rgba(255,255,255,0.35)", paddingTop: 4, borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                Crowd&apos;s current #1:{" "}
                <strong style={{ color: "rgba(255,255,255,0.65)" }}>{crowdTop.name}</strong>
                {crowdData[0].totalVotes > 0 && (
                  <span style={{ color: "rgba(255,255,255,0.25)" }}> Â· {Math.round(crowdData[0].winRate)}% win rate</span>
                )}
              </div>
            )}
          </div>
        )}

        {/* Crowd Wisdom Score */}
        {crowdWisdomScore !== null && (() => {
          const ringColor = crowdWisdomScore >= 70 ? "var(--green)" : crowdWisdomScore >= 40 ? "var(--accent)" : "#F87171";
          const circumference = 2 * Math.PI * 44;
          return (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
              <svg width="100" height="100" viewBox="0 0 100 100" aria-label={`Crowd wisdom score: ${crowdWisdomScore}%`}>
                <circle cx="50" cy="50" r="44" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
                <circle
                  cx="50" cy="50" r="44" fill="none"
                  stroke={ringColor} strokeWidth="8" strokeLinecap="round"
                  strokeDasharray={`${circumference}`}
                  strokeDashoffset={`${circumference * (1 - crowdWisdomScore / 100)}`}
                  transform="rotate(-90 50 50)"
                  style={{ transition: "stroke-dashoffset 1s ease" }}
                />
                <text x="50" y="50" textAnchor="middle" dominantBaseline="central"
                  style={{ fontSize: 22, fontWeight: 800, fill: "#fff" }}>
                  {crowdWisdomScore}%
                </text>
              </svg>
              <div style={{ fontSize: 13, color: "var(--muted)", textAlign: "center", maxWidth: 220 }}>
                You agreed with the crowd{" "}
                <strong style={{ color: "#fff" }}>{crowdWisdomScore}% of the time</strong>
              </div>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.2)" }}>
                Crowd Wisdom Score
              </div>
            </div>
          );
        })()}

        {/* Streak + total ranked */}
        {(
          <div style={{ display: "flex", gap: 24, justifyContent: "center", flexWrap: "wrap" }}>
            {streak >= 2 && (
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 24 }}>ðŸ”¥</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: "#fff", lineHeight: 1 }}>{streak}</div>
                <div style={{ fontSize: 10, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginTop: 4 }}>Day Streak</div>
              </div>
            )}
            {totalCompleted > 0 && (
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: "#fff", lineHeight: 1 }}>{totalCompleted}</div>
                <div style={{ fontSize: 10, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginTop: 4 }}>Total Ranked</div>
              </div>
            )}
          </div>
        )}

        {/* Share (WhatsApp only) */}
        {(
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
              ðŸ’¬ Share on WhatsApp
            </a>
          </div>
        )}

        {/* Final actions */}
        {(
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
            <a
              href={`/categories/${categorySlug}/leaderboard`}
              style={{
                background: "var(--accent)", color: "#fff",
                borderRadius: 12, padding: "12px 28px", fontSize: 14, fontWeight: 700,
                textDecoration: "none", boxShadow: "0 4px 20px var(--accent-glow)",
              }}
            >
              View Rankings â†’
            </a>
            <button
              onClick={() => router.push("/categories")}
              style={{
                background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.5)",
                border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12,
                padding: "12px 22px", fontSize: 14, fontWeight: 600, cursor: "pointer",
              }}
            >
              â† Categories
            </button>
          </div>
        )}

        {/* Bracket tree */}
        <div style={{
          background: "rgba(255,255,255,0.02)", border: "1px solid var(--border)",
          borderRadius: 16, padding: "20px 16px",
        }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.2)", marginBottom: 16 }}>
            Your bracket
          </div>
          <BracketTree state={state} itemMap={itemMap} />
        </div>
      </div>
      {showSharePopup && createPortal(
        <div style={{
          position: "fixed", inset: 0, zIndex: 1000,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)",
        }} onClick={() => setShowSharePopup(false)}>
          {/* Popup */}
          <div onClick={e => e.stopPropagation()} style={{
            background: "var(--surface)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 20, padding: "32px 28px",
            width: "min(90vw, 340px)",
            display: "flex", flexDirection: "column", alignItems: "center", gap: 16,
            boxShadow: "0 24px 80px rgba(0,0,0,0.6)",
          }}>
            <div style={{ fontSize: 32 }}>💬</div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: "-0.03em", marginBottom: 8 }}>
                Invite friends to vote
              </div>
              <div style={{ fontSize: 13.5, color: "var(--muted)", lineHeight: 1.6 }}>
                See how their picks compare to yours.
              </div>
            </div>
            <a
              href={`https://wa.me/?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`}
              target="_blank" rel="noopener noreferrer"
              onClick={() => setShowSharePopup(false)}
              style={{
                width: "100%", textAlign: "center",
                fontSize: 15, fontWeight: 700, padding: "13px 0", borderRadius: 12,
                background: "#25D366",
                color: "#fff",
                textDecoration: "none",
                display: "block",
                boxShadow: "0 4px 24px rgba(37,211,102,0.35)",
              }}
            >
              Share on WhatsApp
            </a>
            <button
              onClick={() => setShowSharePopup(false)}
              style={{
                background: "none", border: "none", color: "var(--muted)",
                fontSize: 13, cursor: "pointer", padding: "4px 0",
              }}
            >
              Maybe later
            </button>
          </div>
        </div>,
        document.body
      )}
      </>
    );
  }

  if (!currentMatchup) return null;

  const itemA = itemMap[currentMatchup.itemAId];
  const itemB = itemMap[currentMatchup.itemBId];
  if (!itemA || !itemB) return null;

  return (
    <>
      <HowToModal />
      <div
        className="flex flex-col gap-6"
      >
      <div aria-live="polite" aria-atomic="true" style={{ position:"absolute", width:1, height:1, padding:0, margin:-1, overflow:"hidden", clip:"rect(0,0,0,0)", whiteSpace:"nowrap", borderWidth:0 }}>
        {`${roundLabels[state.currentRound - 1]}, match ${matchInRound} of ${totalInRound}. ${itemA.name} vs ${itemB.name}.`}
      </div>
      {/* Progress */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
          <span style={{ fontSize: 11.5, color: "var(--muted)", fontWeight: 500 }}>
            {roundLabels[state.currentRound - 1]} â€” Match {matchInRound} of {totalInRound}
          </span>
          <span style={{ fontSize: 11.5, color: "var(--accent)", fontWeight: 600 }}>{pct}% done</span>
        </div>
        <div
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Voting progress: ${pct}% complete`}
          style={{ height: 3, borderRadius: 99, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}
        >
          <div style={{
            height: "100%", width: `${pct}%`,
            background: "linear-gradient(90deg, var(--accent), var(--green))",
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
        .matchup-card:focus-visible { outline: 2px solid var(--accent); outline-offset: 3px; border-radius: 22px; }
        @media (max-width: 480px) {
          .cards-row { flex-direction: column; gap: 12px; }
          .cards-vs { flex-direction: row; gap: 12px; }
          .cards-vs::before, .cards-vs::after { content: ""; flex: 1; height: 1px; background: var(--border); }
        }
      `}</style>
      <div
        ref={cardsContainerRef}
        className="cards-row"
        style={{
          opacity: visible ? 1 : 0,
          transform: `translateY(${visible ? 0 : 10}px)`,
          transition: "opacity 0.22s ease, transform 0.4s cubic-bezier(0.34,1.56,0.64,1)",
        }}
      >
        <MatchupCard
          key={itemA.id}
          item={itemA}
          isSelected={selectedId === itemA.id}
          isLoser={selectedId !== null && selectedId !== itemA.id}
          isIdle={animPhase === "idle"}
          showImages={showImages}
          onSelect={(id, cx, cy) => doVote(id, itemB.id, cx, cy)}
        />
        <div className="cards-vs" aria-hidden="true">
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
          showImages={showImages}
          onSelect={(id, cx, cy) => doVote(id, itemA.id, cx, cy)}
        />
      </div>

      <div style={{ textAlign: "center", fontSize: 11.5, color: "rgba(255,255,255,0.15)" }}>
        Click or use arrow keys to vote
      </div>

      {/* Confetti */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 9999 }}>
        {confetti.map((p) => <ConfettiParticle key={p.id} {...p} />)}
      </div>
    </div>
    </>
  );
}



