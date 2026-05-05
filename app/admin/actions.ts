"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";

async function requireAdmin() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user || (user.role !== "ADMIN" && user.role !== "SUPERADMIN")) {
    throw new Error("Forbidden");
  }
  return user;
}

export async function updateCategoryStatus(id: string, status: "ACTIVE" | "HIDDEN" | "DELETED") {
  await requireAdmin();
  await db.category.update({ where: { id }, data: { status } });
  revalidatePath("/admin");
  revalidatePath("/categories");
}

export async function updateCategoryMeta(id: string, name: string, emoji: string) {
  await requireAdmin();
  await db.category.update({ where: { id }, data: { name, emoji } });
  revalidatePath("/admin");
  revalidatePath("/categories");
}
