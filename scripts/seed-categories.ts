import "dotenv/config";
import Anthropic from "@anthropic-ai/sdk";
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";

const db = new PrismaClient({
  adapter: new PrismaNeon({ connectionString: process.env.DATABASE_URL }),
});

const ITEM_COLORS = ["#6366F1", "#EC4899", "#F59E0B", "#10B981", "#F97316", "#8B5CF6", "#06B6D4", "#EF4444"];

const TOPICS = [
  "Pizza Toppings",
  "Disney Animated Films",
  "Fast Food Chains",
  "Superhero Movies",
  "90s Cartoons",
  "Sports GOATs (greatest athletes of all time across all sports)",
  "Friends TV Show Characters",
  "Ice Cream Flavors",
  "Pop Songs of the 2000s",
  "Dog Breeds",
];

async function generateCategory(topic: string) {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1536,
    messages: [{
      role: "user",
      content: `Generate a ranking category for the topic: "${topic}"

Return ONLY valid JSON in this exact shape, no markdown, no explanation:
{
  "name": "Category Name",
  "emoji": "🏆",
  "description": "One sentence description",
  "items": [
    { "name": "Item Name", "emoji": "🎯" }
  ]
}

Rules:
- Exactly 16 items — no more, no fewer
- Each item must be a specific, named real thing — a person, product, company, film, song, place, etc. Never return a type or sub-category of things (e.g. for "startups in Israel" → "Waze" not "Navigation Apps"; for "pizza toppings" → "Pepperoni" not "Meat toppings")
- Names should be concise (1-4 words)
- No item descriptions — name and emoji only
- Pick the most iconic, universally recognised options people will have strong opinions about`,
    }],
  });

  const raw = message.content[0].type === "text" ? message.content[0].text : "";
  const text = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim();
  return JSON.parse(text) as {
    name: string; emoji: string; description: string;
    items: { name: string; emoji: string; description: string }[];
  };
}

function toSlug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

async function main() {
  console.log("Deleting categories with fewer than 16 items (old placeholders)...");
  const old = await db.category.findMany({
    include: { _count: { select: { items: true } } },
  });
  const toDelete = old.filter(c => c._count.items < 16);
  for (const cat of toDelete) {
    await db.category.delete({ where: { id: cat.id } });
    console.log(`  Deleted: ${cat.name} (${cat._count.items} items)`);
  }

  console.log(`\nGenerating ${TOPICS.length} categories...\n`);

  for (const topic of TOPICS) {
    process.stdout.write(`Generating "${topic}"... `);
    try {
      const result = await generateCategory(topic);

      // Enforce exactly 16
      while (result.items.length < 16) result.items.push(result.items[result.items.length - 1]);
      result.items = result.items.slice(0, 16);

      const baseSlug = toSlug(result.name);
      const existing = await db.category.findUnique({ where: { slug: baseSlug } });
      const slug = existing ? `${baseSlug}-${Date.now()}` : baseSlug;

      await db.category.create({
        data: {
          slug,
          name: result.name,
          emoji: result.emoji,
          description: result.description,
          status: "ACTIVE",
          items: {
            create: result.items.map((item, i) => ({
              name: item.name,
              emoji: item.emoji,
              description: item.description,
              color: ITEM_COLORS[i % ITEM_COLORS.length],
            })),
          },
        },
      });

      console.log(`✓ ${result.name} (${result.items.length} items)`);
    } catch (e) {
      console.error(`✗ Failed: ${e}`);
    }
  }

  console.log("\nDone.");
  await db.$disconnect();
}

main().catch(async e => {
  console.error(e);
  await db.$disconnect();
  process.exit(1);
});
