import { ethers } from "ethers";
import { getContract, getReadOnlyProvider } from "./metamask";
import { CONTRACT_ADDRESS } from "./contracts";

export interface OnChainProof {
  proofHash: string;
  submitter: string;
  evidenceReference: string;
  timestamp: number;
}

export async function verifyOnChain(proofHash: string): Promise<OnChainProof | null> {
  try {
    const provider = getReadOnlyProvider();
    const contract = new ethers.Contract(CONTRACT_ADDRESS, [
      "function verifyProof(bytes32) view returns (bool, address, string, uint256)",
    ], provider);

    const result = await contract.verifyProof(proofHash);
    const exists = result[0] as boolean;

    if (!exists) return null;

    return {
      proofHash,
      submitter: result[1] as string,
      evidenceReference: result[2] as string,
      timestamp: Number(result[3]),
    };
  } catch {
    return null;
  }
}

export async function proofExists(proofHash: string): Promise<boolean> {
  try {
    const provider = getReadOnlyProvider();
    const contract = new ethers.Contract(CONTRACT_ADDRESS, [
      "function proofExists(bytes32) view returns (bool)",
    ], provider);
    return await contract.proofExists(proofHash);
  } catch {
    return false;
  }
}

export async function getProofCount(): Promise<number> {
  try {
    const provider = getReadOnlyProvider();
    const contract = new ethers.Contract(CONTRACT_ADDRESS, [
      "function getProofCount() view returns (uint256)",
    ], provider);
    const count: bigint = await contract.getProofCount();
    return Number(count);
  } catch {
    return 0;
  }
}

export async function compareHash(localHash: string, onChainHash: string): Promise<boolean> {
  return localHash.toLowerCase() === onChainHash.toLowerCase();
}
