# FaceChain Proof

> "Verify any face. Prove it on-chain."

A face identification and blockchain verification system built for HH Goa 2026. Takes a face image as input, detects and encodes the face, performs genuine reverse-image search via Google Lens, collects discovered evidence, creates a tamper-proof SHA-256 fingerprint, and registers the proof on Polygon Amoy blockchain — producing a publicly verifiable record.

## Pipeline

```
Face Image Input
    ↓
Face Detection (MediaPipe BlazeFace)
    ↓
Face Encoding (478-point landmark → 1434-dim vector)
    ↓
Reverse-Image Search (Google Lens via SerpApi)
    ↓
Evidence Collection (page metadata from discovered URLs)
    ↓
Deterministic Evidence Record (sorted-key JSON)
    ↓
SHA-256 Fingerprint (Web Crypto API)
    ↓
IPFS Upload (Pinata — evidence metadata)
    ↓
Blockchain Registration (Polygon Amoy via MetaMask)
    ↓
On-Chain Verification (public RPC query)
```

## Architecture

```
┌─────────────────────────────────────────────┐
│              React Frontend                  │
│  TanStack Router · Tailwind CSS · shadcn/ui │
├──────────────┬──────────────┬───────────────┤
│  Face Service│Search Service│Blockchain Svc │
│  (MediaPipe) │(SerpApi Lens)│(ethers.js)    │
├──────────────┴──────────────┴───────────────┤
│           Crypto Layer (SHA-256)             │
└──────────────┬──────────────┬───────────────┘
               │              │
    ┌──────────┘    ┌─────────┘
    ↓               ↓
 Polygon Amoy    Pinata IPFS
 (testnet)       (free tier)
```

### Key Modules

| Module | Path | Purpose |
|--------|------|---------|
| Face Detection | `src/lib/face/detectFace.ts` | MediaPipe BlazeFace — detects face bounding box + confidence |
| Face Encoding | `src/lib/face/extractEmbedding.ts` | MediaPipe FaceLandmarker — 478 landmarks → 1434-dim normalized vector |
| Reverse-Image Search | `src/lib/discovery/searchWeb.ts` | SerpApi Google Lens — uploads image, finds visual matches across the web |
| Evidence Collection | `src/lib/discovery/collectEvidence.ts` | Fetches page metadata (title, description, OG image) from discovered URLs |
| Evidence Record | `src/lib/discovery/buildEvidence.ts` | Deterministic JSON (sorted keys) → SHA-256 fingerprint |
| Proof Registration | `src/lib/proof/registerProof.ts` | Serialize → hash → IPFS → MetaMask TX → Polygon Amoy |
| Proof Verification | `src/lib/proof/verifyProof.ts` | Read-only RPC query + event log fetch + confirmation count |
| Smart Contract | `contracts/ProofRegistry.sol` | Solidity — stores proof hashes on-chain |
| Crypto | `src/lib/crypto.ts` | SHA-256 via Web Crypto API (browser-native) |
| IPFS | `src/lib/ipfs.ts` | Pinata API — JSON + file upload |
| MetaMask | `src/lib/blockchain/metamask.ts` | 14 functions — connection, network switching, balance, contract interaction |

## How to Run

### Prerequisites

