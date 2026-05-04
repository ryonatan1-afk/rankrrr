"use server";

import { auth, currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { applyVote, generateBracket, type BracketState } from "@/lib/bracket";
import { generateCategory, type GeneratedCategory } from "@/lib/ai/generate-category";

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
  round: number
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
    where: { userId_categoryId: { userId: user.id, categoryId } },
  });

  if (!session) throw new Error("No session found");

  const state = session.bracketState as unknown as BracketState;
  const nextState = applyVote(state, winnerId, loserId);

  await db.userSession.update({
    where: { userId_categoryId: { userId: user.id, categoryId } },
    data: {
      bracketState: nextState as any,
      currentRound: nextState.currentRound,
    },
  });

  revalidatePath(`/categories/${categoryId}/leaderboard`);

  return nextState;
}

export async function generateCategoryAction(topic: string): Promise<GeneratedCategory> {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  const result = await generateCategory(topic);
  // Enforce exactly 8 items — pad or trim
  while (result.items.length < 8) result.items.push(result.items[result.items.length - 1]);
  result.items = result.items.slice(0, 8);
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

  await db.category.create({
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
  });

  return { slug };
}

export async function getOrCreateSession(categorySlug: string) {
  const user = await ensureUser();

  const category = await db.category.findUnique({
    where: { slug: categorySlug },
    include: { items: { orderBy: { createdAt: "asc" } } },
  });
  if (!category) throw new Error("Category not found");

  let session = await db.userSession.findUnique({
    where: { userId_categoryId: { userId: user.id, categoryId: category.id } },
  });

  if (!session) {
    const bracket = generateBracket(category.items.map((i) => i.id));
    session = await db.userSession.create({
      data: {
        userId: user.id,
        categoryId: category.id,
        currentRound: 1,
        bracketState: bracket as any,
      },
    });
  }

  return {
    session,
    category,
    bracketState: session.bracketState as unknown as BracketState,
  };
}
