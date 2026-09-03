import { ethers } from "ethers";
import { getContract, getReadOnlyProvider } from "../blockchain/metamask";
import { CONTRACT_ADDRESS } from "../blockchain/contracts";
import { isHashLike } from "../helpers";
import { fetchFromIPFS } from "../ipfs";
import type { ProofRecord, EvidenceRecord, VerificationResult, VerificationError } from "../types";

export const PROOF_VERIFICATION_STAGES = [
  "Validating hash format",
  "Connecting to Polygon Amoy",
  "Querying smart contract",
  "Retrieving proof record",
] as const;

export async function verifyProof(
  hash: string,
  onStage?: (index: number) => void,
): Promise<VerificationResult> {
  // Stage 0: Validate hash format
  onStage?.(0);
  const cleanHash = hash.trim();
  if (!isHashLike(cleanHash)) {
    onStage?.(PROOF_VERIFICATION_STAGES.length);
    return {
      outcome: "error",
      proofHash: cleanHash,
      checks: [],
      error: {
        type: "invalid_hash",
        message: "Invalid proof hash. Expected a 0x-prefixed 64-character hexadecimal SHA-256 hash.",
      },
    };
  }

  // Stage 1: Connect to blockchain
  onStage?.(1);
  let provider: ethers.JsonRpcProvider;
  try {
    provider = getReadOnlyProvider();
  } catch {
    onStage?.(PROOF_VERIFICATION_STAGES.length);
    return {
      outcome: "error",
      proofHash: cleanHash,
      checks: [],
      error: {
        type: "rpc_error",
        message: "Unable to connect to Polygon Amoy network. Please check your connection and try again.",
      },
    };
  }

  // Stage 2: Query smart contract
  onStage?.(2);
  let contract: ethers.Contract;
  try {
    contract = await getContract(provider);
  } catch {
    onStage?.(PROOF_VERIFICATION_STAGES.length);
    return {
      outcome: "error",
      proofHash: cleanHash,
      checks: [],
      error: {
        type: "contract_error",
        message: "Unable to load the ProofRegistry smart contract. The contract may not be deployed on this network.",
      },
    };
  }

  // Stage 3: Search for proof
  onStage?.(3);
  try {
    const verifyFn = contract["verifyProof(bytes32)"];
    if (!verifyFn) {
      return {
        outcome: "error",
        proofHash: cleanHash,
        checks: [],
        error: {
          type: "contract_error",
          message: "Smart contract interface unavailable. Please verify the contract is deployed correctly.",
        },
      };
    }

    const result = await verifyFn(cleanHash);
    const exists = result[0] as boolean;
    const submitter = result[1] as string;
    const evidenceReference = result[2] as string;
    const timestamp = Number(result[3]);

    if (!exists) {
      return {
        outcome: "not_found",
        proofHash: cleanHash,
        checks: [],
        error: {
          type: "not_found",
          message: "No proof with this hash exists in the ProofRegistry on Polygon Amoy.",
        },
      };
    }

    // Fetch transaction hash from ProofRegistered events
    let txHash = "";
    let blockNumber = 0;
    try {
      const eventAbi = [
        "event ProofRegistered(bytes32 indexed proofHash, address indexed submitter, string evidenceReference, uint256 timestamp)",
      ];
      const eventIface = new ethers.Interface(eventAbi);
      const topic0 = eventIface.getEvent("ProofRegistered")!.topicHash;
      const topic1 = cleanHash;

      const logs = await provider.getLogs({
        address: CONTRACT_ADDRESS,
        topics: [topic0, topic1],
        fromBlock: 0,
        toBlock: "latest",
      });
      if (logs.length > 0) {
        const lastLog = logs[logs.length - 1];
        if (lastLog) {
          txHash = lastLog.transactionHash;
          blockNumber = lastLog.blockNumber;
        }
      }
    } catch {
      // Continue without tx hash
    }

    // Get current block for confirmation count
    let confirmations = 0;
    try {
      const currentBlock = await provider.getBlockNumber();
      confirmations = currentBlock - blockNumber;
    } catch {
      // Continue without confirmation count
    }

    const proof: ProofRecord = {
      proofHash: cleanHash,
      submitter,
      evidenceReference,
      timestamp,
    };

    // Fetch evidence metadata from IPFS
    let evidence: EvidenceRecord | undefined;
    if (evidenceReference) {
      try {
        evidence = await fetchFromIPFS<EvidenceRecord>(evidenceReference);
      } catch {
        // Evidence fetch failed — proof is still valid on-chain
      }
    }

    const checks = [
      { label: "Hash Match", value: "PASS", pass: true },
      {
        label: "Blockchain Record",
        value: txHash ? `BLOCK #${blockNumber.toLocaleString("en-US")}` : "CONFIRMED",
        pass: !!txHash,
      },
      {
        label: "Confirmations",
        value: confirmations > 0 ? `${confirmations.toLocaleString("en-US")} blocks` : "PENDING",
        pass: confirmations > 0,
      },
      {
        label: "IPFS Evidence",
        value: evidenceReference ? "STORED" : "MISSING",
        pass: !!evidenceReference,
      },
    ];

    return {
      outcome: "verified",
      proofHash: cleanHash,
      proof,
      evidence,
      checks,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return {
      outcome: "error",
      proofHash: cleanHash,
      checks: [],
      error: {
        type: "network_error",
        message: `Blockchain query failed: ${msg}`,
      },
    };
  }
}
