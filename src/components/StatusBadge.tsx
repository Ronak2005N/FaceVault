interface StatusBadgeProps {
  status: "verified" | "not_found" | "error" | "pending" | "active";
  label?: string;
}

const STYLES = {
  verified: "bg-success/10 text-success border-success/20",
  active: "bg-accent/10 text-accent border-accent/20",
  pending: "bg-muted text-muted-foreground border-border",
  not_found: "bg-muted text-muted-foreground border-border",
  error: "bg-destructive/10 text-destructive border-destructive/20",
};

export function StatusBadge({ status, label }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${STYLES[status]}`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          status === "verified"
            ? "bg-success"
            : status === "active"
            ? "bg-accent"
            : status === "error"
            ? "bg-destructive"
            : "bg-muted-foreground"
        }`}
      />
      {label || status.replace("_", " ")}
    </span>
  );
}
