import type { FaceDetection, FaceEmbedding } from "../face/types";
import type { SearchResult, CollectedEvidence } from "../discovery/types";
import type { EvidenceRecord } from "../types";

export type PipelineStage =
  | "face_detection"
  | "embedding_extraction"
  | "web_search"
  | "evidence_collection"
  | "evidence_record";

export interface PipelineState {
  currentStage: PipelineStage;
  stages: { label: string; state: "pending" | "active" | "done" | "error" }[];
  results: {
    detection: FaceDetection | null;
    embedding: FaceEmbedding | null;
    searchResults: SearchResult[];
    evidences: CollectedEvidence[];
    evidenceRecord: EvidenceRecord | null;
  };
  error: PipelineError | null;
}

export interface PipelineError {
  stage: PipelineStage;
  type: string;
  message: string;
  recoverable: boolean;
}

export const PIPELINE_STAGES = [
  { key: "face_detection" as const, label: "Face detection" },
  { key: "embedding_extraction" as const, label: "Embedding extraction" },
  { key: "web_search" as const, label: "Web search" },
  { key: "evidence_collection" as const, label: "Evidence collection" },
  { key: "evidence_record" as const, label: "Evidence record" },
];
