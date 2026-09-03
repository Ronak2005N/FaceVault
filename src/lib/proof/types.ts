export const PROOF_REGISTRATION_STAGES = [
  "Serializing evidence record",
  "Computing SHA-256 hash",
  "Uploading evidence to IPFS",
  "Preparing blockchain transaction",
  "Submitting to Polygon Amoy",
  "Waiting for confirmation",
  "Complete",
] as const;

export type RegistrationError =
  | { type: "metamask_missing"; message: string }
  | { type: "wrong_network"; message: string }
  | { type: "insufficient_funds"; message: string }
  | { type: "transaction_rejected"; message: string }
  | { type: "ipfs_failed"; message: string }
  | { type: "contract_error"; message: string }
  | { type: "network_timeout"; message: string }
  | { type: "unknown"; message: string };

export interface RegistrationResult {
  proofHash: string;
  submitter: string;
  evidenceReference: string;
  transactionHash: string;
  blockNumber: number;
  timestamp: number;
}
