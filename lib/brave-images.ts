export async function fetchBraveImage(query: string): Promise<string | null> {
  const apiKey = process.env.BRAVE_SEARCH_API_KEY;
  if (!apiKey) {
    console.error("[brave-images] BRAVE_SEARCH_API_KEY not set");
    return null;
  }

  try {
    const res = await fetch(
      `https://api.search.brave.com/res/v1/images/search?q=${encodeURIComponent(query)}&count=3&safesearch=strict`,
      {
        headers: {
          "Accept": "application/json",
          "Accept-Encoding": "gzip",
          "X-Subscription-Token": apiKey,
        },
        signal: AbortSignal.timeout(6000),
      }
    );
    if (!res.ok) {
      console.error("[brave-images] HTTP", res.status, await res.text());
      return null;
    }
    const data = await res.json() as { results?: { thumbnail?: { src?: string } }[] };
    if (!data.results?.length) {
      console.error("[brave-images] No results for query:", query);
      return null;
    }
    return data.results[0].thumbnail?.src ?? null;
  } catch (err) {
    console.error("[brave-images] fetch error:", err);
    return null;
  }
}
