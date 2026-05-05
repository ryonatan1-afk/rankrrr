import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { BracketTree } from "@/components/bracket-tree";
import type { BracketState } from "@/lib/bracket";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function BracketPage({ params }: Props) {
  const { slug } = await params;
  const { userId } = await auth();

  const category = await db.category.findUnique({
    where: { slug },
    include: { items: { orderBy: { createdAt: "asc" } } },
  });
  if (!category) notFound();

  const session = userId
    ? await db.userSession.findUnique({
        where: { userId_categoryId: { userId, categoryId: category.id } },
      })
    : null;

  const itemMap = Object.fromEntries(
    category.items.map((item) => [item.id, item])
  );

  const bracketState = session?.bracketState as BracketState | null;

  return (
    <main className="flex-1 flex flex-col items-center px-4 py-8">
      <div className="w-full max-w-3xl flex flex-col gap-6">

        {/* Header */}
        <div className="flex items-center gap-3">
          <Link
            href={`/categories/${slug}/leaderboard`}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg"
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "var(--muted)",
            }}
          >
            ← Rankings
          </Link>
          <div>
            <span className="mr-2">{category.emoji}</span>
            <span className="font-semibold tracking-tight">{category.name}</span>
          </div>
        </div>

        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.04em", marginBottom: 4 }}>
            My Bracket
          </h1>
          <p style={{ fontSize: 13, color: "var(--muted)" }}>
            Your personal tournament path for this category.
          </p>
        </div>

        {/* Bracket or prompt */}
        {bracketState ? (
          <div style={{
            background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 16, padding: "20px 16px",
          }}>
            <BracketTree state={bracketState} itemMap={itemMap} />
          </div>
        ) : (
          <div style={{
            background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 16, padding: "40px 24px",
            display: "flex", flexDirection: "column", alignItems: "center", gap: 12, textAlign: "center",
          }}>
            <span style={{ fontSize: 36 }}>🎯</span>
            <div style={{ fontSize: 16, fontWeight: 600 }}>No bracket yet</div>
            <div style={{ fontSize: 13, color: "var(--muted)", maxWidth: 280, lineHeight: 1.6 }}>
              {userId
                ? "You haven't voted in this category yet. Start voting to build your bracket."
                : "Sign in and vote to see your personal bracket."}
            </div>
            <Link
              href={`/categories/${slug}/vote`}
              style={{
                marginTop: 8,
                background: "var(--accent)", color: "#fff", borderRadius: 10,
                padding: "10px 24px", fontSize: 13, fontWeight: 700,
                boxShadow: "0 4px 16px var(--accent-glow)", textDecoration: "none",
              }}
            >
              {userId ? "Start Voting →" : "Sign in to vote →"}
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
