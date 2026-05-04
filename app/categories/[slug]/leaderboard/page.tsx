import Link from "next/link";
import { notFound } from "next/navigation";
import type { Item } from "@prisma/client";
import { db } from "@/lib/db";
import { computeElo } from "@/lib/elo";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ slug: string }>;
}

function Sparkline({ history, color }: { history: number[]; color: string }) {
  if (history.length < 2) return (
    <svg width={60} height={22} style={{ display: "block" }}>
      <line x1={0} y1={11} x2={60} y2={11} stroke="rgba(255,255,255,0.08)" strokeWidth={1.5} strokeDasharray="3,3" />
    </svg>
  );
  const min = Math.min(...history), max = Math.max(...history);
  const range = max - min || 1;
  const pts = history.map((v, i) => {
    const x = (i / (history.length - 1)) * 60;
    const y = 22 - ((v - min) / range) * 18 - 2;
    return `${x},${y}`;
  });
  return (
    <svg width={60} height={22} style={{ display: "block", overflow: "visible" }}>
      <polyline points={pts.join(" ")} fill="none" stroke={color} strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" />
      {pts.length > 0 && (() => {
        const last = pts[pts.length - 1].split(",");
        return <circle cx={parseFloat(last[0])} cy={parseFloat(last[1])} r={3} fill={color} />;
      })()}
    </svg>
  );
}

