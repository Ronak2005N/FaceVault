import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  Wallet,
  LogOut,
  Copy,
  Check,
  ExternalLink,
  RefreshCw,
  ArrowRight,
  Shield,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { useWallet } from "@/lib/hooks/useWallet";
import { ThemeToggle } from "@/components/ThemeToggle";
import { MobileNav } from "@/components/MobileNav";

export const Route = createFileRoute("/wallet")({
  component: WalletPage,
});

function WalletPage() {
  const navigate = useNavigate();
  const {
    isConnected,
    isAmoy,
    address,
    balance,
    chainId,
    connect,
    disconnect,
    switchNetwork,
    shortenAddress,
    refreshBalance,
    isConnecting,
    isMetaMaskInstalled,
    error,
  } = useWallet();

  const [copied, setCopied] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const handleCopy = async () => {
    if (!address) return;
    await navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshBalance();
    setTimeout(() => setRefreshing(false), 1000);
  };

  const handleDisconnect = () => {
    disconnect();
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
            <MobileNav />
          </div>
        </div>
      </nav>

      <div className="flex min-h-screen items-center justify-center px-6 pt-14">
        <div className="w-full max-w-md">
          {!isConnected ? (
            /* ─── LOGIN STATE ─── */
            <div className="text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-border bg-card">
                <Wallet className="h-7 w-7 text-muted-foreground" />
              </div>

              <h1 className="mt-6 text-2xl font-bold tracking-tight">Connect your wallet</h1>
              <p className="mt-3 text-[14px] text-muted-foreground max-w-sm mx-auto">
                Connect MetaMask to register proofs on Polygon Amoy and manage your on-chain identity.
              </p>

              {!isMetaMaskInstalled ? (
                <div className="mt-8 rounded-xl border border-border bg-card p-6">
                  <div className="flex items-center gap-3 justify-center">
                    <AlertCircle className="h-5 w-5 text-warning" />
                    <span className="text-[14px] font-medium text-foreground">MetaMask not detected</span>
                  </div>
                  <p className="mt-2 text-[13px] text-muted-foreground">
                    Install the MetaMask browser extension to continue.
                  </p>
                  <a
                    href="https://metamask.io/download/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 inline-flex items-center gap-2 rounded-lg bg-accent px-5 py-2.5 text-[13px] font-medium text-accent-foreground transition-all hover:shadow-lg hover:shadow-accent/20"
                  >
                    Install MetaMask
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              ) : (
                <div className="mt-8 space-y-4">
                  <button
                    onClick={connect}
                    disabled={isConnecting}
                    className="w-full rounded-xl bg-accent px-6 py-3.5 text-[14px] font-medium text-accent-foreground transition-all hover:shadow-lg hover:shadow-accent/20 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isConnecting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Connecting...
                      </>
                    ) : (
                      <>
                        <Wallet className="h-4 w-4" />
                        Connect MetaMask
                      </>
                    )}
                  </button>

                  {error && (
                    <div className="rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
                      <p className="text-[13px] text-destructive">{error}</p>
                    </div>
                  )}

                  <p className="text-[12px] text-muted-foreground text-center">
                    By connecting, you agree to use your wallet for on-chain proof registration.
                  </p>
                </div>
              )}

              <div className="mt-12 border-t border-border pt-8">
                <p className="text-[12px] text-muted-foreground mb-4">Or continue without a wallet</p>
                <Link
                  to="/scan"
                  className="inline-flex items-center gap-2 text-[13px] text-muted-foreground transition-colors hover:text-foreground"
                >
                  Skip to scanning
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          ) : (
            /* ─── LOGGED IN STATE ─── */
            <div className="space-y-5">
              {/* Header */}
              <div className="text-center mb-2">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-success/10 text-success">
                  <Wallet className="h-6 w-6" />
                </div>
                <h1 className="mt-4 text-2xl font-bold tracking-tight">Wallet connected</h1>
                <p className="mt-2 text-[13px] text-muted-foreground">
                  Your wallet is connected to Polygon Amoy.
                </p>
              </div>

              {/* Network Status */}
              {!isAmoy && (
                <div className="rounded-xl border border-warning/20 bg-warning/5 px-5 py-4">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-warning" />
                    <span className="text-[13px] font-medium text-warning">Wrong network</span>
                  </div>
                  <p className="mt-1 text-[12px] text-muted-foreground">
                    Please switch to Polygon Amoy to register proofs.
                  </p>
                  <button
                    onClick={switchNetwork}
                    className="mt-3 rounded-lg bg-warning px-4 py-2 text-[12px] font-medium text-warning-foreground transition-all hover:opacity-90"
                  >
                    Switch to Polygon Amoy
                  </button>
                </div>
              )}

              {/* Wallet Info Card */}
              <div className="rounded-xl border border-border bg-card overflow-hidden">
                <div className="px-5 py-3 border-b border-border flex items-center justify-between">
                  <span className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
                    Wallet details
                  </span>
                  <div className={`flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                    isAmoy
                      ? "bg-success/10 text-success"
                      : "bg-warning/10 text-warning"
                  }`}>
                    <span className={`h-1 w-1 rounded-full ${isAmoy ? "bg-success" : "bg-warning"}`} />
                    {isAmoy ? "Polygon Amoy" : `Chain ${chainId}`}
                  </div>
                </div>

                <div className="px-5 py-4 space-y-4">
                  {/* Address */}
                  <div>
                    <span className="text-[11px] text-muted-foreground block mb-1.5">Address</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[13px] text-foreground break-all">
                        {address}
                      </span>
                      <button
                        onClick={handleCopy}
                        className="shrink-0 flex h-7 w-7 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:text-foreground"
                        title="Copy address"
                      >
                        {copied ? <Check className="h-3 w-3 text-success" /> : <Copy className="h-3 w-3" />}
                      </button>
                    </div>
                  </div>

                  {/* Balance */}
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[11px] text-muted-foreground block mb-1">Balance</span>
                      <span className="font-mono text-xl font-bold text-foreground">
                        {parseFloat(balance).toFixed(4)}
                      </span>
                      <span className="ml-1.5 text-[13px] text-muted-foreground">POL</span>
                    </div>
                    <button
                      onClick={handleRefresh}
                      className="flex h-8 w-8 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:text-foreground"
                      title="Refresh balance"
                    >
                      <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-2">
                <Link
                  to="/scan"
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-4 py-3 text-[14px] font-medium text-accent-foreground transition-all hover:shadow-lg hover:shadow-accent/20"
                >
                  Start scanning
                  <ArrowRight className="h-4 w-4" />
                </Link>

                <a
                  href={`https://amoy.polygonscan.com/address/${address}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-3 text-[13px] font-medium text-card-foreground transition-all hover:shadow-md"
                >
                  View on PolygonScan
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>

              {/* Disconnect */}
              <div className="border-t border-border pt-5">
                <button
                  onClick={handleDisconnect}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-[13px] font-medium text-destructive transition-all hover:bg-destructive/10"
                >
                  <LogOut className="h-4 w-4" />
                  Disconnect wallet
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
