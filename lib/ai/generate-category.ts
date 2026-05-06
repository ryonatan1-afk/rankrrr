import Anthropic from "@anthropic-ai/sdk";

export interface GeneratedItem {
  name: string;
  emoji: string;
  description: string;
}

export interface GeneratedCategory {
  name: string;
  emoji: string;
  description: string;
  items: GeneratedItem[];
}

export async function generateCategory(topic: string): Promise<GeneratedCategory> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set");
  const client = new Anthropic({ apiKey });
  const message = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    messages: [
      {
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
- Each item must be a specific, named real thing — a person, product, company, film, song, place, etc. Never return a type or sub-category of things (e.g. for "startups in Israel" → "Waze" not "Navigation Apps"; for "pizza toppings" → "Pepperoni" not "Meat toppings"; for "90s movies" → "Pulp Fiction" not "Crime Films")
- Honour the spirit and constraints of the topic precisely. If the topic implies a stage, era, size, or characteristic, respect it strictly (e.g. "startups" means early-stage or growth-stage companies — not public giants or household names; "80s songs" means songs released in the 1980s only; "budget travel destinations" means affordable places, not luxury ones)
- Every item must be unique — no duplicates, no two items that refer to the same thing
- Only include items you are certain are real and accurate. If unsure about any item, replace it with one you are confident about
- Names should be concise (1-4 words)
- No item descriptions — name and emoji only`,
      },
    ],
  });

  const raw = message.content[0].type === "text" ? message.content[0].text : "";
  const text = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim();
  return JSON.parse(text) as GeneratedCategory;
}
