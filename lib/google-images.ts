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
    if (!res.ok) {
      const body = await res.text();
      console.error("[google-images] HTTP", res.status, body);
      return null;
    }
    const data = await res.json() as { items?: { image?: { thumbnailLink?: string } }[] };
    if (!data.items?.length) {
      console.error("[google-images] No results for query:", url.searchParams.get("q"));
      return null;
    }
    return data.items[0].image?.thumbnailLink ?? null;
  } catch (err) {
    console.error("[google-images] fetch error:", err);
    return null;
  }
}

