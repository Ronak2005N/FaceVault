export interface SearchQuery {
  description?: string;
  imageUrl?: string;
  imageFile?: File;
}

export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  source: string;
  imageUrl?: string;
  publishedDate?: string;
}

export interface CollectedEvidence {
  searchResult: SearchResult;
  collectedAt: string;
  pageTitle: string;
  pageDescription?: string;
  imageUrl?: string;
}

export interface DiscoveryError {
  type: "api_missing" | "api_error" | "network_error" | "no_results" | "unknown";
  message: string;
}
