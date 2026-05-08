import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { RedoButton } from "@/components/redo-button";

export const dynamic = "force-dynamic";

function getInitial(name: string): string {
  return name.trim()[0]?.toUpperCase() ?? "?";
}

export default async function CategoriesPage() {
  const { userId } = await auth();

  const [categories, sessions] = await Promise.all([
    db.category.findMany({
      where: { status: "ACTIVE" },
      include: { _count: { select: { votes: true, items: true } } },
      orderBy: { createdAt: "asc" },
    }),
    userId
      ? db.userSession.findMany({
          where: { userId },
          select: { categoryId: true, part: true, bracketState: true },
        })
      : Promise.resolve([]),
  ]);

  const sessionMap = new Map(sessions.map((s) => [s.categoryId, s]));

  return (
    <main className="flex-1 flex flex-col items-center px-4 py-10">
      <div className="w-full max-w-2xl flex flex-col gap-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Categories</h1>
            <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>
              Pick one and start ranking.
            </p>
          </div>
          <Link
            href="/categories/new"
            className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all"
            style={{
              background: "rgba(99,102,241,0.15)",
              border: "1px solid rgba(99,102,241,0.4)",
              color: "#818CF8",
            }}
          >
            ✨ New
          </Link>
        </div>

        <div className="flex flex-col gap-3">
          {categories.map((cat) => {
            const session = sessionMap.get(cat.id);
            const totalMatchups = 7;
            const done = session
              ? (session.bracketState as any)?.rounds
                  ?.flatMap((r: any) => r.matchups)
                  ?.filter((m: any) => m.winnerId !== null).length ?? 0
              : 0;
            const pct = totalMatchups > 0 ? Math.round((done / totalMatchups) * 100) : 0;
            const isComplete = done >= totalMatchups;

            return (
              <div
                key={cat.id}
                className="flex items-center justify-between p-4 rounded-2xl transition-all"
                style={{
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                }}
              >
                <div className="flex items-center gap-4">
                  {/* Progress ring with initial */}
                  <div className="relative w-12 h-12 flex-shrink-0">
                    <svg className="w-12 h-12 -rotate-90" viewBox="0 0 48 48">
                      <circle cx="24" cy="24" r="20" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="2.5" />
                      <circle
                        cx="24" cy="24" r="20" fill="none"
                        stroke={isComplete ? "var(--green)" : "var(--accent)"}
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeDasharray={`${2 * Math.PI * 20}`}
                        strokeDashoffset={`${2 * Math.PI * 20 * (1 - pct / 100)}`}
                        style={{ transition: "stroke-dashoffset 0.4s ease" }}
                      />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center" style={{
                      fontSize: isComplete ? 16 : 13,
                      fontWeight: 700,
                      color: isComplete ? "var(--green)" : "rgba(255,255,255,0.5)",
                    }}>
                      {isComplete ? "✓" : getInitial(cat.name)}
                    </span>
                  </div>

                  <div>
                    <div className="font-semibold tracking-tight">{cat.name}</div>
                    <div className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
                      {isComplete
                        ? "Complete"
                        : done > 0
                        ? `${done} / ${totalMatchups} votes`
                        : `${cat._count.items} items · ${cat._count.votes} votes`}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    href={`/categories/${cat.slug}/leaderboard`}
                    className="min-h-[44px] flex items-center px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                    style={{
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      color: "var(--muted)",
                    }}
                  >
                    Rankings
                  </Link>
                  {isComplete ? (
                    <RedoButton slug={cat.slug} />
                  ) : (
                    <Link
                      href={`/categories/${cat.slug}/vote`}
                      className="min-h-[44px] flex items-center px-4 py-1.5 rounded-lg text-xs font-semibold transition-all"
                      style={{
                        background: "var(--accent)",
                        color: "#fff",
                        boxShadow: "0 4px 16px var(--accent-glow)",
                        textDecoration: "none",
                      }}
                    >
                      {done > 0 ? "Continue →" : "Vote →"}
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}