export default async function LeaderboardPage({ params }: Props) {
  const { slug } = await params;

  const category = await db.category.findUnique({
    where: { slug },
    include: { items: { orderBy: { createdAt: "asc" } } },
  });
  if (!category) notFound();

  const votes = await db.vote.findMany({
    where: { categoryId: category.id },
    orderBy: { createdAt: "asc" },
    select: { itemAId: true, itemBId: true, winnerId: true },
  });

  const eloMap = computeElo(votes);
  const totalVotes = votes.length;

  const ranked = category.items
    .map((item: Item) => ({
      ...item,
      score: eloMap.get(item.id) ?? { itemId: item.id, elo: 1200, wins: 0, losses: 0, eloHistory: [1200] },
    }))
    .sort((a, b) => b.score.elo - a.score.elo);

  const medals = ["🥇", "🥈", "🥉"];

  return (
    <main className="flex-1 flex flex-col items-center px-4 py-8">
      <div className="w-full max-w-2xl flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/categories"
              className="text-xs font-semibold px-3 py-1.5 rounded-lg"
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "var(--muted)",
              }}
            >
              ← Back
            </Link>
            <div>
              <span className="mr-2">{category.emoji}</span>
              <span className="font-semibold">{category.name}</span>
            </div>
          </div>
          <Link
            href={`/categories/${slug}/vote`}
            style={{
              background: "var(--accent)", color: "#fff", borderRadius: 10,
              padding: "8px 18px", fontSize: 13, fontWeight: 700,
              boxShadow: "0 4px 16px var(--accent-glow)", textDecoration: "none",
            }}
          >
            Vote →
          </Link>
        </div>

        {/* Stats */}
        <div style={{
          background: "var(--surface)", border: "1px solid var(--border)",
          borderRadius: 16, padding: "16px 20px",
          display: "flex", gap: 24,
        }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 700 }}>{totalVotes}</div>
            <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>Total votes</div>
          </div>
          <div>
            <div style={{ fontSize: 22, fontWeight: 700 }}>{category.items.length}</div>
            <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>Items</div>
          </div>
        </div>

        {/* Win rate bar chart (top 5) */}
        {totalVotes > 0 && (
          <div style={{
            background: "var(--surface)", border: "1px solid var(--border)",
            borderRadius: 16, padding: "16px 18px",
            display: "flex", flexDirection: "column", gap: 10,
          }}>
            <div style={{ fontSize: 10.5, color: "rgba(255,255,255,0.25)", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 2 }}>
              Win Rate
            </div>
            {ranked.slice(0, 5).map((item, i) => {
              const { wins, losses } = item.score;
              const wr = wins + losses > 0 ? (wins / (wins + losses)) * 100 : 0;
              return (
                <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 18, fontSize: 11, color: "rgba(255,255,255,0.25)", fontWeight: 700, textAlign: "right" }}>{i + 1}</div>
                  <span style={{ fontSize: 15, width: 22 }}>{item.emoji}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ height: 5, borderRadius: 99, background: "rgba(255,255,255,0.05)", overflow: "hidden" }}>
                      <div style={{
                        height: "100%", width: `${Math.max(wr, 2)}%`,
                        background: i === 0 ? "linear-gradient(90deg, var(--accent), #34D399)" : "rgba(99,102,241,0.35)",
                        borderRadius: 99, transition: "width 0.5s ease",
                        boxShadow: i === 0 ? "0 0 8px var(--accent-glow)" : "none",
                      }} />
                    </div>
                  </div>
                  <div style={{ fontSize: 11.5, fontWeight: 700, color: "rgba(255,255,255,0.55)", width: 34, textAlign: "right" }}>
                    {wins + losses > 0 ? `${Math.round(wr)}%` : "—"}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Full ranked list */}
        <div style={{
          background: "var(--surface)", border: "1px solid var(--border)",
          borderRadius: 16, padding: 6,
          display: "flex", flexDirection: "column", gap: 2,
        }}>
          {ranked.map((item, i) => {
            const { wins, losses, elo, eloHistory } = item.score;
            const wr = wins + losses > 0 ? (wins / (wins + losses)) * 100 : 0;
            const delta = eloHistory.length >= 2 ? eloHistory[eloHistory.length - 1] - eloHistory[eloHistory.length - 2] : 0;
            const isTop = i < 3;

            return (
              <div
                key={item.id}
                style={{
                  display: "flex", alignItems: "center", gap: 12,
                  padding: "12px 14px", borderRadius: 12,
                  background: i % 2 === 0 ? "rgba(255,255,255,0.015)" : "transparent",
                  animation: "fadeup 0.35s ease forwards",
                  animationDelay: `${i * 0.04}s`,
                  opacity: 0,
                }}
              >
                <div style={{ width: 28, flexShrink: 0, display: "flex", justifyContent: "center" }}>
                  {medals[i] ? (
                    <span style={{ fontSize: 18 }}>{medals[i]}</span>
                  ) : (
                    <span style={{ width: 24, height: 24, borderRadius: "50%", background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.25)", fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid rgba(255,255,255,0.06)" }}>
                      {i + 1}
                    </span>
                  )}
                </div>

                <div style={{
                  width: 38, height: 38, flexShrink: 0, borderRadius: 10,
                  background: `linear-gradient(135deg, ${item.color ?? "#6366F1"}33, ${item.color ?? "#6366F1"}11)`,
                  border: `1.5px solid ${item.color ?? "#6366F1"}33`,
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18,
                }}>{item.emoji}</div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 650, letterSpacing: "-0.02em", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {item.name}
                  </div>
                  <div style={{ fontSize: 11.5, color: "rgba(255,255,255,0.3)", marginTop: 2, display: "flex", gap: 8 }}>
                    <span style={{ color: "#34D399", fontWeight: 600 }}>{wins}W</span>
                    <span>/</span>
                    <span style={{ color: "#F87171", fontWeight: 600 }}>{losses}L</span>
                    {wins + losses > 0 && <span>· {Math.round(wr)}% wr</span>}
                  </div>
                </div>

                <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 3 }}>
                  <Sparkline history={eloHistory} color={isTop ? "#818CF8" : "rgba(255,255,255,0.2)"} />
                  <div style={{ fontSize: 9.5, color: "rgba(255,255,255,0.2)", letterSpacing: "0.04em" }}>momentum</div>
                </div>

                <div style={{ flexShrink: 0, textAlign: "right", minWidth: 52, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                  <span style={{ fontSize: 15, fontWeight: 700, letterSpacing: "-0.03em" }}>
                    {Math.round(elo)}
                  </span>
                  {delta !== 0 && (
                    <span style={{
                      fontSize: 10, fontWeight: 700,
                      color: delta > 0 ? "#34D399" : "#F87171",
                      background: delta > 0 ? "rgba(52,211,153,0.12)" : "rgba(248,113,113,0.12)",
                      borderRadius: 6, padding: "2px 7px",
                      border: `1px solid ${delta > 0 ? "rgba(52,211,153,0.2)" : "rgba(248,113,113,0.2)"}`,
                    }}>
                      {delta > 0 ? "▲" : "▼"} {Math.abs(Math.round(delta))}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {totalVotes === 0 && (
          <div style={{ textAlign: "center", padding: "40px 20px", color: "var(--muted)" }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>📊</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: "#fff" }}>No votes yet</div>
            <div style={{ fontSize: 13, marginTop: 6 }}>Be the first to vote in this category.</div>
          </div>
        )}
      </div>
    </main>
  );
}
