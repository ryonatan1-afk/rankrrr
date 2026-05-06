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

  const { bracketState, session } = await getOrCreateSession(slug, part as 1 | 2);

  const itemMap = Object.fromEntries(category.items.map((i) => [i.id, i]));

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
          <div>
            <span className="mr-2">{category.emoji}</span>
            <span className="font-semibold tracking-tight">{category.name}</span>
            {part === 2 && (
              <span style={{ marginLeft: 10, fontSize: 11, fontWeight: 700, color: "#818CF8", letterSpacing: "0.08em" }}>
                PART 2
              </span>
            )}
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
        />
      </div>
    </main>
  );
}
