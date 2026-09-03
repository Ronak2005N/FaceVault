import { detectFace } from "./face/detectFace";
import { extractEmbedding } from "./face/extractEmbedding";
import { reverseImageSearch } from "./discovery/searchWeb";
import { collectEvidence } from "./discovery/collectEvidence";
import { buildEvidenceRecord } from "./discovery/buildEvidence";
import { registerProof } from "./proof/registerProof";
import { computeSHA256 } from "./crypto";
import type { EvidenceRecord } from "./types";
import type { PipelineStage, PipelineState, PipelineError } from "./pipeline/types";
import type { RegistrationResult } from "./proof/types";

export type { PipelineState, PipelineStage, PipelineError };

const INITIAL_STATE: PipelineState = {
  currentStage: "face_detection",
  stages: [
    { label: "Face detection", state: "pending" },
    { label: "Embedding extraction", state: "pending" },
    { label: "Web search", state: "pending" },
    { label: "Evidence collection", state: "pending" },
    { label: "Evidence record", state: "pending" },
  ],
  results: {
    detection: null,
    embedding: null,
    searchResults: [],
    evidences: [],
    evidenceRecord: null,
  },
  error: null,
};

function cloneState(state: PipelineState): PipelineState {
  return {
    ...state,
    stages: state.stages.map((s) => ({ ...s })),
    results: { ...state.results },
  };
}

function updateStage(
  state: PipelineState,
  stage: PipelineStage,
  stageState: "pending" | "active" | "done" | "error"
): PipelineState {
  const stageIndex = [
    "face_detection",
    "embedding_extraction",
    "web_search",
    "evidence_collection",
    "evidence_record",
  ].indexOf(stage);

  const stages = state.stages.map((s, i) =>
    i === stageIndex ? { ...s, state: stageState } : s
  );

  return { ...state, currentStage: stage, stages };
}

