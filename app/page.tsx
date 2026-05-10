import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import MatrixRain from "@/components/matrix-rain";
import { VoteCounter } from "@/components/vote-counter";
import DailyCountdown from "@/components/daily-countdown";

export const dynamic = "force-dynamic";

async function getTrendingStat(): Promise<string | null> {
  try {
    type PairRow = { itemAId: string; itemBId: string; total: bigint; aWins: bigint };
    const pairs = await db.$queryRaw<PairRow[]>`
      SELECT "itemAId", "itemBId",
        COUNT(*) as total,
        SUM(CASE WHEN "winnerId" = "itemAId" THEN 1 ELSE 0 END)::int as "aWins"
      FROM votes
      GROUP BY "itemAId", "itemBId"
      HAVING COUNT(*) >= 5
      ORDER BY total DESC
      LIMIT 1
    `;
    if (!pairs.length) return null;

    const { itemAId, itemBId, total, aWins } = pairs[0];
    const totalN = Number(total);
    const aWinsN = Number(aWins);
    const bWinsN = totalN - aWinsN;

    const [itemA, itemB] = await Promise.all([
      db.item.findUnique({ where: { id: itemAId }, select: { name: true } }),
      db.item.findUnique({ where: { id: itemBId }, select: { name: true } }),
    ]);
    if (!itemA || !itemB) return null;

    const winnerName = aWinsN >= bWinsN ? itemA.name : itemB.name;
    const loserName = aWinsN >= bWinsN ? itemB.name : itemA.name;
    const pct = Math.round(Math.max(aWinsN, bWinsN) / totalN * 100);
    return `${pct}% prefer ${winnerName} over ${loserName}`;
  } catch {
    return null;
  }
}

