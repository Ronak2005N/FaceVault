export const PROOF_REGISTRY_ABI = [
  "constructor()",
  "function owner() view returns (address)",
  "function proofs(bytes32) view returns (bytes32 proofHash, address submitter, string evidenceReference, uint256 timestamp)",
  "function proofHashes(uint256) view returns (bytes32)",
  "function registerProof(bytes32 proofHash, string evidenceReference)",
  "function verifyProof(bytes32 proofHash) view returns (bool exists, address submitter, string evidenceReference, uint256 timestamp)",
  "function proofExists(bytes32 proofHash) view returns (bool)",
  "function getProofCount() view returns (uint256)",
  "event ProofRegistered(bytes32 indexed proofHash, address indexed submitter, string evidenceReference, uint256 timestamp)",
] as const;

export const POLYGON_AMOY = {
  chainId: 80002,
  chainIdHex: "0x13882",
  name: "Polygon Amoy",
  currency: "POL",
  rpcUrl: "https://polygon-amoy-bor-rpc.publicnode.com",
  explorerUrl: "https://amoy.polygonscan.com",
};

const env = import.meta.env as Record<string, string | undefined>;

export const CONTRACT_ADDRESS: string = env["VITE_HHGOA_CONTRACT_ADDRESS"] || "";

export const EXPLORER_URL: string = env["VITE_EXPLORER_URL"] || POLYGON_AMOY.explorerUrl;
