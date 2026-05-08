import Link from "next/link";
import { db } from "@/lib/db";
import { CategoryLink } from "@/components/category-link";
import MatrixRain from "@/components/matrix-rain";
import OnboardingTip from "@/components/onboarding-tip";
import { VoteCounter } from "@/components/vote-counter";

export const dynamic = "force-dynamic";

async function getTrendingStat(): Promise<string | null> {
  try {
    type PairRow = { itemAId: string; itemBId: string; total: bigint; aWins: bigint };
    const pairs = await db.$queryRaw<PairRow[]>`
      SELECT "itemAId", "itemBId",
        COUNT(*) as total,
        SUM(CASE WHEN "winnerId" = "itemAId" THEN 1 ELSE 0 END)::int as "aWins"
      FROM "Vote"
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
  const [all, totalVotes, trendingStat] = await Promise.all([
    db.category.findMany({
      where: { status: "ACTIVE" },
      include: { _count: { select: { votes: true } } },
    }),
    db.vote.count(),
    getTrendingStat(),
  ]);
  const categories = all.sort(() => Math.random() - 0.5).slice(0, 3);

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

        <OnboardingTip />

        {/* Category list */}
        <div style={{
          width: "100%", background: "var(--surface)",
          border: "1px solid var(--border)", borderRadius: 22, padding: "20px 18px",
          display: "flex", flexDirection: "column", gap: 10,
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.25)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 4 }}>
            Start ranking
          </div>
          {categories.map((cat) => (
            <CategoryLink
              key={cat.id}
              href={`/categories/${cat.slug}/vote`}
              name={cat.name}
              voteCount={cat._count.votes}
            />
          ))}
          <Link
            href="/categories/new"
            style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "14px", borderRadius: 14,
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
        </div>

        <Link href="/categories" style={{ fontSize: 13, color: "var(--muted)", textDecoration: "none" }}>
          Browse all categories →
        </Link>

        <VoteCounter total={totalVotes} />
      </div>
    </main>
  );
}
