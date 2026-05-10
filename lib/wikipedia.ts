const HEADERS = { "User-Agent": "Rankrrr/1.0 (https://rankrrr.vercel.app)" };

export async function fetchWikipediaThumbnail(query: string): Promise<string | null> {
  try {

    // Full-text search handles disambiguation naturally (e.g. "Pinocchio Disney film" → "Pinocchio (1940 film)")
    const searchRes = await fetch(
      `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&srlimit=1`,
      { headers: HEADERS, signal: AbortSignal.timeout(6000) }
    );
    if (!searchRes.ok) return null;
    const searchData = await searchRes.json();
    const title: string | undefined = searchData?.query?.search?.[0]?.title;
    if (!title) return null;

    // Fetch the thumbnail for the matched article
    const summaryRes = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`,
      { headers: HEADERS, signal: AbortSignal.timeout(6000) }
    );
    if (!summaryRes.ok) return null;
    const data = await summaryRes.json();
    return (data.thumbnail?.source as string) ?? null;
  } catch {
    return null;
  }
}
