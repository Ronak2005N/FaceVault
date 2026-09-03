import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Search, ArrowRight, Loader2, CheckCircle2, ExternalLink, Shield } from "lucide-react";
import { verifyProof } from "@/lib/proof/verifyProof";
import { isHashLike } from "@/lib/helpers";
import { CONTRACT_ADDRESS } from "@/lib/blockchain/contracts";
import { HashDisplay } from "@/components/HashDisplay";
import { ThemeToggle } from "@/components/ThemeToggle";
import { MobileNav } from "@/components/MobileNav";
import type { VerificationResult } from "@/lib/types";

export const Route = createFileRoute("/verify")({
  component: VerifyPage,
});

function VerifyPage() {
  const [hash, setHash] = useState("");
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleVerify = async () => {
    const clean = hash.trim();
    if (!clean) {
      setError("Enter a proof hash to verify.");
      return;
    }
    if (!isHashLike(clean)) {
      setError("Invalid format. Expected 0x + 64 hex characters.");
      return;
    }

    setError(null);
    setLoading(true);
    setResult(null);

    try {
      const res = await verifyProof(clean);
      setResult(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <nav className="fixed top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 h-14">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-accent text-accent-foreground">
              <Shield className="h-3.5 w-3.5" />
            </div>
            <span className="text-sm font-semibold tracking-tight">FaceChain</span>
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link
              to="/scan"
              className="rounded-md bg-foreground px-4 py-1.5 text-[13px] font-medium text-background transition-opacity hover:opacity-90"
            >
              Start scanning
            </Link>
            <MobileNav />
          </div>
        </div>
      </nav>

      <div className="flex min-h-screen items-center justify-center px-6 pt-14">
        <div className="w-full max-w-lg">
          <div className="text-center mb-8">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground">
              <Shield className="h-5 w-5" />
            </div>
            <h1 className="mt-5 text-2xl font-bold tracking-tight">Verify a proof</h1>
            <p className="mt-2 text-[14px] text-muted-foreground">
              Enter a proof hash to verify its existence on Polygon Amoy.
              No wallet required.
            </p>
          </div>

          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <label className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
              Proof hash
            </label>
            <div className="mt-2 flex gap-2">
              <input
                type="text"
                value={hash}
                onChange={(e) => {
                  setHash(e.target.value);
                  setError(null);
                }}
                onKeyDown={(e) => e.key === "Enter" && handleVerify()}
                placeholder="0x..."
                className="flex-1 rounded-lg border border-border bg-background px-3 py-2.5 font-mono text-[13px] text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
              />
              <button
                onClick={handleVerify}
                disabled={loading || !hash.trim()}
                className="flex items-center gap-2 rounded-lg bg-accent px-5 py-2.5 text-[13px] font-medium text-accent-foreground transition-all hover:shadow-lg hover:shadow-accent/20 disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Search className="h-3.5 w-3.5" />
                )}
                Verify
              </button>
            </div>
            {error && (
              <p className="mt-2 text-[12px] text-destructive">{error}</p>
            )}
          </div>

          {result && (
            <div className="mt-6 space-y-4">
              {result.outcome === "verified" && result.proof && (
                <>
                  <div className="rounded-xl border border-success/20 bg-success/5 p-5">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-success" />
                      <h2 className="text-[15px] font-semibold text-success">Verified</h2>
                    </div>
                    <p className="mt-1 text-[13px] text-muted-foreground">
                      This proof exists on Polygon Amoy.
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
                          {result.proof.evidenceReference.slice(0, 20)}...
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
                              className="font-mono text-accent text-[11px] max-w-[260px] truncate hover:underline"
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

                  <a
                    href={`https://amoy.polygonscan.com/address/${CONTRACT_ADDRESS}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-3 text-[13px] font-medium text-card-foreground transition-all hover:shadow-md"
                  >
                    View on PolygonScan
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </>
              )}

              {result.outcome === "not_found" && (
                <div className="rounded-xl border border-border bg-card p-8 text-center">
                  <h2 className="text-[15px] font-medium">Not found</h2>
                  <p className="mt-2 text-[13px] text-muted-foreground">
                    {result.error?.message || "No proof with this hash exists on-chain."}
                  </p>
                  <Link
                    to="/scan"
                    className="mt-6 inline-flex items-center gap-2 rounded-lg bg-accent px-5 py-2.5 text-[13px] font-medium text-accent-foreground transition-all hover:shadow-lg hover:shadow-accent/20"
                  >
                    Start scanning
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              )}

              {result.outcome === "error" && (
                <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-6 text-center">
                  <h2 className="text-[15px] font-medium text-destructive">Error</h2>
                  <p className="mt-2 text-[13px] text-muted-foreground">
                    {result.error?.message || "Verification failed."}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
