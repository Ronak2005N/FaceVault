import { useState, useEffect } from "react";
import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { ArrowLeft, CheckCircle2, ExternalLink, Loader2 } from "lucide-react";
import { verifyProof } from "@/lib/proof/verifyProof";
import { CONTRACT_ADDRESS } from "@/lib/blockchain/contracts";
import { HashDisplay } from "@/components/HashDisplay";
import { StatusBadge } from "@/components/StatusBadge";
import { ThemeToggle } from "@/components/ThemeToggle";
import type { VerificationResult } from "@/lib/types";

export const Route = createFileRoute("/result/$hash")({
  component: ResultPage,
});

function ResultPage() {
  const { hash } = useParams({ from: "/result/$hash" });
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    verifyProof(hash)
      .then((res) => {
        setResult(res);
      })
      .catch(() => {
        setResult({
          outcome: "error",
          proofHash: hash,
          checks: [],
          error: { type: "network_error", message: "Failed to query blockchain." },
        });
      })
      .finally(() => setLoading(false));
  }, [hash]);

  return (
    <div className="min-h-screen bg-background">
      <nav className="fixed top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center gap-4 px-6 h-14">
          <Link
            to="/"
            className="flex items-center gap-2 text-[13px] text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Home
          </Link>
          <span className="text-border">|</span>
          <span className="text-[13px] font-medium">Result</span>
          <div className="ml-auto">
            <ThemeToggle />
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-2xl px-6 pt-24 pb-16">
        <h1 className="text-2xl font-bold tracking-tight">Verification result</h1>
        <p className="mt-2 font-mono text-[12px] text-muted-foreground break-all">{hash}</p>

        {loading ? (
          <div className="mt-16 flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 text-accent animate-spin" />
            <p className="text-[14px] text-muted-foreground">Querying blockchain...</p>
          </div>
        ) : result?.outcome === "verified" && result.proof ? (
          <div className="mt-8 space-y-5">
            <div className="rounded-xl border border-success/20 bg-success/5 p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-success" />
                  <h2 className="text-[15px] font-semibold text-success">Verified</h2>
                </div>
                <StatusBadge status="verified" />
              </div>
              <p className="mt-2 text-[13px] text-muted-foreground">
                This proof exists on Polygon Amoy and is publicly verifiable.
              </p>
            </div>

            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="px-5 py-3 border-b border-border">
                <h3 className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
                  Proof details
                </h3>
              </div>
              <div className="px-5 py-4 space-y-3">
                <div className="flex justify-between text-[13px]">
                  <span className="text-muted-foreground">Proof hash</span>
                  <HashDisplay hash={result.proof.proofHash} length={20} />
                </div>
                <div className="flex justify-between text-[13px]">
                  <span className="text-muted-foreground">Submitter</span>
                  <span className="font-mono text-foreground text-[11px]">
                    {result.proof.submitter.slice(0, 16)}...
                  </span>
                </div>
                <div className="flex justify-between text-[13px]">
                  <span className="text-muted-foreground">IPFS CID</span>
                  <span className="font-mono text-foreground text-[11px]">
                    {result.proof.evidenceReference.slice(0, 24)}...
                  </span>
                </div>
                <div className="flex justify-between text-[13px]">
                  <span className="text-muted-foreground">Timestamp</span>
                  <span className="text-foreground">
                    {new Date(result.proof.timestamp * 1000).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {result.evidence && (
              <div className="rounded-xl border border-border bg-card overflow-hidden">
                <div className="px-5 py-3 border-b border-border">
                  <h3 className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
                    Discovered evidence
                  </h3>
                </div>
                <div className="px-5 py-4 space-y-3">
                  {result.evidence.discoveredURL && (
                    <div className="flex justify-between text-[13px]">
                      <span className="text-muted-foreground">Source URL</span>
                      <a
                        href={result.evidence.discoveredURL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono text-accent text-[11px] max-w-[280px] truncate hover:underline"
                      >
                        {result.evidence.discoveredURL}
                      </a>
                    </div>
                  )}
                  <div className="flex justify-between text-[13px]">
                    <span className="text-muted-foreground">Search source</span>
                    <span className="rounded bg-accent/10 px-2 py-0.5 font-mono text-[12px] text-accent">
                      {result.evidence.source}
                    </span>
                  </div>
                  <div className="flex justify-between text-[13px]">
                    <span className="text-muted-foreground">Match confidence</span>
                    <span className="font-mono text-foreground text-[11px]">
                      {(result.evidence.matchConfidence * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between text-[13px]">
                    <span className="text-muted-foreground">Evidence hash</span>
                    <HashDisplay hash={result.evidence.evidenceHash} length={16} />
                  </div>
                </div>
              </div>
            )}

            {result.checks.length > 0 && (
              <div className="rounded-xl border border-border bg-card overflow-hidden">
                <div className="px-5 py-3 border-b border-border">
                  <h3 className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
                    Verification checks
                  </h3>
                </div>
                <div className="px-5 py-3 space-y-1">
                  {result.checks.map((check, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between rounded-lg px-3 py-2"
                    >
                      <span className="text-[13px] text-foreground">{check.label}</span>
                      <span
                        className={`text-[12px] font-mono ${
                          check.pass ? "text-success" : "text-destructive"
                        }`}
                      >
                        {check.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <a
                href={`https://amoy.polygonscan.com/address/${CONTRACT_ADDRESS}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 rounded-xl border border-border bg-card px-4 py-3 text-center text-[13px] font-medium text-card-foreground transition-all hover:shadow-md inline-flex items-center justify-center gap-2"
              >
                PolygonScan
                <ExternalLink className="h-3 w-3" />
              </a>
              <Link
                to="/scan"
                className="flex-1 rounded-xl bg-accent px-4 py-3 text-center text-[13px] font-medium text-accent-foreground transition-all hover:shadow-lg hover:shadow-accent/20"
              >
                New scan
              </Link>
            </div>
          </div>
        ) : result?.outcome === "not_found" ? (
          <div className="mt-8 rounded-xl border border-border bg-card p-8 text-center">
            <StatusBadge status="not_found" />
            <p className="mt-4 text-[15px] font-medium">Not found</p>
            <p className="mt-2 text-[13px] text-muted-foreground">
              {result.error?.message || "No proof with this hash exists on-chain."}
            </p>
            <Link
              to="/scan"
              className="mt-6 inline-block rounded-lg bg-accent px-5 py-2.5 text-[13px] font-medium text-accent-foreground transition-all hover:shadow-lg hover:shadow-accent/20"
            >
              Start scanning
            </Link>
          </div>
        ) : (
          <div className="mt-8 rounded-xl border border-destructive/20 bg-destructive/5 p-8 text-center">
            <StatusBadge status="error" />
            <p className="mt-4 text-[15px] font-medium text-destructive">Error</p>
            <p className="mt-2 text-[13px] text-muted-foreground">
              {result?.error?.message || "Verification failed."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
