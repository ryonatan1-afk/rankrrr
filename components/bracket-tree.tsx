"use client";
import type { BracketMatchup, BracketState } from "@/lib/bracket";

interface Item { id: string; name: string; emoji: string | null; }
export interface BracketTreeProps { state: BracketState; itemMap: Record<string, Item>; }

function Slot({ itemId, winnerId, itemMap }: {
  itemId: string;
  winnerId: string | null;
  itemMap: Record<string, Item>;
}) {
  const item = itemId ? itemMap[itemId] : null;
  const decided = winnerId !== null;
  const isWinner = decided && winnerId === itemId;
  const isLoser = decided && !isWinner;

  if (!item) {
    return <div style={{ padding: "8px 12px", fontSize: 12, color: "rgba(255,255,255,0.15)" }}>TBD</div>;
  }

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 8, padding: "9px 12px",
      background: isWinner ? "rgba(52,211,153,0.08)" : "transparent",
      opacity: isLoser ? 0.28 : 1, transition: "opacity 0.2s",
    }}>
      <span style={{ fontSize: 16, flexShrink: 0 }}>{item.emoji}</span>
      <span style={{
        fontSize: 13, lineHeight: 1.2, fontWeight: isWinner ? 700 : 500,
        color: isWinner ? "#34D399" : "rgba(255,255,255,0.8)",
        maxWidth: 110, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
      }}>
        {item.name}
      </span>
    </div>
  );
}

function MatchupCard({ matchup, itemMap }: { matchup: BracketMatchup; itemMap: Record<string, Item> }) {
  return (
    <div style={{
      background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)",
      borderRadius: 10, overflow: "hidden", width: 170, flexShrink: 0,
    }}>
      <Slot itemId={matchup.itemAId} winnerId={matchup.winnerId} itemMap={itemMap} />
      <div style={{ height: 1, background: "rgba(255,255,255,0.05)" }} />
      <Slot itemId={matchup.itemBId} winnerId={matchup.winnerId} itemMap={itemMap} />
    </div>
  );
}

// Bracket connector: draws the ⊢ shape connecting 2 inputs to 1 output.
// Works correctly when its container height = exactly 2× the height of one matchup slot.
function Connector() {
  const line = "1px solid rgba(255,255,255,0.12)";
  return (
    <div style={{ width: 28, alignSelf: "stretch", position: "relative", flexShrink: 0 }}>
      <div style={{
        position: "absolute", top: "25%", bottom: "50%", left: 0, right: 0,
        borderTop: line, borderRight: line, borderTopRightRadius: 3,
      }} />
      <div style={{
        position: "absolute", top: "50%", bottom: "25%", left: 0, right: 0,
        borderBottom: line, borderRight: line, borderBottomRightRadius: 3,
      }} />
      <div style={{
        position: "absolute", top: "50%", left: "50%", right: 0, borderTop: line,
      }} />
    </div>
  );
}

const LABEL_H = 22;

function RoundLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      height: LABEL_H, display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
      color: "rgba(255,255,255,0.28)", flexShrink: 0,
    }}>
      {children}
    </div>
  );
}

export function BracketTree({ state, itemMap }: BracketTreeProps) {
  const r1 = state.rounds[0].matchups; // 4 QF
  const r2 = state.rounds[1].matchups; // 2 SF
  const r3 = state.rounds[2].matchups; // 1 Final
  const champion = r3[0].winnerId ? itemMap[r3[0].winnerId] : null;

  return (
    <div style={{ overflowX: "auto", paddingBottom: 4 }}>
      <div style={{ display: "flex", alignItems: "stretch", minHeight: 320, minWidth: 680 }}>

        {/* QF: 4 equal-height slots */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <RoundLabel>QF</RoundLabel>
          <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
            {r1.map((m, i) => (
              <div key={i} style={{ flex: 1, display: "flex", alignItems: "center" }}>
                <MatchupCard matchup={m} itemMap={itemMap} />
              </div>
            ))}
          </div>
        </div>

        {/* QF→SF: 2 connectors, each spans 2 QF slots */}
        <div style={{ display: "flex", flexDirection: "column", alignSelf: "stretch" }}>
          <div style={{ height: LABEL_H, flexShrink: 0 }} />
          <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
            <Connector />
            <Connector />
          </div>
        </div>

        {/* SF: 2 equal-height slots */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <RoundLabel>SF</RoundLabel>
          <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
            {r2.map((m, i) => (
              <div key={i} style={{ flex: 1, display: "flex", alignItems: "center" }}>
                <MatchupCard matchup={m} itemMap={itemMap} />
              </div>
            ))}
          </div>
        </div>

        {/* SF→Final: 1 connector spanning full height */}
        <div style={{ display: "flex", flexDirection: "column", alignSelf: "stretch" }}>
          <div style={{ height: LABEL_H, flexShrink: 0 }} />
          <Connector />
        </div>

        {/* Final: 1 slot vertically centered */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <RoundLabel>Final</RoundLabel>
          <div style={{ flex: 1, display: "flex", alignItems: "center" }}>
            <MatchupCard matchup={r3[0]} itemMap={itemMap} />
          </div>
        </div>

        {/* Arrow to champion */}
        {champion && (
          <div style={{
            width: 20, alignSelf: "center", marginTop: LABEL_H,
            borderTop: "1px solid rgba(99,102,241,0.45)", flexShrink: 0,
          }} />
        )}

        {/* Champion */}
        {champion && (
          <div style={{ display: "flex", flexDirection: "column" }}>
            <RoundLabel>🏆</RoundLabel>
            <div style={{ flex: 1, display: "flex", alignItems: "center" }}>
              <div style={{
                display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
                background: "rgba(52,211,153,0.07)", border: "1px solid rgba(52,211,153,0.25)",
                borderRadius: 12, padding: "16px 18px", flexShrink: 0,
              }}>
                <span style={{ fontSize: 36 }}>{champion.emoji}</span>
                <span style={{
                  fontSize: 13, fontWeight: 700, color: "#34D399",
                  maxWidth: 100, textAlign: "center", lineHeight: 1.3,
                }}>
                  {champion.name}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
