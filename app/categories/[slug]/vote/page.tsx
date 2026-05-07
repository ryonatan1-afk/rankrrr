import { notFound } from "next/navigation";
import { getOrCreateSession } from "@/app/actions";
import VoteClient from "@/components/vote-client";
import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { isBracketComplete } from "@/lib/bracket";
import type { BracketState } from "@/lib/bracket";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ part?: string }>;
}

export default async function VotePage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { part: partParam } = await searchParams;
  const part = partParam === "2" ? 2 : 1;

  const category = await db.category.findUnique({
    where: { slug },
    include: { items: { orderBy: { createdAt: "asc" } } },
  });
  if (!category) notFound();

  const [{ bracketState }, votes] = await Promise.all([
    getOrCreateSession(slug, part as 1 | 2),
    db.vote.findMany({
      where: { categoryId: category.id },
      select: { itemAId: true, itemBId: true, winnerId: true },
    }),
  ]);

  const itemMap = Object.fromEntries(category.items.map((i) => [i.id, i]));

  // Build crowd win-rate data from all votes
  const winMap = new Map<string, { wins: number; total: number }>();
  for (const item of category.items) winMap.set(item.id, { wins: 0, total: 0 });
  for (const vote of votes) {
    const a = winMap.get(vote.itemAId);
    const b = winMap.get(vote.itemBId);
    if (a) { a.total++; if (vote.winnerId === vote.itemAId) a.wins++; }
    if (b) { b.total++; if (vote.winnerId === vote.itemBId) b.wins++; }
  }
  const crowdData = category.items
    .map((item) => {
      const d = winMap.get(item.id)!;
      return { itemId: item.id, winRate: d.total > 0 ? (d.wins / d.total) * 100 : 0, totalVotes: d.total };
    })
    .filter((cd) => cd.totalVotes > 0)
    .sort((a, b) => b.winRate - a.winRate);

  // canStartPart2: part 1 bracket is done and part 2 doesn't exist yet
  let canStartPart2 = false;
  if (part === 1 && isBracketComplete(bracketState)) {
    const { userId } = await auth();
    if (userId) {
      const part2 = await db.userSession.findUnique({
        where: { userId_categoryId_part: { userId, categoryId: category.id, part: 2 } },
      });
      canStartPart2 = !part2;
    }
  }

  return (
    <main className="flex-1 flex flex-col items-center px-4 py-8">
      <div className="w-full max-w-2xl flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <a
            href="/categories"
            className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "var(--muted)",
            }}
          >
            ← Back
          </a>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span className="font-semibold tracking-tight">{category.name}</span>
            <span style={{
              fontSize: 10, fontWeight: 700, letterSpacing: "0.08em",
              color: part === 2 ? "#818CF8" : "rgba(255,255,255,0.3)",
              background: part === 2 ? "rgba(99,102,241,0.12)" : "rgba(255,255,255,0.04)",
              border: `1px solid ${part === 2 ? "rgba(99,102,241,0.25)" : "rgba(255,255,255,0.08)"}`,
              padding: "2px 8px", borderRadius: 99,
            }}>
              Bracket {part} of 2
            </span>
          </div>
        </div>

        <VoteClient
          categoryId={category.id}
          categorySlug={slug}
          categoryName={category.name}
          initialBracketState={bracketState}
          itemMap={itemMap}
          part={part}
          canStartPart2={canStartPart2}
          crowdData={crowdData}
        />
      </div>
    </main>
  );
}
