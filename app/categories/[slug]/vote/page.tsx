import { notFound } from "next/navigation";
import { getOrCreateSession } from "@/app/actions";
import VoteClient from "@/components/vote-client";
import { db } from "@/lib/db";

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

  const { bracketState } = await getOrCreateSession(slug);

  const itemMap = Object.fromEntries(category.items.map((i) => [i.id, i]));

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
          </div>
        </div>

        <VoteClient
          categoryId={category.id}
          categorySlug={slug}
          initialBracketState={bracketState}
          itemMap={itemMap}
        />
      </div>
    </main>
  );
}
