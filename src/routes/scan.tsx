import { useState, useRef, useCallback } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Upload, X, Camera, Image as ImageIcon } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";

export const Route = createFileRoute("/scan")({
  component: ScanPage,
});

function ScanPage() {
  const navigate = useNavigate();
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const previewUrlRef = useRef<string | null>(null);

  const handleFile = useCallback((f: File) => {
    if (!f.type.startsWith("image/")) return;
    if (f.size > 10 * 1024 * 1024) {
      alert("File too large. Max size is 10MB.");
      return;
    }
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    const url = URL.createObjectURL(f);
    previewUrlRef.current = url;
    setFile(f);
    setPreview(url);
    setCameraActive(false);
    stopCamera();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const f = e.dataTransfer.files[0];
      if (f) handleFile(f);
    },
    [handleFile]
  );

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: 640, height: 480 },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraActive(true);
      setPreview(null);
      setFile(null);
    } catch {
      alert("Camera access denied. Please allow camera permissions.");
    }
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCameraActive(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext("2d")?.drawImage(videoRef.current, 0, 0);
    canvas.toBlob((blob) => {
      if (blob) {
        const f = new File([blob], "capture.jpg", { type: "image/jpeg" });
        setFile(f);
        setPreview(URL.createObjectURL(blob));
        stopCamera();
      }
    }, "image/jpeg", 0.92);
  };

  const clear = () => {
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    previewUrlRef.current = null;
    setPreview(null);
    setFile(null);
    stopCamera();
  };

  const goAnalyze = () => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    sessionStorage.setItem("scanImage", url);
    sessionStorage.setItem("scanFileName", file.name);
    navigate({ to: "/analyze" });
  };

  return (
    <div className="min-h-screen bg-background">
      <PageHeader backTo="/" title="Scan face" step={0} />

      <div className="flex min-h-screen items-center justify-center px-6 pt-14">
        <div className="w-full max-w-lg">
          <div className="mb-8">
            <h1 className="text-2xl font-bold tracking-tight">Scan a face</h1>
            <p className="mt-2 text-[14px] text-muted-foreground">
              Upload or capture a face image to begin analysis.
            </p>
          </div>

          <div>
            {preview ? (
              <div className="overflow-hidden rounded-xl border border-border bg-card">
                <div className="relative">
                  <img
                    src={preview}
                    alt="Uploaded face image preview"
                    className="w-full object-contain max-h-80"
                  />
                  <button
                    onClick={clear}
                    aria-label="Remove image"
                    className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-lg bg-background/80 text-muted-foreground backdrop-blur-sm transition-colors hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="border-t border-border px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
                      <ImageIcon className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-medium text-foreground truncate">{file?.name}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {file ? `${(file.size / 1024).toFixed(0)} KB` : ""}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={goAnalyze}
                    className="mt-4 w-full rounded-lg bg-accent px-4 py-2.5 text-[13px] font-medium text-accent-foreground transition-all hover:shadow-lg hover:shadow-accent/20"
                  >
                    Analyze face
                  </button>
                </div>
              </div>
            ) : cameraActive ? (
              <div className="overflow-hidden rounded-xl border border-border bg-card">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full max-h-80 object-cover"
                />
                <div className="border-t border-border px-5 py-4 flex gap-2">
                  <button
                    onClick={stopCamera}
                    className="flex-1 rounded-lg border border-border bg-card px-4 py-2.5 text-[13px] font-medium text-card-foreground transition-all hover:shadow-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={capturePhoto}
                    className="flex-1 rounded-lg bg-accent px-4 py-2.5 text-[13px] font-medium text-accent-foreground transition-all hover:shadow-lg hover:shadow-accent/20"
                  >
                    Capture
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => inputRef.current?.click()}
                  className={`flex cursor-pointer flex-col items-center rounded-xl border-2 border-dashed p-12 transition-all ${
                    isDragging
                      ? "border-accent bg-accent/5 scale-[1.01]"
                      : "border-border bg-card hover:border-muted-foreground/30 hover:shadow-sm"
                  }`}
                >
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-muted">
                    <Upload className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <p className="mt-5 text-[14px] font-medium text-foreground">
                    Drop an image here
                  </p>
                  <p className="mt-1 text-[13px] text-muted-foreground">
                    or click to browse
                  </p>
                  <p className="mt-4 text-[11px] text-muted-foreground/70">
                    JPG, PNG, WebP — up to 10MB
                  </p>
                </div>

                <div className="relative my-5">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-[11px]">
                    <span className="bg-background px-3 text-muted-foreground">or</span>
                  </div>
                </div>

                <button
                  onClick={startCamera}
                  className="w-full flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-3 text-[13px] font-medium text-card-foreground transition-all hover:shadow-sm hover:border-muted-foreground/30"
                >
                  <Camera className="h-4 w-4" />
                  Use camera
                </button>
              </>
            )}

            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
