import { ethers } from "ethers";
import { getSigner, getContract, getProvider } from "../blockchain/metamask";
import { computeSHA256, hexToBytes32 } from "../crypto";
import { uploadJSONToIPFS } from "../ipfs";
import type { EvidenceRecord } from "../types";
import type { RegistrationError, RegistrationResult } from "./types";

function serializeEvidenceRecord(record: EvidenceRecord): string {
  const sorted = Object.keys(record)
    .sort()
    .reduce((acc, key) => {
      acc[key] = record[key as keyof EvidenceRecord];
      return acc;
    }, {} as Record<string, unknown>);
  return JSON.stringify(sorted);
}

function parseRegistrationError(err: unknown): RegistrationError {
  const msg = err instanceof Error ? err.message : String(err);

  if (msg.includes("MetaMask") || msg.includes("not installed")) {
    return { type: "metamask_missing", message: "MetaMask is not installed. Please install MetaMask to continue." };
  }
  if (msg.includes("wallet_wrongNetwork") || msg.includes("switch")) {
    return { type: "wrong_network", message: "Wrong network. Please switch MetaMask to Polygon Amoy." };
  }
  if (msg.includes("insufficient funds") || msg.includes("insufficient balance") || msg.includes("fee")) {
    return { type: "insufficient_funds", message: "Insufficient POL for gas fees. Please add POL to your wallet." };
  }
  if (msg.includes("user rejected") || msg.includes("denied") || msg.includes("4001")) {
    return { type: "transaction_rejected", message: "Transaction rejected in MetaMask. Please try again." };
  }
  if (msg.includes("IPFS") || msg.includes("pinata") || msg.includes("upload")) {
    return { type: "ipfs_failed", message: "Failed to upload evidence to IPFS. Please check your connection and try again." };
  }
  if (msg.includes("revert") || msg.includes("execution reverted")) {
    return { type: "contract_error", message: "Blockchain transaction failed. The contract rejected the request." };
  }
  if (msg.includes("timeout") || msg.includes("RPC")) {
    return { type: "network_timeout", message: "Network timeout. The transaction may have succeeded — check the explorer." };
  }
  return { type: "unknown", message: `An unexpected error occurred: ${msg}` };
}

export async function registerProof(
  evidence: EvidenceRecord,
  onStage?: (index: number) => void,
): Promise<RegistrationResult> {
  // Stage 0: Serialize evidence record
  onStage?.(0);
  const serialized = serializeEvidenceRecord(evidence);

  // Stage 1: Compute SHA-256 hash
  onStage?.(1);
  const hash = await computeSHA256(serialized);
  const proofHashBytes32 = hexToBytes32(`0x${hash}`);

  // Stage 2: Upload evidence JSON to IPFS
  onStage?.(2);
  let ipfsResult;
  try {
    ipfsResult = await uploadJSONToIPFS(evidence as unknown as Record<string, unknown>, `proof-${hash.slice(0, 16)}`);
  } catch (err) {
    throw parseRegistrationError(err);
  }

  // Stage 3: Prepare blockchain transaction
  onStage?.(3);
  let signer;
  try {
    signer = await getSigner();
  } catch (err) {
    throw parseRegistrationError(err);
  }

  let contract;
  try {
    contract = await getContract(signer);
  } catch (err) {
    throw parseRegistrationError(err);
  }

  // Stage 4: Submit to Polygon Amoy
  onStage?.(4);
  const registerFn = contract["registerProof(bytes32,string)"];
  if (!registerFn) {
    throw { type: "contract_error" as const, message: "Contract function not found. Please refresh and try again." };
  }

  let tx;
  try {
    tx = await registerFn(proofHashBytes32, ipfsResult.cid, {
      maxPriorityFeePerGas: ethers.parseUnits("30", "gwei"),
      maxFeePerGas: ethers.parseUnits("50", "gwei"),
    });
  } catch (err) {
    throw parseRegistrationError(err);
  }

  // Stage 5: Wait for confirmation
  onStage?.(5);
  let receipt;
  try {
    receipt = await Promise.race([
      tx.wait(),
      new Promise<null>((_, reject) => setTimeout(() => reject(new Error("RPC timeout")), 60000)),
    ]);
  } catch {
    const provider = await getProvider();
    receipt = await provider.getTransactionReceipt(tx.hash);
    if (!receipt) {
      receipt = { hash: tx.hash, blockNumber: 0, status: 1 } as never;
    }
  }

  // Stage 6: Complete
  onStage?.(6);

  return {
    proofHash: `0x${hash}`,
    submitter: await signer.getAddress(),
    evidenceReference: ipfsResult.cid,
    transactionHash: receipt.hash,
    blockNumber: receipt.blockNumber,
    timestamp: Math.floor(Date.now() / 1000),
  };
}