export async function runScanPipeline(
  imageFile: File,
  searchDescription?: string,
  onStateChange?: (state: PipelineState) => void
): Promise<PipelineState> {
  let state = cloneState(INITIAL_STATE);

  let img: HTMLImageElement;
  try {
    img = await loadImage(imageFile);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to load image";
    state = {
      ...state,
      error: { stage: "face_detection", type: "load_failed", message: msg, recoverable: true },
    };
    state = updateStage(state, "face_detection", "error");
    onStateChange?.(state);
    return state;
  }

  // Stage 1: Face Detection
  state = updateStage(state, "face_detection", "active");
  onStateChange?.(state);

  try {
    const detections = await detectFace(img);
    if (detections.length === 0) {
      state = {
        ...state,
        error: {
          stage: "face_detection",
          type: "no_face",
          message: "No face detected. Please upload a clearer image with a visible face.",
          recoverable: true,
        },
      };
      state = updateStage(state, "face_detection", "error");
      onStateChange?.(state);
      return state;
    }
    state.results = { ...state.results, detection: detections[0] ?? null };
    state = updateStage(state, "face_detection", "done");
    onStateChange?.(state);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Face detection failed";
    state = {
      ...state,
      error: { stage: "face_detection", type: "detection_failed", message: msg, recoverable: true },
    };
    state = updateStage(state, "face_detection", "error");
    onStateChange?.(state);
    return state;
  }

  // Stage 2: Embedding Extraction
  state = updateStage(state, "embedding_extraction", "active");
  onStateChange?.(state);

  try {
    const embedding = await extractEmbedding(img);
    state.results = { ...state.results, embedding };
    state = updateStage(state, "embedding_extraction", "done");
    onStateChange?.(state);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Embedding extraction failed";
    state = {
      ...state,
      error: { stage: "embedding_extraction", type: "extraction_failed", message: msg, recoverable: true },
    };
    state = updateStage(state, "embedding_extraction", "error");
    onStateChange?.(state);
    return state;
  }

  // Stage 3: Reverse-image search (Google Lens via SerpApi)
  state = updateStage(state, "web_search", "active");
  onStateChange?.(state);

  // Genuine reverse-image search via Google Lens
  const { results: lensResults, error: lensError } = await reverseImageSearch(
    imageFile
  );

  const searchResults = lensResults;
  const searchError = lensError;

  state.results = { ...state.results, searchResults };

  if (searchError && searchError.type === "no_results") {
    state = updateStage(state, "web_search", "done");
    onStateChange?.(state);
  } else if (searchError && searchResults.length === 0) {
    state = {
      ...state,
      error: {
        stage: "web_search",
        type: searchError.type,
        message: searchError.message,
        recoverable: true,
      },
    };
    state = updateStage(state, "web_search", "error");
    onStateChange?.(state);
  } else {
    state = updateStage(state, "web_search", "done");
    onStateChange?.(state);
  }

  // Stage 4: Evidence Collection
  if (state.results.searchResults.length > 0) {
    state = updateStage(state, "evidence_collection", "active");
    onStateChange?.(state);

    try {
      const evidences = await collectEvidence(state.results.searchResults);
      state.results = { ...state.results, evidences };
      state = updateStage(state, "evidence_collection", "done");
      onStateChange?.(state);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Evidence collection failed";
      state = {
        ...state,
        error: {
          stage: "evidence_collection",
          type: "collection_failed",
          message: msg,
          recoverable: true,
        },
      };
      state = updateStage(state, "evidence_collection", "error");
      onStateChange?.(state);
    }
  } else {
    state = updateStage(state, "evidence_collection", "done");
    onStateChange?.(state);
  }

  // Stage 5: Build Evidence Record
  state = updateStage(state, "evidence_record", "active");
  onStateChange?.(state);

  try {
    const embeddingHash = state.results.embedding
      ? `0x${await computeSHA256(JSON.stringify(state.results.embedding.vector))}`
      : "0x0000000000000000000000000000000000000000000000000000000000000000";

    const firstEvidence = state.results.evidences[0];
    if (firstEvidence) {
      const record = await buildEvidenceRecord(
        embeddingHash,
        firstEvidence,
        state.results.detection?.confidence || 0
      );
      state.results = { ...state.results, evidenceRecord: record };
    } else {
      const fallbackRecord: EvidenceRecord = {
        subjectIdentifier: embeddingHash,
        source: "manual",
        discoveredURL: "",
        matchConfidence: 0,
        evidenceHash: "",
        timestamp: new Date().toISOString(),
        version: "1.0",
      };
      const serialized = JSON.stringify(
        Object.keys(fallbackRecord)
          .sort()
          .reduce((acc, key) => {
            acc[key] = fallbackRecord[key as keyof EvidenceRecord];
            return acc;
          }, {} as Record<string, unknown>)
      );
      fallbackRecord.evidenceHash = `0x${await computeSHA256(serialized)}`;
      state.results = { ...state.results, evidenceRecord: fallbackRecord };
    }

    state = updateStage(state, "evidence_record", "done");
    onStateChange?.(state);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Evidence record build failed";
    state = {
      ...state,
      error: {
        stage: "evidence_record",
        type: "build_failed",
        message: msg,
        recoverable: true,
      },
    };
    state = updateStage(state, "evidence_record", "error");
    onStateChange?.(state);
  }

  return state;
}

export async function runRegistrationPipeline(
  evidence: EvidenceRecord,
  onStateChange?: (state: PipelineState) => void
): Promise<RegistrationResult> {
  return registerProof(evidence, (index) => {
    onStateChange?.({
      ...INITIAL_STATE,
      currentStage: "evidence_record",
      stages: [
        { label: "Serializing", state: index >= 0 ? "done" : "active" },
        { label: "Hashing", state: index >= 1 ? "done" : index === 1 ? "active" : "pending" },
        { label: "IPFS upload", state: index >= 2 ? "done" : index === 2 ? "active" : "pending" },
        { label: "Preparing TX", state: index >= 3 ? "done" : index === 3 ? "active" : "pending" },
        { label: "Submitting", state: index >= 4 ? "done" : index === 4 ? "active" : "pending" },
        { label: "Confirming", state: index >= 5 ? "done" : index === 5 ? "active" : "pending" },
        { label: "Complete", state: index >= 6 ? "done" : "pending" },
      ],
      results: INITIAL_STATE.results,
      error: null,
    });
  });
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Failed to load image"));
    };
    img.src = objectUrl;
  });
}
