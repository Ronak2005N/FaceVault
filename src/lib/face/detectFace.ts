import { FaceDetector, FilesetResolver } from "@mediapipe/tasks-vision";
import type { FaceDetection } from "./types";

const WASM_CDN = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm";
const FACE_DETECTOR_MODEL = "https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite";

let detector: FaceDetector | null = null;

async function getDetector(): Promise<FaceDetector> {
  if (detector) return detector;

  const vision = await FilesetResolver.forVisionTasks(WASM_CDN);
  detector = await FaceDetector.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: FACE_DETECTOR_MODEL,
      delegate: "GPU",
    },
    runningMode: "IMAGE",
    minDetectionConfidence: 0.5,
    minSuppressionThreshold: 0.3,
  });

  return detector;
}

export async function detectFace(
  imageSource: HTMLImageElement | HTMLCanvasElement
): Promise<FaceDetection[]> {
  const det = await getDetector();
  const result = det.detect(imageSource);

  return result.detections.map((d) => ({
    boundingBox: {
      originX: d.boundingBox?.originX ?? 0,
      originY: d.boundingBox?.originY ?? 0,
      width: d.boundingBox?.width ?? 0,
      height: d.boundingBox?.height ?? 0,
    },
    confidence: d.categories?.[0]?.score ?? 0,
    keypoints: d.keypoints?.map((kp) => ({ x: kp.x, y: kp.y })) ?? [],
  }));
}

export function resetDetector(): void {
  detector = null;
}
