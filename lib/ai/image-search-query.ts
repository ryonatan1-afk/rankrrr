import Anthropic from "@anthropic-ai/sdk";

export async function generateImageSearchQuery(
  itemName: string,
  categoryName: string
): Promise<string> {
  const fallback = `${itemName} ${categoryName}`;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return fallback;

  try {
    const client = new Anthropic({ apiKey });
    const message = await client.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 64,
      messages: [{
        role: "user",
        content: `Return only a precise Wikipedia search query (5-8 words max) to find a thumbnail image for "${itemName}" in the context of "${categoryName}". Output only the search query, nothing else.`,
      }],
    });

    const raw = message.content[0].type === "text" ? message.content[0].text.trim() : "";
    return raw || fallback;
  } catch {
    return fallback;
  }
}
