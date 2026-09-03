import { createFileRoute, Link } from "@tanstack/react-router";
import { useWallet } from "@/lib/hooks/useWallet";
import { ArrowRight, ExternalLink, Shield, Search, Database, Lock, Eye, Globe } from "lucide-react";
import { motion } from "framer-motion";
import { ThemeToggle } from "@/components/ThemeToggle";
import { MobileNav } from "@/components/MobileNav";

export const Route = createFileRoute("/")({
  component: LandingPage,
});

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.6, ease: [0.16, 1, 0.3, 1] as const },
  }),
};

const stagger = {
  visible: { transition: { staggerChildren: 0.06 } },
};

function LandingPage() {
  const { isConnected, connect, isConnecting, shortenAddress, address } = useWallet();

  return (
    <div className="min-h-screen bg-background text-foreground">

      {/* ─── NAV ─── */}
      <nav className="fixed top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 h-14">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-accent text-accent-foreground">
              <Shield className="h-3.5 w-3.5" />
            </div>
            <span className="text-sm font-semibold tracking-tight">FaceChain</span>
          </Link>

          <div className="hidden items-center gap-1 md:flex">
            {["How it works", "Pipeline", "Verify"].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase().replace(/\s+/g, "-")}`}
                className="rounded px-3 py-1.5 text-[13px] text-muted-foreground transition-colors hover:text-foreground"
              >
                {item}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            {isConnected ? (
              <div className="hidden items-center gap-2 rounded-md border border-success/30 bg-success/8 px-3 py-1.5 text-[11px] font-medium text-success tabular-nums sm:flex">
                <span className="h-1 w-1 rounded-full bg-success" />
                {shortenAddress(address)}
              </div>
            ) : (
              <button
                onClick={connect}
                disabled={isConnecting}
                className="hidden rounded-md bg-foreground px-4 py-1.5 text-[13px] font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-50 sm:block"
              >
                {isConnecting ? "Connecting..." : "Connect Wallet"}
              </button>
            )}
            <MobileNav />
          </div>
        </div>
      </nav>

      {/* ─── HERO ─── */}
      <section className="relative overflow-hidden pt-32 pb-20 md:pt-44 md:pb-32">
        {/* Subtle grid background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#e4e4e7_1px,transparent_1px),linear-gradient(to_bottom,#e4e4e7_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-30 dark:opacity-[0.04]" />

        <div className="relative mx-auto max-w-5xl px-6">
          <div className="max-w-3xl">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={stagger}
            >
              <motion.div variants={fadeUp} custom={0} className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-widest text-accent mb-6">
                <span className="h-px w-4 bg-accent" />
                HH Goa 2026 — Task #3
              </motion.div>

              <motion.h1
                variants={fadeUp}
                custom={1}
                className="text-5xl font-bold leading-[1.05] tracking-tight md:text-7xl lg:text-[5.5rem]"
              >
                Face identity.
                <br />
                <span className="text-muted-foreground">Proven on-chain.</span>
              </motion.h1>

              <motion.p
                variants={fadeUp}
                custom={2}
                className="mt-6 max-w-lg text-[15px] leading-relaxed text-muted-foreground"
              >
                Detect a face. Find it across the web. Hash the evidence.
                Register the proof on Polygon — producing a tamper-evident,
                publicly verifiable record in under a minute.
              </motion.p>

              <motion.div
                variants={fadeUp}
                custom={3}
                className="mt-10 flex flex-wrap items-center gap-3"
              >
                <Link
                  to="/scan"
                  className="group inline-flex items-center gap-2 rounded-lg bg-accent px-6 py-3 text-[14px] font-medium text-accent-foreground transition-all hover:shadow-lg hover:shadow-accent/20"
                >
                  Start scanning
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
                <Link
                  to="/verify"
                  className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-6 py-3 text-[14px] font-medium text-card-foreground transition-all hover:shadow-md"
                >
                  Verify a proof
                </Link>
              </motion.div>

              <motion.div
                variants={fadeUp}
                custom={4}
                className="mt-14 flex flex-wrap items-center gap-5 text-[12px] text-muted-foreground"
              >
                {[
                  { dot: "bg-success", label: "Polygon Amoy" },
                  { dot: "bg-accent", label: "MediaPipe" },
                  { dot: "bg-foreground", label: "Zero gas cost" },
                ].map(({ dot, label }) => (
                  <span key={label} className="flex items-center gap-2">
                    <span className={`h-1 w-1 rounded-full ${dot}`} />
                    {label}
                  </span>
                ))}
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ─── STATS BAR ─── */}
      <section className="border-y border-border bg-muted/30">
        <div className="mx-auto max-w-5xl px-6">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={stagger}
            className="grid grid-cols-2 gap-0 md:grid-cols-4"
          >
            {[
              { value: "478", label: "Face landmarks", suffix: "points" },
              { value: "98", label: "Detection confidence", suffix: "%" },
              { value: "0", label: "Gas on Amoy", suffix: "POL" },
              { value: "256", label: "Bit hash", suffix: "SHA" },
            ].map(({ value, label, suffix }, i) => (
              <motion.div
                key={label}
                variants={fadeUp}
                custom={i}
                className={`py-6 text-center md:py-8 ${i < 3 ? "border-r border-border" : ""} ${i < 2 ? "border-b md:border-b-0 border-border" : i === 2 ? "border-b md:border-b-0 border-border" : ""}`}
              >
                <div className="font-mono text-2xl font-bold tracking-tight text-foreground md:text-3xl">
                  {suffix === "SHA" ? (
                    <>{suffix}-{value}</>
                  ) : (
                    <>{value}<span className="ml-1 text-sm font-normal text-muted-foreground">{suffix}</span></>
                  )}
                </div>
                <div className="mt-1 text-[12px] text-muted-foreground">{label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section id="how-it-works" className="py-20 md:py-28">
        <div className="mx-auto max-w-5xl px-6">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={stagger}
            className="mb-16"
          >
            <motion.div variants={fadeUp} custom={0}>
              <h2 className="text-[11px] font-medium uppercase tracking-widest text-accent mb-4">
                How it works
              </h2>
              <p className="text-2xl font-semibold tracking-tight md:text-3xl">
                From face to blockchain proof.
              </p>
              <p className="mt-3 max-w-md text-[14px] text-muted-foreground">
                Five stages. One pipeline. Tamper-proof output.
              </p>
            </motion.div>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={stagger}
            className="space-y-0"
          >
            {[
              {
                num: "01",
                icon: <Eye className="h-4 w-4" />,
                title: "Upload a face",
                desc: "Drag and drop an image or use your camera. The system detects faces using MediaPipe BlazeFace — all processing happens in the browser.",
              },
              {
                num: "02",
                icon: <Search className="h-4 w-4" />,
                title: "Search the web",
                desc: "The face is uploaded to Google Lens via SerpApi. Genuine reverse-image search finds real matching posts across Instagram, LinkedIn, Facebook, and more.",
              },
              {
                num: "03",
                icon: <Database className="h-4 w-4" />,
                title: "Collect evidence",
                desc: "Discovered URLs, match confidence, and source metadata are structured into a deterministic evidence record with consistent serialization.",
              },
              {
                num: "04",
                icon: <Lock className="h-4 w-4" />,
                title: "Hash the record",
                desc: "SHA-256 via the Web Crypto API. Same input always produces the same hash. No external dependencies. Pure and verifiable.",
              },
              {
                num: "05",
                icon: <Globe className="h-4 w-4" />,
                title: "Register on-chain",
                desc: "MetaMask signs the transaction. Polygon Amoy stores the proof hash permanently. Anyone can verify it without a wallet.",
              },
            ].map(({ num, icon, title, desc }, i) => (
              <motion.div
                key={num}
                variants={fadeUp}
                custom={i}
                className="group relative flex gap-6 border-t border-border py-8 first:border-t-0 first:pt-0"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-colors group-hover:border-accent group-hover:text-accent">
                  {icon}
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-[11px] text-muted-foreground">{num}</span>
                    <h3 className="text-[15px] font-medium text-foreground">{title}</h3>
                  </div>
                  <p className="mt-1.5 text-[14px] leading-relaxed text-muted-foreground max-w-xl">{desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ─── PIPELINE ─── */}
      <section id="pipeline" className="border-y border-border bg-muted/30 py-20 md:py-28">
        <div className="mx-auto max-w-5xl px-6">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={stagger}
            className="mb-12"
          >
            <motion.div variants={fadeUp} custom={0}>
              <h2 className="text-[11px] font-medium uppercase tracking-widest text-accent mb-4">
                Pipeline architecture
              </h2>
              <p className="text-2xl font-semibold tracking-tight md:text-3xl">
                Modular. Testable. Transparent.
              </p>
            </motion.div>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={stagger}
            className="flex flex-wrap items-center justify-center gap-3 md:gap-2"
          >
            {[
              "Face input",
              "Detection",
              "Embedding",
              "Web search",
              "Evidence",
              "SHA-256",
              "Blockchain",
            ].map((label, i) => (
              <motion.div key={label} variants={fadeUp} custom={i} className="flex items-center gap-2">
                <div className="flex items-center gap-2 rounded-md border border-border bg-card px-4 py-2.5 shadow-sm">
                  <span className="font-mono text-[11px] text-muted-foreground">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="text-[13px] font-medium text-foreground">{label}</span>
                </div>
                {i < 6 && (
                  <div className="hidden text-muted-foreground/40 md:block">→</div>
                )}
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ─── FEATURES ─── */}
      <section id="features" className="py-20 md:py-28">
        <div className="mx-auto max-w-5xl px-6">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={stagger}
            className="mb-16"
          >
            <motion.div variants={fadeUp} custom={0}>
              <h2 className="text-[11px] font-medium uppercase tracking-widest text-accent mb-4">
                Capabilities
              </h2>
              <p className="text-2xl font-semibold tracking-tight md:text-3xl">
                What the system does.
              </p>
            </motion.div>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={stagger}
            className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
          >
            {[
              {
                icon: <Eye className="h-4 w-4" />,
                title: "In-browser face detection",
                desc: "MediaPipe BlazeFace runs via WebAssembly. Extracts 478 landmark points and computes embedding vectors. No data leaves the device.",
              },
              {
                icon: <Search className="h-4 w-4" />,
                title: "Genuine reverse-image search",
                desc: "Google Lens via SerpApi. Not hardcoded. Real results from real searches — Instagram, LinkedIn, Facebook, YouTube, and more.",
              },
              {
                icon: <Database className="h-4 w-4" />,
                title: "Deterministic evidence records",
                desc: "Sorted-key JSON serialization ensures the same evidence always produces the same SHA-256 hash. Tamper-evident by construction.",
              },
              {
                icon: <Lock className="h-4 w-4" />,
                title: "SHA-256 cryptographic hashing",
                desc: "Browser-native Web Crypto API. Zero dependencies. Pure, deterministic, verifiable. The hash IS the proof.",
              },
              {
                icon: <Globe className="h-4 w-4" />,
                title: "Polygon blockchain registration",
                desc: "Proof hashes stored permanently on Polygon Amoy. Returns transaction hash, block number, and IPFS CID for public verification.",
              },
              {
                icon: <Shield className="h-4 w-4" />,
                title: "Wallet-free public verification",
                desc: "Anyone can verify a proof hash via read-only RPC queries. No MetaMask needed. Instant results with confirmation count.",
              },
            ].map(({ icon, title, desc }, i) => (
              <motion.div
                key={title}
                variants={fadeUp}
                custom={i}
                className="group rounded-lg border border-border bg-card p-5 transition-all hover:shadow-md hover:border-accent/30"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-md border border-border bg-muted text-muted-foreground transition-colors group-hover:border-accent/30 group-hover:text-accent">
                  {icon}
                </div>
                <h3 className="mt-4 text-[14px] font-medium text-foreground">{title}</h3>
                <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">{desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="border-t border-border py-20 md:py-28">
        <div className="mx-auto max-w-5xl px-6">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={0}
            className="max-w-xl"
          >
            <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
              Build proof that lasts.
            </h2>
            <p className="mt-3 text-[14px] text-muted-foreground">
              Zero cost. Open source. Deployed on Polygon Amoy testnet.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                to="/scan"
                className="inline-flex items-center gap-2 rounded-lg bg-accent px-6 py-3 text-[14px] font-medium text-accent-foreground transition-all hover:shadow-lg hover:shadow-accent/20"
              >
                Get started
                <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-[13px] text-muted-foreground transition-colors hover:text-foreground"
              >
                Source code
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="border-t border-border">
        <div className="mx-auto flex flex-col items-center justify-between gap-4 px-6 py-6 text-[12px] text-muted-foreground sm:flex-row">
          <span className="font-medium">FaceChain Proof</span>
          <div className="flex items-center gap-4">
            <span>HH Goa 2026</span>
            <span className="text-border">|</span>
            <span className="flex items-center gap-1.5">
              <span className="h-1 w-1 rounded-full bg-success" />
              Polygon Amoy
            </span>
            <a
              href="https://amoy.polygonscan.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 transition-colors hover:text-foreground"
            >
              Explorer <ExternalLink className="h-2.5 w-2.5" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
