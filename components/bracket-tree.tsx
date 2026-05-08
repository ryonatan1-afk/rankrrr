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
    return <div style={{ padding: "8px 12px", fontSize: 11, color: "rgba(255,255,255,0.12)" }}>TBD</div>;
  }

  return (
    <div style={{
      display: "flex", alignItems: "center", padding: "9px 12px",
      background: isWinner ? "rgba(52,211,153,0.08)" : "transparent",
      opacity: isLoser ? 0.28 : 1, transition: "opacity 0.2s",
      position: "relative",
    }}>
      {decided && (
        <span style={{ position:"absolute", width:1, height:1, padding:0, margin:-1, overflow:"hidden", clip:"rect(0,0,0,0)", whiteSpace:"nowrap", borderWidth:0 }}>
          {isWinner ? "Winner: " : "Eliminated: "}
        </span>
      )}
      <span style={{
        fontSize: 12, lineHeight: 1.2, fontWeight: isWinner ? 700 : 500,
        color: isWinner ? "var(--green)" : "rgba(255,255,255,0.75)",
        maxWidth: 100, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        display: "block",
      }}>
        {item.name}
      </span>
    </div>
  );
}

function MatchupBlock({ matchup, itemMap }: { matchup: BracketMatchup; itemMap: Record<string, Item> }) {
  return (
    <div style={{
      background: "var(--surface)", border: "1px solid var(--border)",
      borderRadius: 10, overflow: "hidden", width: 130, flexShrink: 0,
    }}>
      <Slot itemId={matchup.itemAId} winnerId={matchup.winnerId} itemMap={itemMap} />
      <div style={{ height: 1, background: "rgba(255,255,255,0.05)" }} />
      <Slot itemId={matchup.itemBId} winnerId={matchup.winnerId} itemMap={itemMap} />
    </div>
  );
}

function Connector() {
  const line = "1px solid rgba(255,255,255,0.12)";
  return (
    <div style={{ width: 24, alignSelf: "stretch", position: "relative", flexShrink: 0 }}>
      <div style={{
        position: "absolute", top: "25%", bottom: "50%", left: 0, right: 0,
        borderTop: line, borderRight: line, borderTopRightRadius: 3,
      }} />
      <div style={{
        position: "absolute", top: "50%", bottom: "25%", left: 0, right: 0,
        borderBottom: line, borderRight: line, borderBottomRightRadius: 3,
      }} />
      <div style={{ position: "absolute", top: "50%", left: "50%", right: 0, borderTop: line }} />
    </div>
  );
}

const LABEL_H = 22;

function RoundLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      height: LABEL_H, display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
      color: "rgba(255,255,255,0.25)", flexShrink: 0,
    }}>
      {children}
    </div>
  );
}

