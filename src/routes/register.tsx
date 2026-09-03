import { useState, useEffect } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Loader2, CheckCircle2, ExternalLink, Wallet } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { HashDisplay } from "@/components/HashDisplay";
import { useWallet } from "@/lib/hooks/useWallet";
import { runRegistrationPipeline } from "@/lib/pipeline";
import { explorerTx } from "@/lib/helpers";
import type { EvidenceRecord } from "@/lib/types";
import type { RegistrationResult } from "@/lib/proof/types";

export const Route = createFileRoute("/register")({
  component: RegisterPage,
});

const REG_STAGES = [
  "Serializing",
  "Computing hash",
  "Uploading to IPFS",
  "Preparing transaction",
  "Submitting to Polygon",
  "Waiting for confirmation",
  "Complete",
];

function RegisterPage() {
  const navigate = useNavigate();
  const { isConnected, connect, isConnecting, address, balance, chainId, shortenAddress } = useWallet();
  const [record, setRecord] = useState<EvidenceRecord | null>(null);
  const [stageIndex, setStageIndex] = useState(-1);
  const [result, setResult] = useState<RegistrationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    const stored = sessionStorage.getItem("evidenceRecord");
    if (!stored) {
      navigate({ to: "/scan" });
      return;
    }
    setRecord(JSON.parse(stored));
  }, [navigate]);

  const register = async () => {
    if (!record || running) return;
    setRunning(true);
    setError(null);

    try {
      const res = await runRegistrationPipeline(record, (state) => {
        const idx = state.stages.findIndex((s) => s.state === "active");
        setStageIndex(idx >= 0 ? idx : stageIndex);
      });
      setResult(res);
      sessionStorage.setItem("lastProofHash", res.proofHash);
      sessionStorage.setItem("lastRegistration", JSON.stringify(res));
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Registration failed";
      setError(msg);
    } finally {
      setRunning(false);
    }
  };

  if (!record) return null;

  return (
    <div className="min-h-screen bg-background">
      <PageHeader backTo="/evidence" backLabel="Evidence" title="Register" step={3} />

      <div className="mx-auto max-w-2xl px-6 pt-24 pb-16">
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight">Register proof</h1>
          <p className="mt-2 text-[14px] text-muted-foreground">
            Hash the evidence record and register it on Polygon Amoy.
          </p>
        </div>

        {isConnected && !result && (
          <div className="mb-6 rounded-xl border border-border bg-card overflow-hidden">
            <div className="px-5 py-3 border-b border-border flex items-center gap-2">
              <Wallet className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
                Wallet
              </span>
            </div>
            <div className="px-5 py-4 space-y-2">
              <div className="flex justify-between text-[13px]">
                <span className="text-muted-foreground">Network</span>
                <span className="text-foreground">Polygon Amoy</span>
              </div>
              <div className="flex justify-between text-[13px]">
                <span className="text-muted-foreground">Address</span>
                <span className="font-mono text-foreground text-[11px]">{shortenAddress(address)}</span>
              </div>
              <div className="flex justify-between text-[13px]">
                <span className="text-muted-foreground">Balance</span>
                <span className="font-mono text-foreground">{parseFloat(balance).toFixed(4)} POL</span>
              </div>
            </div>
          </div>
        )}

        {!isConnected ? (
          <div className="rounded-xl border border-border bg-card p-8 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
              <Wallet className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="mt-4 text-[14px] text-muted-foreground">
              Connect your MetaMask wallet to register on-chain.
            </p>
            <button
              onClick={connect}
              disabled={isConnecting}
              className="mt-5 rounded-lg bg-accent px-6 py-2.5 text-[13px] font-medium text-accent-foreground transition-all hover:shadow-lg hover:shadow-accent/20 disabled:opacity-50"
            >
              {isConnecting ? "Connecting..." : "Connect Wallet"}
            </button>
          </div>
        ) : result ? (
          <div className="rounded-xl border border-success/20 bg-success/5 overflow-hidden">
            <div className="px-5 py-4 border-b border-success/10">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-success" />
                <h2 className="text-[15px] font-semibold text-success">Proof registered</h2>
              </div>
            </div>
            <div className="px-5 py-4 space-y-3">
              <div className="flex justify-between text-[13px]">
                <span className="text-muted-foreground">Proof hash</span>
                <HashDisplay hash={result.proofHash} length={20} />
              </div>
              <div className="flex justify-between text-[13px]">
                <span className="text-muted-foreground">Block</span>
                <span className="font-mono text-foreground">
                  #{result.blockNumber.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-[13px]">
                <span className="text-muted-foreground">Submitter</span>
                <span className="font-mono text-foreground text-[11px]">
                  {result.submitter.slice(0, 16)}...
                </span>
              </div>
              <div className="flex justify-between text-[13px]">
                <span className="text-muted-foreground">Transaction</span>
                <a
                  href={explorerTx(result.transactionHash)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-mono text-accent text-[11px] hover:underline"
                >
                  {result.transactionHash.slice(0, 16)}...
                  <ExternalLink className="h-2.5 w-2.5" />
                </a>
              </div>
            </div>
            <div className="px-5 py-4 border-t border-success/10 flex gap-3">
              <Link
                to="/result/$hash"
                params={{ hash: result.proofHash }}
                className="flex-1 rounded-lg bg-accent px-4 py-2.5 text-center text-[13px] font-medium text-accent-foreground transition-all hover:shadow-lg hover:shadow-accent/20"
              >
                View result
              </Link>
              <Link
                to="/verify"
                className="flex-1 rounded-lg border border-border bg-card px-4 py-2.5 text-center text-[13px] font-medium text-card-foreground transition-all hover:shadow-sm"
              >
                Verify
              </Link>
            </div>
          </div>
        ) : (
          <>
            {/* Progress bar */}
            <div className="mb-6">
              <div className="flex items-center justify-between text-[12px] text-muted-foreground mb-2">
                <span>Progress</span>
                <span className="font-mono">{Math.max(0, stageIndex + 1)} / {REG_STAGES.length}</span>
              </div>
              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-accent transition-all duration-500"
                  style={{ width: `${((stageIndex + 1) / REG_STAGES.length) * 100}%` }}
                />
              </div>
            </div>

            {/* Stages */}
            <div className="space-y-1">
              {REG_STAGES.map((label, i) => {
                const isLast = i === REG_STAGES.length - 1;
                const done = i < stageIndex;
                const active = i === stageIndex && running;
                return (
                  <div key={i} className="flex items-stretch gap-4">
                    <div className="flex flex-col items-center">
                      <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                        done
                          ? "bg-success/10 text-success"
                          : active
                          ? "bg-accent/10 text-accent"
                          : "bg-muted text-muted-foreground"
                      }`}>
                        {done && <CheckCircle2 className="h-3.5 w-3.5" />}
                        {active && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                        {!done && !active && (
                          <span className="font-mono text-[10px]">{String(i + 1).padStart(2, "0")}</span>
                        )}
                      </div>
                      {!isLast && (
                        <div className={`w-px flex-1 min-h-[20px] ${
                          done ? "bg-success/30" : "bg-border"
                        }`} />
                      )}
                    </div>
                    <div className={`${isLast ? "pb-0" : "pb-4"}`}>
                      <span className={`text-[13px] ${
                        done
                          ? "text-muted-foreground"
                          : active
                          ? "text-foreground font-medium"
                          : "text-muted-foreground"
                      }`}>
                        {label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {error && (
              <div className="mt-6 rounded-xl border border-destructive/20 bg-destructive/5 px-5 py-4">
                <p className="text-[13px] text-destructive">{error}</p>
              </div>
            )}

            <button
              onClick={register}
              disabled={running}
              className="mt-8 w-full rounded-lg bg-accent px-4 py-3 text-[14px] font-medium text-accent-foreground transition-all hover:shadow-lg hover:shadow-accent/20 disabled:opacity-50"
            >
              {running ? "Registering..." : "Register proof on-chain"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
