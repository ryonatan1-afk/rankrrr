"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import Anthropic from "@anthropic-ai/sdk";
import { generateImageSearchQuery } from "@/lib/ai/image-search-query";
import { fetchGoogleImage } from "@/lib/google-images";

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
  const imageUrl = await fetchGoogleImage(query);
  await db.item.update({ where: { id: itemId }, data: { imageUrl: imageUrl ?? null } });
  return { imageUrl: imageUrl ?? null };
}

export async function setItemImageUrl(itemId: string, imageUrl: string) {
  await requireAdmin();
  await db.item.update({ where: { id: itemId }, data: { imageUrl: imageUrl || null } });
}

export async function toggleCategoryImages(id: string, showImages: boolean) {
  await requireAdmin();
  await db.category.update({ where: { id }, data: { showImages } });
  revalidatePath("/admin");
}

export async function destroyCategory(id: string) {
  await requireAdmin();
  await db.category.delete({ where: { id } });
  revalidatePath("/admin");
  revalidatePath("/");
  revalidatePath("/categories");
}

export async function replaceItem(itemId: string): Promise<{ name: string; emoji: string }> {
  await requireAdmin();
  const item = await db.item.findUnique({
    where: { id: itemId },
    select: {
      name: true,
      category: {
        select: {
          name: true,
          items: { select: { name: true }, orderBy: { createdAt: "asc" } },
        },
      },
    },
  });
  if (!item) throw new Error("Item not found");
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("No API key configured");

  const existingNames = item.category.items.map((i) => i.name);
  const client = new Anthropic({ apiKey });
  const msg = await client.messages.create({
    model: "claude-haiku-4-5",
    max_tokens: 80,
    messages: [{
      role: "user",
      content: `Category: "${item.category.name}"\nReplace this item: "${item.name}"\nDo NOT use any of these (already in the list): ${existingNames.join(", ")}\n\nReply with ONLY valid JSON, no other text: {"name": "Replacement Name", "emoji": "ðŸŽµ"}`,
    }],
  });

  const raw = msg.content[0].type === "text" ? msg.content[0].text.trim() : "";
  const match = raw.match(/\{[^}]+\}/);
  if (!match) throw new Error("Invalid AI response");
  const parsed = JSON.parse(match[0]) as { name?: string; emoji?: string };
  if (!parsed.name) throw new Error("AI did not return a name");

  await db.item.update({
    where: { id: itemId },
    data: { name: parsed.name, emoji: parsed.emoji ?? null, imageUrl: null },
  });
  return { name: parsed.name, emoji: parsed.emoji ?? "" };
}

export async function updateFeaturedDate(id: string, featuredDate: string | null) {
  await requireAdmin();
  // Pin to UTC midnight so homepage lookup (also UTC midnight) always matches
  const date = featuredDate ? new Date(featuredDate + "T00:00:00.000Z") : null;
  await db.category.update({ where: { id }, data: { featuredDate: date } });
  revalidatePath("/admin");
  revalidatePath("/");
}


