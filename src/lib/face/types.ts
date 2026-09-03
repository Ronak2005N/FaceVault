export interface FaceBoundingBox {
  originX: number;
  originY: number;
  width: number;
  height: number;
}

export interface FaceKeypoint {
  x: number;
  y: number;
}

export interface FaceDetection {
  boundingBox: FaceBoundingBox;
  confidence: number;
  keypoints: FaceKeypoint[];
}

export interface FaceEmbedding {
  vector: number[];
  dimension: number;
}

export interface FaceMatch {
  match: boolean;
  confidence: number;
  threshold: number;
}

export interface FaceAnalysisResult {
  detection: FaceDetection | null;
  embedding: FaceEmbedding | null;
  error?: string;
}
