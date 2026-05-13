"use server";

import { auth, currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { after } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { db } from "@/lib/db";
import { applyVote, generateBracket, isBracketComplete, type BracketState } from "@/lib/bracket";
import { generateCategory, type GeneratedCategory } from "@/lib/ai/generate-category";
import { generateImageSearchQuery } from "@/lib/ai/image-search-query";
import { fetchBraveImage } from "@/lib/brave-images";

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
    where: { userId_categoryId_part: { userId: user.id, categoryId, part: 1 } },
  });

  if (!session) throw new Error("No session found");

  const state = session.bracketState as unknown as BracketState;
  const nextState = applyVote(state, winnerId, loserId);

  await db.userSession.update({
    where: { userId_categoryId_part: { userId: user.id, categoryId, part: 1 } },
    data: {
      bracketState: nextState as any,
      currentRound: nextState.currentRound,
    },
  });

  if (isBracketComplete(nextState)) {
    after(async () => { await recordCompletion(user.id, categoryId); });
  }

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

export async function suggestReplacementItem(
  categoryName: string,
  existingItemNames: string[],
  currentItemName: string,
): Promise<{ name: string; emoji: string; description: string }> {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("No API key configured");

  const client = new Anthropic({ apiKey });
  const msg = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 150,
    messages: [{
      role: "user",
      content: `Category: "${categoryName}"\nReplace this item: "${currentItemName}"\nDo NOT use any of these (already in the list): ${existingItemNames.join(", ")}\n\nReply with ONLY valid JSON, no other text: {"name": "Item Name", "emoji": "🎯", "description": "One short sentence about why it belongs in the category."}`,
    }],
  });

  const raw = msg.content[0].type === "text" ? msg.content[0].text.trim() : "";
  const match = raw.match(/\{[\s\S]*?\}/);
  if (!match) throw new Error("Invalid AI response");
  const parsed = JSON.parse(match[0]) as { name?: string; emoji?: string; description?: string };
  if (!parsed.name) throw new Error("AI did not return a name");
  return { name: parsed.name, emoji: parsed.emoji ?? "🎯", description: parsed.description ?? "" };
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
        const searchQuery = await generateImageSearchQuery(item.name, data.name);
        const imageUrl = await fetchBraveImage(searchQuery);
        if (imageUrl) {
          await db.item.update({ where: { id: item.id }, data: { imageUrl } });
        }
      })
    );
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
    where: { userId_categoryId_part: { userId: user.id, categoryId: category.id, part: 1 } },
  });

  if (!session) {
    const itemIds = category.items.map((i: { id: string }) => i.id);
    const bracket = generateBracket(itemIds);
    try {
      session = await db.userSession.create({
        data: {
          userId: user.id,
          categoryId: category.id,
          part: 1,
          currentRound: 1,
          bracketState: bracket as any,
          usedItemIds: itemIds as any,
        },
      });
    } catch (e: any) {
      // P2002 = unique constraint — concurrent request already created it
      if (e?.code !== "P2002") throw e;
      session = await db.userSession.findUnique({
        where: { userId_categoryId_part: { userId: user.id, categoryId: category.id, part: 1 } },
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

async function recordCompletion(userId: string, categoryId: string) {
  const category = await db.category.findUnique({ where: { id: categoryId }, select: { featuredDate: true } });
  if (!category?.featuredDate) return; // not a daily category, skip streak tracking

  await db.dailyCompletion.upsert({
    where: { userId_categoryId: { userId, categoryId } },
    create: { userId, categoryId, date: category.featuredDate },
    update: {},
  });

  await recomputeStreak(userId);
}

async function recomputeStreak(userId: string) {
  const completions = await db.dailyCompletion.findMany({
    where: { userId },
    select: { date: true },
    orderBy: { date: "desc" },
  });

  const dates = completions.map(c => {
    const d = new Date(c.date);
    d.setUTCHours(0, 0, 0, 0);
    return d.getTime();
  });

  const DAY_MS = 86_400_000;
  const todayUTC = new Date();
  todayUTC.setUTCHours(0, 0, 0, 0);
  const today = todayUTC.getTime();

  // Compute current streak — walk backward from today
  let streak = 0;
  let expected = today;
  for (const ts of dates) {
    if (ts === expected) {
      streak++;
      expected -= DAY_MS;
    } else if (ts < expected) {
      break; // gap found
    }
    // ts > expected shouldn't happen (ordered desc), skip
  }

  // Compute longest streak
  let longestStreak = 0;
  let run = 0;
  let prev: number | null = null;
  for (const ts of [...dates].reverse()) {
    if (prev === null || ts === prev + DAY_MS) {
      run++;
    } else {
      longestStreak = Math.max(longestStreak, run);
      run = 1;
    }
    prev = ts;
  }
  longestStreak = Math.max(longestStreak, run);

  // Total completed = all Part 2 sessions that are fully done
  const part1Sessions = await db.userSession.findMany({
    where: { userId, part: 1 },
    select: { bracketState: true },
  });
  const totalCompleted = part1Sessions.filter(s => isBracketComplete(s.bracketState as unknown as BracketState)).length;

  await db.user.update({ where: { id: userId }, data: { streak, longestStreak, totalCompleted } });
}