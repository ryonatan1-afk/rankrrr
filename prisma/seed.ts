import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";

const COLORS = ["#6366F1", "#EC4899", "#F59E0B", "#10B981", "#F97316", "#8B5CF6", "#06B6D4", "#EF4444"];

const CATEGORIES = [
  {
    slug: "travel-destinations",
    name: "Travel Destinations",
    emoji: "✈️",
    description: "The world's most iconic places to visit.",
    items: [
      { name: "Tokyo",     emoji: "🗼", description: "Electric streets, ramen at 3am, endless exploration." },
      { name: "Paris",     emoji: "🗺️", description: "Golden light, croissants, the world's most romantic boulevards." },
      { name: "New York",  emoji: "🗽", description: "The city that never sleeps — raw, alive, overwhelming." },
      { name: "Kyoto",     emoji: "⛩️", description: "Bamboo groves, ancient temples, lantern-lit evenings." },
      { name: "Barcelona", emoji: "🏛️", description: "Gaudí's dreamscapes, tapas in the sun, sea breezes." },
      { name: "Lisbon",    emoji: "🎭", description: "Fado echoes on cobblestones, pastel façades, salt air." },
      { name: "Sydney",    emoji: "🦘", description: "Harbour sunsets, great whites, and a relaxed roar." },
      { name: "Marrakech", emoji: "🕌", description: "Spice markets, medina mazes, rooftop mint tea." },
    ],
  },
  {
    slug: "foods",
    name: "Foods",
    emoji: "🍽️",
    description: "The greatest dishes on the planet.",
    items: [
      { name: "Sushi",     emoji: "🍣", description: "Pristine fish, seasoned rice, pure umami." },
      { name: "Pizza",     emoji: "🍕", description: "Crispy crust, molten cheese, endless variations." },
      { name: "Tacos",     emoji: "🌮", description: "Street-level joy in a handmade corn shell." },
      { name: "Ramen",     emoji: "🍜", description: "Twelve-hour broth, silky noodles, marbled pork." },
      { name: "Croissant", emoji: "🥐", description: "Laminated butter, shattering flakes, golden morning." },
      { name: "Biryani",   emoji: "🍛", description: "Fragrant basmati, slow-cooked spice, saffron gold." },
      { name: "Pho",       emoji: "🫕", description: "Beef bone broth, rice noodles, fresh herbs, a Hanoi morning." },
      { name: "Dumplings", emoji: "🥟", description: "Pleated parcels of joy, steamed or fried, endlessly filling." },
    ],
  },
  {
    slug: "movie-genres",
    name: "Movie Genres",
    emoji: "🎬",
    description: "Pick your favourite type of film.",
    items: [
      { name: "Thriller",    emoji: "🔪", description: "Edge-of-your-seat tension, unreliable narrators." },
      { name: "Sci-Fi",      emoji: "🚀", description: "Vast universes, moral dilemmas, wonder and dread." },
      { name: "Romance",     emoji: "💘", description: "Longing glances, missed connections, tender resolution." },
      { name: "Comedy",      emoji: "😂", description: "Timing is everything. Absurdity is a gift." },
      { name: "Horror",      emoji: "👻", description: "Jump scares are cheap. Dread is eternal." },
      { name: "Documentary", emoji: "🎥", description: "Truth is stranger and richer than fiction." },
      { name: "Action",      emoji: "💥", description: "Car chases, explosions, heroes who never miss." },
      { name: "Drama",       emoji: "🎭", description: "Quiet devastation, slow burns, characters you won't forget." },
    ],
  },
];

async function main() {
  // loadEnvFile is built into Node 20+; fall back to manual .env reading
  try {
    (process as any).loadEnvFile(".env");
  } catch {
    const fs = await import("fs");
    const path = await import("path");
    const envPath = path.resolve(process.cwd(), ".env");
    const lines = fs.readFileSync(envPath, "utf-8").split("\n");
    for (const line of lines) {
      const match = line.match(/^([^#=]+)=(.*)$/);
      if (match) process.env[match[1].trim()] = match[2].trim().replace(/^"|"$/g, "");
    }
  }

  const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });

  console.log("Seeding database...");

  try {
    for (const cat of CATEGORIES) {
      const existing = await prisma.category.findUnique({ where: { slug: cat.slug } });
      if (existing) {
        console.log(`  Skipping ${cat.name} (already exists)`);
        continue;
      }

      await prisma.category.create({
        data: {
          slug: cat.slug,
          name: cat.name,
          emoji: cat.emoji,
          description: cat.description,
          authorId: null,
          items: {
            create: cat.items.map((item, i) => ({
              name: item.name,
              emoji: item.emoji,
              description: item.description,
              color: COLORS[i % COLORS.length],
            })),
          },
        },
      });

      console.log(`  Created ${cat.name} with ${cat.items.length} items`);
    }

    console.log("Done.");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
