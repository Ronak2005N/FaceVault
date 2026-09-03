import { useState, useEffect } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ExternalLink, ChevronDown, ChevronUp } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { HashDisplay } from "@/components/HashDisplay";
import type { EvidenceRecord } from "@/lib/types";

export const Route = createFileRoute("/evidence")({
  component: EvidencePage,
});

function EvidencePage() {
  const navigate = useNavigate();
  const [record, setRecord] = useState<EvidenceRecord | null>(null);
  const [showJson, setShowJson] = useState(false);

  useEffect(() => {
    const stored = sessionStorage.getItem("evidenceRecord");
    if (!stored) {
      navigate({ to: "/scan" });
      return;
    }
    setRecord(JSON.parse(stored));
  }, [navigate]);

  const goRegister = () => {
    if (record) {
      navigate({ to: "/register" });
    }
  };

  if (!record) return null;

  return (
    <div className="min-h-screen bg-background">
      <PageHeader backTo="/analyze" backLabel="Analysis" title="Evidence" step={2} />

      <div className="mx-auto max-w-2xl px-6 pt-24 pb-16">
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight">Evidence record</h1>
          <p className="mt-2 text-[14px] text-muted-foreground">
            Review the structured evidence before registering on-chain.
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="px-5 py-3 border-b border-border">
            <h2 className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
              Record details
            </h2>
          </div>
          <div className="px-5 py-4">
            <div className="space-y-3">
              <div className="flex justify-between text-[13px]">
                <span className="text-muted-foreground">Subject</span>
                <HashDisplay hash={record.subjectIdentifier} length={24} />
              </div>
              <div className="flex justify-between text-[13px]">
                <span className="text-muted-foreground">Source</span>
                <span className="rounded bg-accent/10 px-2 py-0.5 font-mono text-[12px] text-accent">{record.source}</span>
              </div>
              {record.discoveredURL && (
                <div className="flex justify-between text-[13px]">
                  <span className="text-muted-foreground">Discovered URL</span>
                  <a
                    href={record.discoveredURL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-accent text-[11px] hover:underline max-w-[60%] truncate"
                  >
                    {record.discoveredURL.length > 40
                      ? record.discoveredURL.slice(0, 40) + "..."
                      : record.discoveredURL}
                    <ExternalLink className="h-2.5 w-2.5 shrink-0" />
                  </a>
                </div>
              )}
              <div className="flex justify-between text-[13px]">
                <span className="text-muted-foreground">Confidence</span>
                <span className="font-mono text-foreground">
                  {(record.matchConfidence * 100).toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between text-[13px]">
                <span className="text-muted-foreground">Timestamp</span>
                <span className="text-foreground">{new Date(record.timestamp).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-[13px]">
                <span className="text-muted-foreground">Version</span>
                <span className="font-mono text-foreground">{record.version}</span>
              </div>
              <div className="flex justify-between text-[13px]">
                <span className="text-muted-foreground">Evidence hash</span>
                <HashDisplay hash={record.evidenceHash} length={24} />
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={() => setShowJson(!showJson)}
          className="mt-4 flex items-center gap-1.5 text-[12px] text-muted-foreground hover:text-foreground transition-colors"
        >
          {showJson ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          {showJson ? "Hide" : "Show"} deterministic JSON
        </button>

        {showJson && (
          <div className="mt-3 rounded-xl border border-border bg-muted/50 p-4 overflow-x-auto">
            <pre className="font-mono text-[11px] text-foreground whitespace-pre-wrap">
              {JSON.stringify(
                Object.keys(record)
                  .sort()
                  .reduce((acc, key) => {
                    acc[key] = record[key as keyof EvidenceRecord];
                    return acc;
                  }, {} as Record<string, unknown>),
                null,
                2
              )}
            </pre>
          </div>
        )}

        <div className="mt-6 rounded-xl border border-border bg-muted/30 px-5 py-4">
          <p className="text-[13px] text-muted-foreground">
            This record will be SHA-256 hashed and registered on Polygon Amoy as a
            tamper-proof proof. The transaction requires MetaMask.
          </p>
        </div>

        <button
          onClick={goRegister}
          className="mt-6 w-full rounded-lg bg-accent px-4 py-3 text-[14px] font-medium text-accent-foreground transition-all hover:shadow-lg hover:shadow-accent/20"
        >
          Register on-chain
        </button>
      </div>
    </div>
  );
}
