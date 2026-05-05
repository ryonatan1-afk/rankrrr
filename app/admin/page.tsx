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

  const categories = await db.category.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { votes: true, items: true } },
      author: { select: { email: true } },
    },
  });

  return (
    <main className="flex-1 flex flex-col items-center px-4 py-8">
      <div className="w-full max-w-4xl flex flex-col gap-6">
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.04em", marginBottom: 4 }}>
            Admin
          </h1>
          <p style={{ fontSize: 13, color: "var(--muted)" }}>
            {categories.length} categories total
          </p>
        </div>
        <AdminClient categories={categories} />
      </div>
    </main>
  );
}
