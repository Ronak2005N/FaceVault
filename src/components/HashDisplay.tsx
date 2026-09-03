import { useState } from "react";
import { Copy, Check } from "lucide-react";

interface HashDisplayProps {
  hash: string;
  length?: number;
}

export function HashDisplay({ hash, length = 20 }: HashDisplayProps) {
  const [copied, setCopied] = useState(false);
  const display = hash.length > length ? hash.slice(0, length) + "..." : hash;

  const copy = () => {
    navigator.clipboard.writeText(hash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={copy}
      className="inline-flex items-center gap-1.5 font-mono text-[12px] text-foreground transition-colors hover:text-accent"
      aria-label="Click to copy full hash"
    >
      {display}
      {copied ? (
        <Check className="h-3 w-3 text-success" />
      ) : (
        <Copy className="h-3 w-3 text-muted-foreground" />
      )}
    </button>
  );
}
