import { Link } from "@tanstack/react-router";
import { Check } from "lucide-react";

const STEPS = [
  { label: "Scan", path: "/scan" },
  { label: "Analyze", path: "/analyze" },
  { label: "Evidence", path: "/evidence" },
  { label: "Register", path: "/register" },
];

export function ProgressSteps({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {STEPS.map((step, i) => {
        const done = i < current;
        const active = i === current;

        return (
          <div key={step.path} className="flex items-center gap-0.5">
            <Link
              to={step.path}
              className={`flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-medium transition-colors ${
                active
                  ? "text-foreground bg-muted"
                  : done
                  ? "text-success"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {done ? (
                <Check className="h-3 w-3" />
              ) : (
                <span className="font-mono">{String(i + 1).padStart(2, "0")}</span>
              )}
              <span className="hidden sm:inline">{step.label}</span>
            </Link>
            {i < STEPS.length - 1 && (
              <div
                className={`h-px w-2 ${
                  i < current ? "bg-success/50" : "bg-border"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
