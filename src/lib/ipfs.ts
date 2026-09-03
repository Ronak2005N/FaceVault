const env = import.meta.env as Record<string, string | undefined>;
const PINATA_JWT = env["VITE_PINATA_JWT"];
const PINATA_UPLOAD_URL = "https://api.pinata.cloud/pinning/pinFileToIPFS";

export interface IPFSUploadResult {
  cid: string;
  url: string;
}

export async function uploadToIPFS(file: File): Promise<IPFSUploadResult> {
  if (!PINATA_JWT) {
    throw new Error("Pinata JWT not configured. Add VITE_PINATA_JWT to .env");
  }

  const formData = new FormData();
  formData.append("file", file);

  const metadata = JSON.stringify({
    name: file.name,
    keyvalues: {
      type: "evidence",
    },
  });
  formData.append("pinataMetadata", metadata);

  const response = await fetch(PINATA_UPLOAD_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${PINATA_JWT}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to upload to IPFS");
  }

  const result = await response.json();

  return {
    cid: result.IpfsHash,
    url: `https://gateway.pinata.cloud/ipfs/${result.IpfsHash}`,
  };
}

const GATEWAYS = [
  "https://gateway.pinata.cloud/ipfs/",
  "https://cloudflare-ipfs.com/ipfs/",
  "https://ipfs.io/ipfs/",
];

export async function fetchFromIPFS<T = unknown>(cid: string): Promise<T> {
  let lastError: Error | null = null;

  for (const base of GATEWAYS) {
    try {
      const res = await fetch(`${base}${cid}`, {
        signal: AbortSignal.timeout(10000),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return (await res.json()) as T;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
    }
  }

  throw new Error(
    `Failed to fetch from IPFS (${cid}): ${lastError?.message || "all gateways failed"}`
  );
}

export async function uploadJSONToIPFS(
  data: Record<string, unknown>,
  name: string
): Promise<IPFSUploadResult> {
  if (!PINATA_JWT) {
    throw new Error("Pinata JWT not configured");
  }

  const body = {
    pinataContent: data,
    pinataMetadata: { name },
  };

  const response = await fetch(
    "https://api.pinata.cloud/pinning/pinJSONToIPFS",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PINATA_JWT}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to upload JSON to IPFS");
  }

  const result = await response.json();

  return {
    cid: result.IpfsHash,
    url: `https://gateway.pinata.cloud/ipfs/${result.IpfsHash}`,
  };
}
