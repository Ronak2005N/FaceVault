export type VerificationOutcome = "verified" | "not_found" | "error";

export interface VerificationError {
  type: "invalid_hash" | "rpc_error" | "contract_error" | "not_found" | "network_error";
  message: string;
}

export interface VerificationResult {
  outcome: VerificationOutcome;
  proofHash: string;
  checks: { label: string; value: string; pass: boolean }[];
  proof?: ProofRecord;
  evidence?: EvidenceRecord;
  error?: VerificationError;
}

export interface ProofRecord {
  proofHash: string;
  submitter: string;
  evidenceReference: string;
  timestamp: number;
}

export interface EvidenceRecord {
  subjectIdentifier: string;
  source: string;
  discoveredURL: string;
  matchConfidence: number;
  evidenceHash: string;
  timestamp: string;
  version: "1.0";
}

export type StageUpdate = {
  index: number;
  label: string;
  state: "pending" | "active" | "done";
};
