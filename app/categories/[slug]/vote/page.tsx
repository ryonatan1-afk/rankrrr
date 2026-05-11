import { notFound } from "next/navigation";
import { getOrCreateSession } from "@/app/actions";
import VoteClient from "@/components/vote-client";
import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function VotePage({ params }: Props) {
  const { slug } = await params;

  const category = await db.category.findUnique({
    where: { slug },
    include: { items: { orderBy: { createdAt: "asc" } } },
  });
  if (!category) notFound();

  const { userId } = await auth();

  const [{ bracketState }, votes, userStats] = await Promise.all([
    getOrCreateSession(slug),
    db.vote.findMany({
      where: { categoryId: category.id },
      select: { itemAId: true, itemBId: true, winnerId: true },
    }),
    userId
      ? db.user.findUnique({ where: { id: userId }, select: { streak: true, totalCompleted: true } })
      : Promise.resolve(null),
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

  return (
    <main className="flex-1 px-4 py-8">
      <div className="min-w-0 flex flex-col gap-6" style={{ maxWidth: 672, margin: "0 auto" }}>
        {/* Header */}
        <div className="flex items-center gap-3">
          <span className="font-semibold tracking-tight">{category.name}</span>
        </div>

        <VoteClient
          categoryId={category.id}
          categorySlug={slug}
          categoryName={category.name}
          initialBracketState={bracketState}
          itemMap={itemMap}
          showImages={category.showImages}
          crowdData={crowdData}
          streak={userStats?.streak ?? 0}
          totalCompleted={userStats?.totalCompleted ?? 0}
        />
      </div>
    </main>
  );
}
