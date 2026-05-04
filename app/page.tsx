import Link from "next/link";
import { db } from "@/lib/db";
import { CategoryLink } from "@/components/category-link";

export const dynamic = "force-dynamic";

export default async function Home() {
  const categories = await db.category.findMany({
    where: { status: "ACTIVE" },
    include: { _count: { select: { votes: true } } },
    orderBy: { createdAt: "asc" },
    take: 3,
  });

  return (
    <main className="flex-1 flex flex-col items-center justify-center px-4 py-16 relative">
      {/* Animated background orbs */}
      <div style={{ position: "fixed", inset: 0, zIndex: 0, overflow: "hidden", pointerEvents: "none" }}>
        <div style={{ position: "absolute", width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle, rgba(99,102,241,0.18) 0%, transparent 70%)", top: "-100px", left: "-100px", animation: "orb1 18s ease-in-out infinite", filter: "blur(40px)" }} />
        <div style={{ position: "absolute", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(139,92,246,0.14) 0%, transparent 70%)", bottom: "-80px", right: "-80px", animation: "orb2 22s ease-in-out infinite", filter: "blur(50px)" }} />
        <div style={{ position: "absolute", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(52,211,153,0.08) 0%, transparent 70%)", top: "40%", right: "20%", animation: "orb3 28s ease-in-out infinite", filter: "blur(60px)" }} />
      </div>

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
              fontSize: 72, fontWeight: 800, letterSpacing: "-0.06em", lineHeight: 0.95,
              background: "linear-gradient(135deg, #fff 40%, rgba(255,255,255,0.5))",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}>
              Rankr
            </h1>
            <p style={{ fontSize: 17, color: "rgba(255,255,255,0.45)", marginTop: 14, lineHeight: 1.6 }}>
              Pick your favourite in 1v1 matchups.<br />See what the crowd really thinks.
            </p>
          </div>
        </div>

        {/* Features */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, width: "100%" }}>
          {[
            { icon: "⚔️", title: "1v1 Brackets", desc: "7 votes, clean tournament." },
            { icon: "📊", title: "Crowd Rankings", desc: "Aggregate of all voters." },
            { icon: "✨", title: "AI Categories", desc: "Generate any topic instantly." },
          ].map((f) => (
            <div key={f.title} style={{
              background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: 16, padding: "16px 14px",
            }}>
              <div style={{ fontSize: 22, marginBottom: 8 }}>{f.icon}</div>
              <div style={{ fontSize: 12.5, fontWeight: 700 }}>{f.title}</div>
              <div style={{ fontSize: 11.5, color: "rgba(255,255,255,0.35)", marginTop: 3 }}>{f.desc}</div>
            </div>
          ))}
        </div>

        {/* Category list */}
        <div style={{
          width: "100%", background: "rgba(255,255,255,0.025)",
          border: "1px solid rgba(255,255,255,0.07)", borderRadius: 22, padding: "20px 18px",
          display: "flex", flexDirection: "column", gap: 10,
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.25)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 4 }}>
            Start ranking
          </div>
          {categories.map((cat) => (
            <CategoryLink
              key={cat.id}
              href={`/categories/${cat.slug}/vote`}
              emoji={cat.emoji ?? ""}
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
                <div style={{ fontSize: 11.5, color: "rgba(255,255,255,0.25)", marginTop: 2 }}>Type any topic — Claude builds it</div>
              </div>
            </div>
            <span style={{ fontSize: 15, color: "#818CF8" }}>→</span>
          </Link>
        </div>

        <Link href="/categories" style={{ fontSize: 13, color: "var(--muted)", textDecoration: "none" }}>
          Browse all categories →
        </Link>
      </div>
    </main>
  );
}