- [Node.js](https://nodejs.org/) v18+ or [Bun](https://bun.sh/)
- [MetaMask](https://metamask.io/) browser extension
- A [SerpApi](https://serpapi.com/) API key (free tier: 250 searches/month)
- A [Pinata](https://pinata.cloud/) JWT (free tier: 1GB storage)

### Install

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/HHGoa26.git
cd HHGoa26

# Install dependencies
npm install
# or
bun install
```

### Configure Environment

Copy `.env.example` to `.env` and fill in:

```bash
VITE_PINATA_JWT=your_pinata_jwt_token
VITE_HHGOA_CONTRACT_ADDRESS=0x7Ada4CaD2B63D2D6cB309c8606Af8b136c8838B9
VITE_SERPAPI_KEY=your_serpapi_key
DEPLOYER_PRIVATE_KEY=your_wallet_private_key
POLYGON_AMOY_RPC=https://polygon-amoy-bor-rpc.publicnode.com
```

### Run Development Server

```bash
npm run dev
# or
bun run dev
```

Opens at `http://localhost:8080`.

### Build for Production

```bash
npm run build
# or
bun run build
```

Output goes to `dist/`.

## Blockchain

| Detail | Value |
|--------|-------|
| Network | Polygon Amoy Testnet |
| Chain ID | `80002` |
| Contract | `0x7Ada4CaD2B63D2D6cB309c8606Af8b136c8838B9` |
| Explorer | [PolygonScan](https://amoy.polygonscan.com/address/0x7Ada4CaD2B63D2D6cB309c8606Af8b136c8838B9) |
| Gas Token | POL (free from [Polygon Faucet](https://faucet.polygon.technology/)) |
| Contract Functions | `registerProof`, `verifyProof`, `proofExists`, `getProofCount`, `owner` |

### Verification Process

1. Evidence record is serialized deterministically (keys sorted alphabetically → JSON.stringify)
2. SHA-256 hash is computed over the serialized string
3. Hash is converted to `bytes32` and registered on-chain via `registerProof()`
4. Evidence metadata is uploaded to IPFS (Pinata), CID stored on-chain
5. Verification queries `verifyProof()` via public RPC (no wallet needed)
6. Transaction hash and block number are retrieved from `ProofRegistered` event logs
7. Confirmation count is computed: `currentBlock - registrationBlock`

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_PINATA_JWT` | Yes | Pinata API JWT for IPFS uploads |
| `VITE_HHGOA_CONTRACT_ADDRESS` | Yes | Deployed ProofRegistry contract address |
| `VITE_SERPAPI_KEY` | Yes | SerpApi API key for Google Lens reverse-image search |
| `DEPLOYER_PRIVATE_KEY` | Yes | Wallet private key (for contract deployment only) |
| `POLYGON_AMOY_RPC` | Yes | Polygon Amoy RPC endpoint |

**Never commit real API keys or private keys to version control.**

## Known Limitations

- **Face encoding is geometric, not biometric.** MediaPipe produces 478 face landmarks (shape), not a discriminative identity vector like ArcFace. The `subjectIdentifier` changes with different angles/expressions of the same person.
- **Reverse-image search depends on SerpApi.** Free tier: 250 searches/month. If the key is missing or quota is exhausted, the system falls back to manual evidence input.
- **Google Lens results vary by image.** If the uploaded image has never appeared online, Google Lens may return no visual matches.
- **Evidence collection is CORS-limited.** The browser's `fetch()` cannot read cross-origin HTML pages. Page metadata (title, description) may not be collected for all search results. The system falls back to SerpApi's own title/snippet data.
- **IPFS evidence is metadata only.** The raw face image is NOT stored on IPFS (privacy + size). Only the structured evidence record JSON is pinned.
- **Polygon Amoy is a testnet.** Not suitable for production use. All POL is test currency with no real value.
- **No liveness detection.** A photo of a photo can fool the face detection. No anti-spoofing measures.
- **Single face only.** The pipeline processes the first detected face. Multi-face scenarios are not supported.

## Demo Reproduction

1. Start the dev server (`npm run dev`)
2. Navigate to `/scan`
3. Upload a face image (one that has appeared online — e.g., a celebrity photo, your own social media photo, or a stock photo)
4. Click "Analyze face"
5. Watch the pipeline: face detection → encoding → reverse-image search → evidence collection → hash
6. Click "Review evidence" — verify a real URL appears from Google Lens results
7. Click "Register on-chain" — connect MetaMask, confirm the transaction
8. Wait for blockchain confirmation
9. Click "View verification result" — all checks should pass
10. Copy the proof hash, go to `/verify`, paste it — independent verification succeeds
11. Click "View on PolygonScan" — the real transaction appears on the explorer

## Tech Stack

- React 19, TypeScript, Vite 8
- Tailwind CSS v4, shadcn/ui
- TanStack Router, TanStack Query
- Framer Motion (animations)
- MediaPipe Tasks Vision (face detection + landmarks)
- SerpApi (Google Lens reverse-image search)
- ethers.js 6 (blockchain interaction)
- Pinata (IPFS storage)
- Polygon Amoy testnet
- Hardhat (contract compilation + deployment)

## License

MIT
