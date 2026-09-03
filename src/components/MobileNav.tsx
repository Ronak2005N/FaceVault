import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";

export function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden">
      <button
        onClick={() => setOpen(!open)}
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground"
      >
        {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <div className="fixed top-14 right-0 z-50 w-56 border-b border-border bg-background p-3 shadow-lg animate-fade-in">
            <nav className="flex flex-col gap-0.5">
              {[
                { label: "Home", path: "/" },
                { label: "Scan face", path: "/scan" },
                { label: "Verify", path: "/verify" },
              ].map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setOpen(false)}
                  className="rounded-md px-3 py-2 text-[13px] text-muted-foreground transition-colors hover:text-foreground hover:bg-muted"
                >
                  {item.label}
                </Link>
              ))}
              <div className="my-2 h-px bg-border" />
              <div className="flex items-center gap-2 px-3">
                <ThemeToggle />
                <span className="text-[12px] text-muted-foreground">Toggle theme</span>
              </div>
            </nav>
          </div>
        </>
      )}
    </div>
  );
}
