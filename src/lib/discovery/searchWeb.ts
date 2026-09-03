import type { SearchQuery, SearchResult, DiscoveryError } from "./types";

const SERPAPI_BASE = "/serpapi/search.json";
const SERPAPI_IMAGE_UPLOAD = "/serpapi/image";
const MAX_UPLOAD_SIZE = 500 * 1024; // 500 KB — SerpApi Image API limit

function getSerpApiKey(): string {
  const env = import.meta.env as Record<string, string | undefined>;
  return env["VITE_SERPAPI_KEY"] || "";
}

async function fileToResizedBlob(file: File): Promise<Blob> {
  if (file.size <= MAX_UPLOAD_SIZE) return file;

  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement("canvas");
  const scale = Math.sqrt(MAX_UPLOAD_SIZE / file.size) * 0.95;
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  return new Promise<Blob>((resolve) => {
    canvas.toBlob((blob) => resolve(blob!), "image/jpeg", 0.85);
  });
}

async function uploadImageToSerpApi(file: File): Promise<string> {
  const apiKey = getSerpApiKey();
  if (!apiKey) throw new Error("SerpApi key not configured.");

  const blob = await fileToResizedBlob(file);
  const formData = new FormData();
  formData.append("image", blob, file.name || "face.jpg");
  formData.append("api_key", apiKey);

  const response = await fetch(SERPAPI_IMAGE_UPLOAD, {
    method: "POST",
    body: formData,
  });

  const data = await response.json();
  if (data.error) throw new Error(data.error);
  if (!data.image_id) throw new Error("Image upload failed — no image_id returned.");

  return data.image_id as string;
}

export async function searchWeb(
  query: SearchQuery,
  onStage?: (index: number) => void
): Promise<{ results: SearchResult[]; error?: DiscoveryError }> {
  onStage?.(0);

  const apiKey = getSerpApiKey();

  if (!apiKey) {
    return {
      results: [],
      error: {
        type: "api_missing",
        message: "SerpApi key not configured. Add VITE_SERPAPI_KEY to .env or enter evidence manually.",
      },
    };
  }

  try {
    const params = new URLSearchParams({
      q: query.description || "face image identification",
      api_key: apiKey,
      engine: "google",
      num: "10",
    });

    const response = await fetch(`${SERPAPI_BASE}?${params}`);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        results: [],
        error: {
          type: "api_error",
          message: errorData.error || `SerpApi request failed (${response.status})`,
        },
      };
    }

    const data = await response.json();
    const organic = data.organic_results || [];

    const results: SearchResult[] = organic.map((r: Record<string, unknown>) => ({
      title: (r.title as string) || "",
      url: (r.link as string) || "",
      snippet: (r.snippet as string) || "",
      source: "serpapi",
      publishedDate: (r.displayed_link as string) || undefined,
    }));

    return { results };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return {
      results: [],
      error: {
        type: "network_error",
        message: `Search failed: ${msg}`,
      },
    };
  }
}

export async function searchImages(
  query: SearchQuery,
  onStage?: (index: number) => void
): Promise<{ results: SearchResult[]; error?: DiscoveryError }> {
  onStage?.(0);

  const apiKey = getSerpApiKey();

  if (!apiKey) {
    return {
      results: [],
      error: {
        type: "api_missing",
        message: "SerpApi key not configured. Add VITE_SERPAPI_KEY to .env.",
      },
    };
  }

  try {
    const params = new URLSearchParams({
      q: query.description || "face",
      api_key: apiKey,
      engine: "google_images",
      image_type: "face",
      num: "10",
    });

    const response = await fetch(`${SERPAPI_BASE}?${params}`);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        results: [],
        error: {
          type: "api_error",
          message: errorData.error || `SerpApi image search failed (${response.status})`,
        },
      };
    }

    const data = await response.json();
    const images = data.images_results || [];

    const results: SearchResult[] = images.map((r: Record<string, unknown>) => ({
      title: (r.title as string) || "",
      url: (r.link as string) || "",
      snippet: (r.source as string) || "",
      source: "serpapi_images",
      imageUrl: (r.original as string) || (r.thumbnail as string) || undefined,
    }));

    return { results };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return {
      results: [],
      error: {
        type: "network_error",
        message: `Image search failed: ${msg}`,
      },
    };
  }
}

export function isConfigured(): boolean {
  return !!getSerpApiKey();
}

export async function reverseImageSearch(
  file: File,
  onStage?: (index: number) => void
): Promise<{ results: SearchResult[]; error?: DiscoveryError }> {
  onStage?.(0);

  const apiKey = getSerpApiKey();
  if (!apiKey) {
    return {
      results: [],
      error: {
        type: "api_missing",
        message:
          "SerpApi key not configured. Add VITE_SERPAPI_KEY to .env for reverse-image search.",
      },
    };
  }

  try {
    // Step 1: Upload image to get image_id
    onStage?.(0);
    const imageId = await uploadImageToSerpApi(file);

    // Step 2: Search Google Lens with the image_id
    onStage?.(1);
    const params = new URLSearchParams({
      engine: "google_lens",
      image_id: imageId,
      api_key: apiKey,
      type: "all",
    });

    const response = await fetch(`${SERPAPI_BASE}?${params}`);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        results: [],
        error: {
          type: "api_error",
          message:
            errorData.error ||
            `Google Lens search failed (${response.status})`,
        },
      };
    }

    const data = await response.json();

    // Collect results from visual_matches, exact_matches, and related_content
    const results: SearchResult[] = [];

    const visualMatches = (data.visual_matches || []) as Array<
      Record<string, unknown>
    >;
    for (const m of visualMatches) {
      results.push({
        title: (m.title as string) || "",
        url: (m.link as string) || "",
        snippet: (m.source as string) || "",
        source: "google_lens_visual",
        imageUrl: (m.thumbnail as string) || (m.image as string) || undefined,
      });
    }

    const exactMatches = (data.exact_matches || []) as Array<
      Record<string, unknown>
    >;
    for (const m of exactMatches) {
      results.push({
        title: (m.title as string) || "",
        url: (m.link as string) || "",
        snippet: (m.source as string) || "",
        source: "google_lens_exact",
        imageUrl: (m.thumbnail as string) || (m.image as string) || undefined,
      });
    }

    const relatedContent = (data.related_content || []) as Array<
      Record<string, unknown>
    >;
    for (const r of relatedContent) {
      results.push({
        title: (r.query as string) || "",
        url: (r.link as string) || "",
        snippet: "",
        source: "google_lens_related",
      });
    }

    if (results.length === 0) {
      return {
        results: [],
        error: {
          type: "no_results",
          message:
            "No visual matches found for this image. Try a different or clearer image.",
        },
      };
    }

    return { results };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return {
      results: [],
      error: {
        type: "network_error",
        message: `Reverse-image search failed: ${msg}`,
      },
    };
  }
}