export default async function Home() {
  const { userId } = await auth();

  const todayUTC = new Date();
  todayUTC.setUTCHours(0, 0, 0, 0);

  const [daily, totalVotes, trendingStat, userStats] = await Promise.all([
    db.category.findFirst({
      where: { status: "ACTIVE", featuredDate: todayUTC },
      include: { _count: { select: { votes: true } } },
    }),
    db.vote.count(),
    getTrendingStat(),
    userId
      ? db.user.findUnique({ where: { id: userId }, select: { streak: true, longestStreak: true, totalCompleted: true, role: true } })
      : Promise.resolve(null),
  ]);

  // Fallback: show most-recent active category if no daily is scheduled today
  const featured = daily ?? await db.category.findFirst({
    where: { status: "ACTIVE" },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { votes: true } } },
  });

  const todayLabel = todayUTC.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" });

  return (
    <main className="flex-1 flex flex-col items-center justify-center px-4 py-16 relative">
      <MatrixRain />

      <div className="relative z-10 w-full max-w-lg flex flex-col items-center gap-12">
        {/* Hero */}
        <div className="text-center flex flex-col items-center gap-6">
          <div style={{
            width: 72, height: 72, borderRadius: 20,
            background: "linear-gradient(135deg, #6366F1, #8B5CF6)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 34, boxShadow: "0 12px 48px rgba(99,102,241,0.5), 0 0 0 1px rgba(99,102,241,0.3)",
          }}>⚡</div>

          <div>
            <h1 style={{
              fontSize: "clamp(48px, 18vw, 72px)", fontWeight: 800, letterSpacing: "-0.06em", lineHeight: 0.95,
              color: "#fff",
            }}>
              Rankr
            </h1>
            <p style={{ fontSize: 17, color: "var(--muted)", marginTop: 14, lineHeight: 1.6 }}>
              Rank anything. Settle everything.
            </p>
            {trendingStat && (
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.28)", marginTop: 10, fontStyle: "italic" }}>
                Right now: {trendingStat}
              </p>
            )}
          </div>
        </div>

        {/* Daily Ranking card */}
        <div style={{ width: "100%" }}>
          {/* User stats row */}
          {userStats && (
            <div style={{
              display: "flex", justifyContent: "center", gap: 24, marginBottom: 10,
            }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: userStats.streak > 0 ? "#FBBF24" : "rgba(255,255,255,0.4)", lineHeight: 1 }}>
                  {userStats.streak > 0 ? `🔥 ${userStats.streak}` : "—"}
                </div>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", textTransform: "uppercase", letterSpacing: "0.08em", marginTop: 4 }}>
                  Day Streak
                </div>
              </div>
              <div style={{ width: 1, background: "rgba(255,255,255,0.06)", alignSelf: "stretch" }} />
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: userStats.totalCompleted > 0 ? "#fff" : "rgba(255,255,255,0.4)", lineHeight: 1 }}>
                  {userStats.totalCompleted || "—"}
                </div>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", textTransform: "uppercase", letterSpacing: "0.08em", marginTop: 4 }}>
                  Ranked
                </div>
              </div>
              {userStats.longestStreak > 1 && (
                <>
                  <div style={{ width: 1, background: "rgba(255,255,255,0.06)", alignSelf: "stretch" }} />
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 20, fontWeight: 800, color: "rgba(255,255,255,0.4)", lineHeight: 1 }}>
                      {userStats.longestStreak}
                    </div>
                    <div style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", textTransform: "uppercase", letterSpacing: "0.08em", marginTop: 4 }}>
                      Best Streak
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          <div style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 22, padding: "20px 20px",
            display: "flex", flexDirection: "column", gap: 14,
          }}>
            {/* Section label */}
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.25)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                📅 Daily Ranking
              </span>
              <span style={{ fontSize: 10, color: "rgba(255,255,255,0.2)" }}>·</span>
              <span style={{ fontSize: 10, color: "rgba(255,255,255,0.2)" }}>{todayLabel}</span>
            </div>

            {featured ? (
              <>
                {/* Category info */}
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <span style={{ fontSize: 36 }}>{featured.emoji ?? "🏆"}</span>
                  <div>
                    <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.03em", color: "#fff" }}>
                      {featured.name}
                    </div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.2)", marginTop: 4 }}>
                      {featured._count.votes} votes
                    </div>
                  </div>
                </div>

                {/* CTA */}
                <Link
                  href={`/categories/${featured.slug}/vote`}
                  style={{
                    display: "block", textAlign: "center",
                    background: "linear-gradient(135deg, #6366F1, #8B5CF6)", color: "#fff",
                    borderRadius: 14, padding: "14px 28px", fontSize: 15, fontWeight: 700,
                    boxShadow: "0 4px 24px rgba(99,102,241,0.45)", textDecoration: "none",
                  }}
                >
                  Vote Now →
                </Link>

                {daily ? (
                  <DailyCountdown />
                ) : (
                  <div style={{ textAlign: "center", fontSize: 12, color: "rgba(255,255,255,0.25)" }}>
                    Coming tomorrow!
                  </div>
                )}
              </>
            ) : (
              <div style={{ textAlign: "center", color: "var(--muted)", fontSize: 14, padding: "20px 0" }}>
                No categories yet. <Link href="/categories/new" style={{ color: "#818CF8" }}>Create one →</Link>
              </div>
            )}
          </div>
        </div>

        {/* Generate with AI */}
        <Link
          href="/categories/new"
          style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            width: "100%", padding: "14px", borderRadius: 14,
            border: "1px dashed rgba(99,102,241,0.35)",
            background: "transparent", textDecoration: "none", transition: "all 0.15s ease",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 22 }}>✨</span>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#818CF8", letterSpacing: "-0.02em" }}>Generate with AI</div>
              <div style={{ fontSize: 11.5, color: "rgba(255,255,255,0.25)", marginTop: 2 }}>Type any topic. Claude builds it.</div>
            </div>
          </div>
          <span style={{ fontSize: 15, color: "#818CF8" }}>→</span>
        </Link>

        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <Link href="/categories" style={{ fontSize: 13, color: "var(--muted)", textDecoration: "none" }}>
            Browse all past categories →
          </Link>
          {userStats && (userStats.role === "ADMIN" || userStats.role === "SUPERADMIN") && (
            <Link href="/admin" style={{
              fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.3)",
              textDecoration: "none", letterSpacing: "0.04em",
              padding: "4px 10px", borderRadius: 8,
              border: "1px solid rgba(255,255,255,0.08)",
              background: "rgba(255,255,255,0.03)",
            }}>
              ⚙ Admin
            </Link>
          )}
        </div>

        <VoteCounter total={totalVotes} />
      </div>
    </main>
  );
}
