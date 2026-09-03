import { computeSHA256 } from "../crypto";
import type { CollectedEvidence } from "./types";
import type { EvidenceRecord } from "../types";

function serializeEvidenceRecord(record: EvidenceRecord): string {
  const sorted = Object.keys(record)
    .sort()
    .reduce((acc, key) => {
      acc[key] = record[key as keyof EvidenceRecord];
      return acc;
    }, {} as Record<string, unknown>);
  return JSON.stringify(sorted);
}

export async function buildEvidenceRecord(
  embeddingHash: string,
  evidence: CollectedEvidence,
  matchConfidence: number
): Promise<EvidenceRecord> {
  const record: EvidenceRecord = {
    subjectIdentifier: embeddingHash,
    source: evidence.searchResult.source,
    discoveredURL: evidence.searchResult.url,
    matchConfidence,
    evidenceHash: "",
    timestamp: evidence.collectedAt,
    version: "1.0",
  };

  const serialized = serializeEvidenceRecord(record);
  const hash = await computeSHA256(serialized);

  record.evidenceHash = `0x${hash}`;

  return record;
}

export async function buildEvidenceRecords(
  embeddingHash: string,
  evidences: CollectedEvidence[],
  matchConfidence: number
): Promise<EvidenceRecord[]> {
  const records: EvidenceRecord[] = [];

  for (const evidence of evidences) {
    const record = await buildEvidenceRecord(embeddingHash, evidence, matchConfidence);
    records.push(record);
  }

  return records;
}
