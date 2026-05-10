"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { generateImageSearchQuery } from "@/lib/ai/image-search-query";
import { fetchWikipediaThumbnail } from "@/lib/wikipedia";

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

export async function getCategoryItems(categoryId: string) {
  await requireAdmin();
  return db.item.findMany({
    where: { categoryId },
    select: { id: true, name: true, emoji: true, imageUrl: true },
    orderBy: { createdAt: "asc" },
  });
}

export async function refreshItemImage(itemId: string) {
  await requireAdmin();
  const item = await db.item.findUnique({
    where: { id: itemId },
    select: { name: true, category: { select: { name: true } } },
  });
  if (!item) throw new Error("Item not found");
  const query = await generateImageSearchQuery(item.name, item.category.name);
  const imageUrl = await fetchWikipediaThumbnail(query);
  await db.item.update({ where: { id: itemId }, data: { imageUrl: imageUrl ?? null } });
  return { imageUrl: imageUrl ?? null };
}

export async function setItemImageUrl(itemId: string, imageUrl: string) {
  await requireAdmin();
  await db.item.update({ where: { id: itemId }, data: { imageUrl: imageUrl || null } });
}

export async function destroyCategory(id: string) {
  await requireAdmin();
  await db.category.delete({ where: { id } });
  revalidatePath("/admin");
  revalidatePath("/");
  revalidatePath("/categories");
}

export async function updateFeaturedDate(id: string, featuredDate: string | null) {
  await requireAdmin();
  // Pin to UTC midnight so homepage lookup (also UTC midnight) always matches
  const date = featuredDate ? new Date(featuredDate + "T00:00:00.000Z") : null;
  await db.category.update({ where: { id }, data: { featuredDate: date } });
  revalidatePath("/admin");
  revalidatePath("/");
}