// Vertical compact view for small screens
function VerticalBracket({ state, itemMap }: BracketTreeProps) {
  const roundNames = ["Quarter-finals", "Semi-finals", "Final"];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {state.rounds.map((round, ri) => (
        <div key={ri}>
          <div style={{
            fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
            color: "rgba(255,255,255,0.25)", marginBottom: 8,
          }}>
            {roundNames[ri]}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {round.matchups.map((m, mi) => {
              const a = itemMap[m.itemAId];
              const b = itemMap[m.itemBId];
              if (!a && !b) return null;
              return (
                <div
                  key={mi}
                  aria-label={
                    m.winnerId
                      ? `${itemMap[m.winnerId]?.name ?? "TBD"} beat ${m.winnerId === m.itemAId ? (b?.name ?? "TBD") : (a?.name ?? "TBD")}`
                      : `${a?.name ?? "TBD"} vs ${b?.name ?? "TBD"}`
                  }
                  style={{
                    display: "flex", alignItems: "center", gap: 8,
                    background: "var(--surface)",
                    border: "1px solid rgba(255,255,255,0.06)",
                    borderRadius: 8, padding: "8px 12px", fontSize: 12,
                  }}
                >
                  <span style={{
                    fontWeight: m.winnerId === m.itemAId ? 700 : 500,
                    color: m.winnerId === m.itemAId ? "var(--green)" : m.winnerId ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.7)",
                    flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}>
                    {a?.name ?? "TBD"}
                  </span>
                  <span style={{ fontSize: 10, color: "rgba(255,255,255,0.2)", flexShrink: 0 }}>vs</span>
                  <span style={{
                    fontWeight: m.winnerId === m.itemBId ? 700 : 500,
                    color: m.winnerId === m.itemBId ? "var(--green)" : m.winnerId ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.7)",
                    flex: 1, textAlign: "right", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}>
                    {b?.name ?? "TBD"}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

export function BracketTree({ state, itemMap }: BracketTreeProps) {
  const r1 = state.rounds[0].matchups;
  const r2 = state.rounds[1].matchups;
  const r3 = state.rounds[2].matchups;
  const champion = r3[0].winnerId ? itemMap[r3[0].winnerId] : null;

  return (
    <>
      <style>{`
        .bracket-desktop { display: flex; }
        .bracket-mobile  { display: none; }
        @media (max-width: 620px) {
          .bracket-desktop { display: none; }
          .bracket-mobile  { display: block; }
        }
      `}</style>

      {/* Desktop: horizontal bracket */}
      <div className="bracket-desktop" style={{ overflowX: "auto", paddingBottom: 4 }}>
        <div style={{ display: "flex", alignItems: "stretch", minHeight: 280 }}>

          {/* QF */}
          <div style={{ display: "flex", flexDirection: "column" }}>
            <RoundLabel>QF</RoundLabel>
            <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
              {r1.map((m, i) => (
                <div key={i} style={{ flex: 1, display: "flex", alignItems: "center" }}>
                  <MatchupBlock matchup={m} itemMap={itemMap} />
                </div>
              ))}
            </div>
          </div>

          {/* QF → SF connectors */}
          <div style={{ display: "flex", flexDirection: "column", alignSelf: "stretch" }}>
            <div style={{ height: LABEL_H, flexShrink: 0 }} />
            <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
              <Connector />
              <Connector />
            </div>
          </div>

          {/* SF */}
          <div style={{ display: "flex", flexDirection: "column" }}>
            <RoundLabel>SF</RoundLabel>
            <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
              {r2.map((m, i) => (
                <div key={i} style={{ flex: 1, display: "flex", alignItems: "center" }}>
                  <MatchupBlock matchup={m} itemMap={itemMap} />
                </div>
              ))}
            </div>
          </div>

          {/* SF → Final connector */}
          <div style={{ display: "flex", flexDirection: "column", alignSelf: "stretch" }}>
            <div style={{ height: LABEL_H, flexShrink: 0 }} />
            <Connector />
          </div>

          {/* Final */}
          <div style={{ display: "flex", flexDirection: "column" }}>
            <RoundLabel>Final</RoundLabel>
            <div style={{ flex: 1, display: "flex", alignItems: "center" }}>
              <MatchupBlock matchup={r3[0]} itemMap={itemMap} />
            </div>
          </div>

          {/* Arrow to champion */}
          {champion && (
            <div style={{
              width: 16, alignSelf: "center", marginTop: LABEL_H,
              borderTop: "1px solid rgba(99,102,241,0.45)", flexShrink: 0,
            }} />
          )}

          {/* Champion */}
          {champion && (
            <div style={{ display: "flex", flexDirection: "column" }}>
              <RoundLabel>🏆</RoundLabel>
              <div style={{ flex: 1, display: "flex", alignItems: "center" }}>
                <div style={{
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
                  background: "rgba(52,211,153,0.07)", border: "1px solid rgba(52,211,153,0.25)",
                  borderRadius: 12, padding: "14px 16px", flexShrink: 0, minWidth: 80,
                }}>
                  <span style={{
                    fontSize: 12, fontWeight: 700, color: "var(--green)",
                    maxWidth: 90, textAlign: "center", lineHeight: 1.3,
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}>
                    {champion.name}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile: vertical summary */}
      <div className="bracket-mobile">
        <VerticalBracket state={state} itemMap={itemMap} />
      </div>
    </>
  );
}
