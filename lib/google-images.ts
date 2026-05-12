export async function fetchGoogleImage(query: string): Promise<string | null> {
  const apiKey = process.env.GOOGLE_CSE_KEY;
  const cx = process.env.GOOGLE_CSE_ID;
  if (!apiKey || !cx) return null;

  try {
    const url = new URL("https://www.googleapis.com/customsearch/v1");
    url.searchParams.set("key", apiKey);
    url.searchParams.set("cx", cx);
    url.searchParams.set("q", query);
    url.searchParams.set("searchType", "image");
    url.searchParams.set("num", "1");
    url.searchParams.set("safe", "active");

    const res = await fetch(url.toString(), { signal: AbortSignal.timeout(6000) });
    if (!res.ok) return null;
    const data = await res.json() as { items?: { image?: { thumbnailLink?: string } }[] };
    return data.items?.[0]?.image?.thumbnailLink ?? null;
  } catch {
    return null;
  }
}
