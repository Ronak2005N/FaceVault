export { detectFace, resetDetector } from "./detectFace";
export { extractEmbedding, resetLandmarker } from "./extractEmbedding";
export { cosineSimilarity, compareFaces } from "./compareFaces";
export type {
  FaceDetection,
  FaceEmbedding,
  FaceMatch,
  FaceAnalysisResult,
  FaceBoundingBox,
  FaceKeypoint,
} from "./types";
