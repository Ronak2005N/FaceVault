import { ArrowLeft } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { ProgressSteps } from "./ProgressSteps";
import { ThemeToggle } from "./ThemeToggle";

interface PageHeaderProps {
  backTo: string;
  backLabel?: string;
  title: string;
  step?: number;
}

export function PageHeader({ backTo, backLabel, title, step }: PageHeaderProps) {
  return (
    <nav className="fixed top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 h-14">
        <div className="flex items-center gap-4">
          <Link
            to={backTo}
            className="flex items-center gap-2 text-[13px] text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            {backLabel || "Home"}
          </Link>
          <span className="text-border">|</span>
          <span className="text-[13px] font-medium">{title}</span>
        </div>
        <div className="flex items-center gap-3">
          {step !== undefined && <ProgressSteps current={step} />}
          <ThemeToggle />
        </div>
      </div>
    </nav>
  );
}
