import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import AdminClient from "./admin-client";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user || (user.role !== "ADMIN" && user.role !== "SUPERADMIN")) {
    redirect("/");
  }

  const todayUTC = new Date();
  todayUTC.setUTCHours(0, 0, 0, 0);

  const [categories, scheduled] = await Promise.all([
    db.category.findMany({
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, emoji: true, status: true, createdAt: true, featuredDate: true, showImages: true, _count: { select: { votes: true, items: true } }, author: { select: { email: true } } },
    }),
    db.category.findMany({
      where: { featuredDate: { gte: todayUTC }, status: { not: "DELETED" } },
      select: { id: true, name: true, emoji: true, featuredDate: true },
      orderBy: { featuredDate: "asc" },
      take: 14,
    }),
  ]);

  return (
    <main className="flex-1 px-5 py-8">
      <div className="min-w-0 flex flex-col gap-6" style={{ maxWidth: 896, margin: "0 auto" }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.04em", marginBottom: 4 }}>
            Admin
          </h1>
          <p style={{ fontSize: 13, color: "var(--muted)" }}>
            {categories.length} categories total
          </p>
        </div>

        {/* Upcoming schedule */}
        <div style={{
          background: "var(--surface)", border: "1px solid var(--border)",
          borderRadius: 14, padding: "16px 18px",
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.25)", marginBottom: 14 }}>
            📅 Upcoming Schedule
          </div>
          {scheduled.length === 0 ? (
            <p style={{ fontSize: 13, color: "var(--muted)" }}>No dailies scheduled. Use the date picker on any category row below.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {scheduled.map((cat) => {
                const d = new Date(cat.featuredDate!);
                const isToday = d.getTime() === todayUTC.getTime();
                const label = d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" });
                return (
                  <div key={cat.id} style={{
                    display: "flex", alignItems: "center", gap: 12,
                    padding: "8px 10px", borderRadius: 8,
                    background: isToday ? "rgba(99,102,241,0.08)" : "rgba(255,255,255,0.02)",
                    border: `1px solid ${isToday ? "rgba(99,102,241,0.25)" : "rgba(255,255,255,0.05)"}`,
                  }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: isToday ? "#818CF8" : "rgba(255,255,255,0.3)", width: 90, flexShrink: 0 }}>
                      {isToday ? "Today" : label}
                    </span>
                    <span style={{ fontSize: 16 }}>{cat.emoji ?? "🏆"}</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: isToday ? "#fff" : "rgba(255,255,255,0.6)" }}>{cat.name}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <AdminClient categories={categories} />
      </div>
    </main>
  );
}
