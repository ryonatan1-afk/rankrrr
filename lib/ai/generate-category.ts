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
    model: "claude-haiku-4-5-20251001",
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
    { "name": "Item Name", "emoji": "🎯", "description": "Short description" }
  ]
}

Rules:
- Exactly 8 items — no more, no fewer
- Each item must be distinct and rankable
- Names should be concise (1-4 words)
- Descriptions should be 1 sentence max`,
      },
    ],
  });

  const raw = message.content[0].type === "text" ? message.content[0].text : "";
  const text = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim();
  return JSON.parse(text) as GeneratedCategory;
}
