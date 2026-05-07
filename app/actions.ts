"use server";

import { auth, currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { db } from "@/lib/db";
import { applyVote, generateBracket, type BracketState } from "@/lib/bracket";
import { generateCategory, type GeneratedCategory } from "@/lib/ai/generate-category";
import { fetchWikipediaThumbnail } from "@/lib/wikipedia";

const ITEM_COLORS = ["#6366F1", "#EC4899", "#F59E0B", "#10B981", "#F97316", "#8B5CF6", "#06B6D4", "#EF4444"];

async function ensureUser() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  let user = await db.user.findUnique({ where: { id: userId } });
  if (!user) {
    const clerkUser = await currentUser();
    const email = clerkUser?.emailAddresses[0]?.emailAddress ?? `${userId}@unknown`;
    user = await db.user.create({ data: { id: userId, email } });
  }
  return user;
}

export async function submitVote(
  categoryId: string,
  winnerId: string,
  loserId: string,
  round: number,
  part: number = 1
) {
  const user = await ensureUser();

  // Upsert the vote (idempotent — re-submitting same pair is safe)
  await db.vote.upsert({
    where: { userId_itemAId_itemBId: { userId: user.id, itemAId: winnerId, itemBId: loserId } },
    create: { userId: user.id, categoryId, itemAId: winnerId, itemBId: loserId, winnerId, round },
    update: { winnerId, round },
  });

  // Load and update bracket state
  const session = await db.userSession.findUnique({
    where: { userId_categoryId_part: { userId: user.id, categoryId, part } },
  });

  if (!session) throw new Error("No session found");

  const state = session.bracketState as unknown as BracketState;
  const nextState = applyVote(state, winnerId, loserId);

  await db.userSession.update({
    where: { userId_categoryId_part: { userId: user.id, categoryId, part } },
    data: {
      bracketState: nextState as any,
      currentRound: nextState.currentRound,
    },
  });

  return nextState;
}

export async function generateCategoryAction(topic: string): Promise<GeneratedCategory> {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  const result = await generateCategory(topic);
  // Enforce exactly 16 items — pad or trim
  while (result.items.length < 16) result.items.push(result.items[result.items.length - 1]);
  result.items = result.items.slice(0, 16);
  return result;
}

export async function createCategoryAction(data: GeneratedCategory): Promise<{ slug: string }> {
  const user = await ensureUser();

  const baseSlug = data.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  const existing = await db.category.findUnique({ where: { slug: baseSlug } });
  const slug = existing ? `${baseSlug}-${Date.now()}` : baseSlug;

  const category = await db.category.create({
    data: {
      slug,
      name: data.name,
      emoji: data.emoji,
      description: data.description,
      authorId: user.id,
      status: "ACTIVE",
      items: {
        create: data.items.map((item, i) => ({
          name: item.name,
          emoji: item.emoji,
          description: item.description,
          color: ITEM_COLORS[i % ITEM_COLORS.length],
        })),
      },
    },
    include: { items: true },
  });

  after(async () => {
    await Promise.all(
      category.items.map(async (item) => {
        const imageUrl = await fetchWikipediaThumbnail(item.name, data.name);
        if (imageUrl) {
          await db.item.update({ where: { id: item.id }, data: { imageUrl } });
        }
      })
    );
  });

  return { slug };
}

export async function getOrCreateSession(categorySlug: string, part: 1 | 2 = 1) {
  const user = await ensureUser();

  const category = await db.category.findUnique({
    where: { slug: categorySlug },
    include: { items: { orderBy: { createdAt: "asc" } } },
  });
  if (!category) throw new Error("Category not found");

  let session = await db.userSession.findUnique({
    where: { userId_categoryId_part: { userId: user.id, categoryId: category.id, part } },
  });

  if (!session) {
    let itemIds: string[];

    if (part === 1) {
      const allIds = category.items.map((i: { id: string }) => i.id);
      // Fisher-Yates shuffle then take first 8
      const shuffled = [...allIds];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      itemIds = shuffled.slice(0, 8);
    } else {
      // Part 2: use items not in part 1
      const part1 = await db.userSession.findUnique({
        where: { userId_categoryId_part: { userId: user.id, categoryId: category.id, part: 1 } },
      });
      if (!part1) throw new Error("Complete Part 1 first");
      const used = new Set(part1.usedItemIds as string[]);
      itemIds = category.items
        .map((i: { id: string }) => i.id)
        .filter((id: string) => !used.has(id))
        .slice(0, 8);
      if (itemIds.length < 8) throw new Error("Not enough items for Part 2");
    }

    const bracket = generateBracket(itemIds);
    try {
      session = await db.userSession.create({
        data: {
          userId: user.id,
          categoryId: category.id,
          part,
          currentRound: 1,
          bracketState: bracket as any,
          usedItemIds: itemIds as any,
        },
      });
    } catch (e: any) {
      // P2002 = unique constraint — concurrent request already created it
      if (e?.code !== "P2002") throw e;
      session = await db.userSession.findUnique({
        where: { userId_categoryId_part: { userId: user.id, categoryId: category.id, part } },
      });
      if (!session) throw e;
    }
  }

  return {
    session,
    category,
    bracketState: session.bracketState as unknown as BracketState,
  };
}

export async function resetSessionAction(categorySlug: string): Promise<void> {
  const user = await ensureUser();

  const category = await db.category.findUnique({ where: { slug: categorySlug } });
  if (!category) throw new Error("Category not found");

  await db.userSession.deleteMany({
    where: { userId: user.id, categoryId: category.id },
  });

  revalidatePath("/categories");
}
