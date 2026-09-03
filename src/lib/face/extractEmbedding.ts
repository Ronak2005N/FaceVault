import { FaceLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";
import type { FaceEmbedding } from "./types";

const WASM_CDN = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm";
const FACE_LANDMARKER_MODEL = "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/latest/face_landmarker.task";

let landmarker: FaceLandmarker | null = null;

async function getLandmarker(): Promise<FaceLandmarker> {
  if (landmarker) return landmarker;

  const vision = await FilesetResolver.forVisionTasks(WASM_CDN);
  landmarker = await FaceLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: FACE_LANDMARKER_MODEL,
      delegate: "GPU",
    },
    runningMode: "IMAGE",
    numFaces: 1,
    outputFaceBlendshapes: false,
    outputFacialTransformationMatrixes: false,
  });

  return landmarker;
}

function normalizeLandmarks(landmarks: { x: number; y: number; z: number }[]): number[] {
  const vector: number[] = [];
  for (const lm of landmarks) {
    vector.push(lm.x, lm.y, lm.z);
  }

  let norm = 0;
  for (const v of vector) {
    norm += v * v;
  }
  norm = Math.sqrt(norm);

  if (norm === 0) return vector;
  return vector.map((v) => v / norm);
}

export async function extractEmbedding(
  imageSource: HTMLImageElement | HTMLCanvasElement
): Promise<FaceEmbedding | null> {
  const lm = await getLandmarker();
  const result = lm.detect(imageSource);

  if (result.faceLandmarks.length === 0) return null;

  const landmarks = result.faceLandmarks[0];
  const vector = normalizeLandmarks(landmarks);

  return {
    vector,
    dimension: vector.length,
  };
}

export function resetLandmarker(): void {
  landmarker = null;
}
