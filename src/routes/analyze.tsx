import { useState, useEffect, useRef } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { runScanPipeline, type PipelineState } from "@/lib/pipeline";

export const Route = createFileRoute("/analyze")({
  component: AnalyzePage,
});

function AnalyzePage() {
  const navigate = useNavigate();
  const [state, setState] = useState<PipelineState | null>(null);
  const [running, setRunning] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const fileName = sessionStorage.getItem("scanFileName");
    const imageUrl = sessionStorage.getItem("scanImage");
    if (!imageUrl || !fileName) {
      navigate({ to: "/scan" });
      return;
    }

    if (running || state) return;

    setRunning(true);
    fetch(imageUrl)
      .then((r) => r.blob())
      .then((blob) => new File([blob], fileName, { type: blob.type }))
      .then((file) => runScanPipeline(file, undefined, setState))
      .catch(() => {})
      .finally(() => setRunning(false));
  }, [navigate, running, state]);

  useEffect(() => {
    if (!state?.results.detection || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      ctx.drawImage(img, 0, 0);

      const det = state.results.detection!;
      const style = getComputedStyle(document.documentElement);
      const accent = style.getPropertyValue("--color-accent").trim() || "#2563eb";
      ctx.strokeStyle = accent;
      ctx.lineWidth = 3;
      ctx.strokeRect(
        det.boundingBox.originX,
        det.boundingBox.originY,
        det.boundingBox.width,
        det.boundingBox.height
      );

      ctx.fillStyle = accent;
      ctx.font = "12px Geist Mono, monospace";
      ctx.fillText(
        `${(det.confidence * 100).toFixed(1)}%`,
        det.boundingBox.originX,
        det.boundingBox.originY - 6
      );
    };
    img.src = sessionStorage.getItem("scanImage") || "";
  }, [state?.results.detection]);

  const stages = state?.stages || [];
  const error = state?.error;
  const embedding = state?.results.embedding;
  const detection = state?.results.detection;
  const evidences = state?.results.evidences;
  const evidenceRecord = state?.results.evidenceRecord;
  const allDone = stages.every((s) => s.state === "done");

  const goEvidence = () => {
    if (evidenceRecord) {
      sessionStorage.setItem("evidenceRecord", JSON.stringify(evidenceRecord));
      sessionStorage.setItem("pipelineResults", JSON.stringify(state?.results));
      navigate({ to: "/evidence" });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <PageHeader backTo="/scan" backLabel="Scan" title="Analysis" step={1} />

      <div className="mx-auto max-w-2xl px-6 pt-24 pb-16">
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight">Analyzing face</h1>
          <p className="mt-2 text-[14px] text-muted-foreground">
            Running detection, embedding extraction, and web discovery.
          </p>
        </div>

        {detection && (
          <div className="mb-6 overflow-hidden rounded-xl border border-border bg-card">
            <div className="px-5 py-3 border-b border-border">
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-medium text-foreground">Face detected</span>
                <span className="rounded-full bg-success/10 px-2.5 py-0.5 text-[11px] font-medium text-success">
                  {(detection.confidence * 100).toFixed(1)}% confidence
                </span>
              </div>
            </div>
            <canvas
              ref={canvasRef}
              className="w-full max-h-60 object-contain bg-muted/30"
            />
          </div>
        )}

        {/* Pipeline stages */}
        <div className="space-y-1">
          {stages.map((stage, i) => {
            const isLast = i === stages.length - 1;
            return (
              <div key={i} className="flex items-stretch gap-4">
                {/* Timeline */}
                <div className="flex flex-col items-center">
                  <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                    stage.state === "done"
                      ? "bg-success/10 text-success"
                      : stage.state === "active"
                      ? "bg-accent/10 text-accent"
                      : stage.state === "error"
                      ? "bg-destructive/10 text-destructive"
                      : "bg-muted text-muted-foreground"
                  }`}>
                    {stage.state === "done" && <CheckCircle2 className="h-3.5 w-3.5" />}
                    {stage.state === "active" && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    {stage.state === "error" && <AlertCircle className="h-3.5 w-3.5" />}
                    {stage.state === "pending" && (
                      <span className="font-mono text-[10px]">{String(i + 1).padStart(2, "0")}</span>
                    )}
                  </div>
                  {!isLast && (
                    <div className={`w-px flex-1 min-h-[24px] ${
                      stage.state === "done" ? "bg-success/30" : "bg-border"
                    }`} />
                  )}
                </div>

                {/* Content */}
                <div className={`pb-6 ${isLast ? "pb-0" : ""}`}>
                  <span className={`text-[13px] ${
                    stage.state === "done"
                      ? "text-muted-foreground"
                      : stage.state === "active"
                      ? "text-foreground font-medium"
                      : stage.state === "error"
                      ? "text-destructive"
                      : "text-muted-foreground"
                  }`}>
                    {stage.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {error && (
          <div className="mt-6 rounded-xl border border-destructive/20 bg-destructive/5 px-5 py-4">
            <p className="text-[13px] text-destructive">{error.message}</p>
            {error.recoverable && (
              <Link
                to="/scan"
                className="mt-2 inline-block text-[12px] font-medium text-destructive underline underline-offset-2"
              >
                Try another image
              </Link>
            )}
          </div>
        )}

        {allDone && evidenceRecord && (
          <div className="mt-8 rounded-xl border border-border bg-card overflow-hidden">
            <div className="px-5 py-4 border-b border-border">
              <h2 className="text-[15px] font-semibold">Analysis complete</h2>
            </div>
            <div className="px-5 py-4">
              <div className="space-y-3">
                {embedding && (
                  <div className="flex justify-between text-[13px]">
                    <span className="text-muted-foreground">Embedding</span>
                    <span className="font-mono text-foreground">
                      {embedding.dimension}d vector
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-[13px]">
                  <span className="text-muted-foreground">Search results</span>
                  <span className="font-mono text-foreground">
                    {state?.results.searchResults.length || 0} found
                  </span>
                </div>
                <div className="flex justify-between text-[13px]">
                  <span className="text-muted-foreground">Evidence records</span>
                  <span className="font-mono text-foreground">
                    {evidences?.length || 0} collected
                  </span>
                </div>
                <div className="flex justify-between text-[13px]">
                  <span className="text-muted-foreground">Evidence hash</span>
                  <span className="font-mono text-foreground text-[11px]">
                    {evidenceRecord.evidenceHash.slice(0, 20)}...
                  </span>
                </div>
              </div>
            </div>
            <div className="px-5 py-4 border-t border-border">
              <button
                onClick={goEvidence}
                className="w-full rounded-lg bg-accent px-4 py-2.5 text-[13px] font-medium text-accent-foreground transition-all hover:shadow-lg hover:shadow-accent/20"
              >
                Review evidence
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
