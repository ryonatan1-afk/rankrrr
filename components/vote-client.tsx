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
import { trackEvent } from "@/lib/analytics";

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
          ✓ Winner
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
  const hasRefreshed = useRef(false);

  // Images are fetched asynchronously after category creation. If none have arrived
  // yet, schedule a single page refresh to pick them up once the background job finishes.
  useEffect(() => {
    if (!showImages || hasRefreshed.current) return;
    const hasAnyImage = Object.values(itemMap).some((item) => item.imageUrl);
    if (hasAnyImage) return;
    hasRefreshed.current = true;
    const t = setTimeout(() => router.refresh(), 3000);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    const winnerId = getBracketWinner(state);
    const winnerItem = winnerId ? itemMap[winnerId] : null;
    trackEvent("bracket_completed", {
      category_slug: categorySlug,
      category_name: categoryName,
      winner_name: winnerItem?.name ?? "",
    });
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
    const crowdTop = crowdData && crowdData.length > 0 ? itemMap[crowdData[0].itemId] : null;
    const crowdAgreed = crowdData && crowdData.length > 0 && crowdData[0].itemId === winner.id;
    const shareText = `I picked ${winner.name} as the best in ${categoryName}. Come vote!`;
    const shareUrl = `https://rankrrr.vercel.app/categories/${categorySlug}/vote`;
    const medals = ["🥇", "🥈", "🥉"];
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

    return (
      <>
        <HowToModal />
        <div className="flex flex-col gap-6" style={{ animation: "fadein 0.45s ease forwards" }}>

          {/* Header: winner + share */}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <div style={{ fontSize: 11, color: "var(--muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em" }}>
                You picked
              </div>
              <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.04em", lineHeight: 1.2 }}>
                {winner.name}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginTop: 2 }}>
                {crowdData && crowdData.length > 0 && (
                  <div style={{ fontSize: 12, color: crowdAgreed ? "var(--green)" : "var(--muted)" }}>
                    {crowdAgreed ? "✓ Crowd agrees" : `↕ Crowd top: ${crowdTop?.name}`}
                  </div>
                )}
                {crowdWisdomScore !== null && (
                  <div style={{
                    fontSize: 11, fontWeight: 700,
                    padding: "2px 8px", borderRadius: 99,
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    color: "rgba(255,255,255,0.45)",
                  }}>
                    {crowdWisdomScore}% match
                  </div>
                )}
              </div>
            </div>
            <button
              onClick={() => setShowSharePopup(true)}
              style={{
                fontSize: 13, fontWeight: 700, padding: "9px 18px", borderRadius: 12,
                background: "rgba(37,211,102,0.12)",
                border: "1px solid rgba(37,211,102,0.3)",
                color: "#25D366",
                cursor: "pointer",
                display: "flex", alignItems: "center", gap: 6,
                flexShrink: 0,
              }}
            >
              💬 Challenge a friend
            </button>
          </div>

          {/* Community ranking */}
          <div style={{
            background: "var(--surface)", border: "1px solid var(--border)",
            borderRadius: 16, padding: 6,
            display: "flex", flexDirection: "column", gap: 2,
          }}>
            <div style={{ padding: "10px 14px 8px", borderBottom: "1px solid rgba(255,255,255,0.05)", marginBottom: 2 }}>
              <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.25)" }}>
                Community Ranking
              </span>
            </div>
            {crowdData && crowdData.length > 0 ? (
              crowdData.map((cd, i) => {
                const item = itemMap[cd.itemId];
                if (!item) return null;
                const isYourPick = item.id === winner.id;
                return (
                  <div key={item.id} style={{
                    display: "flex", alignItems: "center", gap: 12,
                    padding: "11px 14px", borderRadius: 12,
                    background: isYourPick ? "rgba(99,102,241,0.06)" : i % 2 === 0 ? "rgba(255,255,255,0.015)" : "transparent",
                    border: `1px solid ${isYourPick ? "rgba(99,102,241,0.15)" : "transparent"}`,
                  }}>
                    <div style={{ width: 28, flexShrink: 0, display: "flex", justifyContent: "center" }}>
                      {medals[i] ? (
                        <span style={{ fontSize: 18 }}>{medals[i]}</span>
                      ) : (
                        <span style={{ width: 24, height: 24, borderRadius: "50%", background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.25)", fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid rgba(255,255,255,0.06)" }}>
                          {i + 1}
                        </span>
                      )}
                    </div>
                    <div style={{ flex: 1, fontSize: 14, fontWeight: isYourPick ? 700 : 600, letterSpacing: "-0.02em" }}>
                      {item.name}
                    </div>
                    {isYourPick && (
                      <div style={{
                        fontSize: 10, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase",
                        padding: "3px 9px", borderRadius: 99,
                        background: "rgba(99,102,241,0.15)",
                        border: "1px solid rgba(99,102,241,0.3)",
                        color: "var(--accent)",
                      }}>
                        Your pick
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div style={{ padding: "20px 14px", fontSize: 13, color: "var(--muted)" }}>
                No community data yet — be the first to vote!
              </div>
            )}
          </div>

          <BracketTree state={state} itemMap={itemMap} />

          <div style={{ display: "flex", gap: 10 }}>
            <a
              href={`/categories/${categorySlug}`}
              style={{
                flex: 1, textAlign: "center",
                fontSize: 13, fontWeight: 600, padding: "11px 0", borderRadius: 12,
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "rgba(255,255,255,0.5)",
                textDecoration: "none",
              }}
            >
              Rankings
            </a>
          </div>
        </div>

        {showSharePopup && createPortal(
          <div style={{
            position: "fixed", inset: 0, zIndex: 1000,
            display: "flex", alignItems: "center", justifyContent: "center",
            background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)",
          }} onClick={() => setShowSharePopup(false)}>
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
                onClick={() => {
                  trackEvent("share_whatsapp", { category_slug: categorySlug, category_name: categoryName });
                  setShowSharePopup(false);
                }}
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
            {roundLabels[state.currentRound - 1]} — Match {matchInRound} of {totalInRound}
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