import type { SearchResult, CollectedEvidence } from "./types";

export async function collectEvidence(
  results: SearchResult[],
  onStage?: (index: number) => void
): Promise<CollectedEvidence[]> {
  const collected: CollectedEvidence[] = [];

  for (let i = 0; i < results.length; i++) {
    onStage?.(i);
    const result = results[i];

    // Use SerpApi's own data directly — cross-origin fetches to external
    // sites are blocked by browsers (CORS), so we skip the metadata fetch
    // and rely on the title, snippet, and source already provided by Google Lens.
    collected.push({
      searchResult: result,
      collectedAt: new Date().toISOString(),
      pageTitle: result.title,
      pageDescription: result.snippet,
      imageUrl: result.imageUrl,
    });
  }

  return collected;
}
