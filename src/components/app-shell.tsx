import { Link, useLocation } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";

type NavItem = { to: string; label: string; hash?: string };

const MARKETING_NAV: NavItem[] = [
  { to: "/", label: "Home" },
  { to: "/", hash: "#features", label: "Features" },
  { to: "/", hash: "#blog", label: "Journal" },
  { to: "/pricing", label: "Pricing" },
];

const APP_NAV: NavItem[] = [
  { to: "/play", label: "Simulator" },
  { to: "/exam", label: "Exam" },
  { to: "/exam/history", label: "History" },
  { to: "/analytics", label: "Analytics" },
  { to: "/performance", label: "Performance" },
];

interface AppShellProps {
  children: ReactNode;
  variant?: "marketing" | "app";
  hideFooter?: boolean;
}

export function AppShell({ children, variant = "marketing", hideFooter }: AppShellProps) {
  const [signedIn, setSignedIn] = useState(false);
  const [open, setOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSignedIn(!!data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSignedIn(!!s));
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => setOpen(false), [location.pathname]);

  const nav = variant === "app" ? APP_NAV : MARKETING_NAV;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4">
          <Link to="/" className="flex min-w-0 items-center gap-3">
            <Monogram />
            <div className="flex min-w-0 flex-col leading-tight">
              <span className="font-display text-lg font-bold tracking-tight">
                ProjectSim
              </span>
              <span className="hidden text-[10px] uppercase tracking-[0.2em] text-muted-foreground sm:block">
                PMP · PMBOK · Simulation
              </span>
            </div>
          </Link>

          <nav className="hidden items-center gap-7 text-sm text-muted-foreground md:flex">
            {nav.map((n) => {
              const active =
                !n.hash && (location.pathname === n.to ||
                  (n.to !== "/" && location.pathname.startsWith(n.to)));
              const href = n.hash ? `${n.to}${n.hash}` : n.to;
              return n.hash ? (
                <a
                  key={n.label}
                  href={href}
                  className="transition-colors hover:text-foreground"
                >
                  {n.label}
                </a>
              ) : (
                <Link
                  key={n.label}
                  to={n.to}
                  className={
                    "transition-colors hover:text-foreground " +
                    (active ? "text-foreground" : "")
                  }
                >
                  {n.label}
                </Link>
              );
            })}
          </nav>

          <div className="hidden items-center gap-2 md:flex">
            {variant === "marketing" && (
              <Button asChild variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                <Link to={signedIn ? "/play" : "/auth"}>
                  {signedIn ? "Open app" : "Sign in"}
                </Link>
              </Button>
            )}
            <Button asChild size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Link to={signedIn ? "/exam" : "/auth"}>
                {signedIn ? "Take exam" : "Start free"}
              </Link>
            </Button>
          </div>

          <button
            aria-label="Toggle menu"
            className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground md:hidden"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {open && (
          <div className="border-t border-border/60 bg-background/95 md:hidden">
            <div className="mx-auto flex max-w-7xl flex-col gap-1 px-6 py-4 text-sm">
              {nav.map((n) =>
                n.hash ? (
                  <a
                    key={n.label}
                    href={`${n.to}${n.hash}`}
                    className="rounded-md px-3 py-2 text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    {n.label}
                  </a>
                ) : (
                  <Link
                    key={n.label}
                    to={n.to}
                    className="rounded-md px-3 py-2 text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    {n.label}
                  </Link>
                ),
              )}
              <div className="mt-2 flex gap-2 border-t border-border/60 pt-3">
                <Button asChild variant="outline" className="flex-1">
                  <Link to={signedIn ? "/play" : "/auth"}>
                    {signedIn ? "Open app" : "Sign in"}
                  </Link>
                </Button>
                <Button asChild className="flex-1 bg-primary text-primary-foreground">
                  <Link to={signedIn ? "/exam" : "/auth"}>
                    {signedIn ? "Take exam" : "Start"}
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        )}
      </header>

      <main>{children}</main>

      {!hideFooter && (
        <footer className="mt-24 border-t border-border/60 bg-surface/40">
          <div className="mx-auto grid max-w-7xl gap-10 px-6 py-14 md:grid-cols-4">
            <div className="md:col-span-2">
              <div className="flex items-center gap-3">
                <Monogram />
                <span className="font-display text-lg font-bold">ProjectSim</span>
              </div>
              <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">
                A modern PMP prep platform: a full 180-question exam simulator,
                a decision-based project simulator, and an AI PMP coach — all working
                from one shared performance model.
              </p>
            </div>
            <FooterCol
              title="Product"
              links={[
                { label: "Exam simulator", to: "/exam" },
                { label: "Project simulator", to: "/play" },
                { label: "Pricing", to: "/pricing" },
                { label: "Analytics", to: "/analytics" },
              ]}
            />
            <FooterCol
              title="Company"
              links={[
                { label: "Journal", to: "/", hash: "#blog" },
                { label: "Features", to: "/", hash: "#features" },
                { label: "Sign in", to: "/auth" },
              ]}
            />
          </div>
          <div className="border-t border-border/60">
            <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-6 py-5 text-xs text-muted-foreground">
              <div>© {new Date().getFullYear()} ProjectSim. Not affiliated with PMI.</div>
              <div className="font-mono uppercase tracking-[0.2em]">
                v1 · Navy edition
              </div>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}

function FooterCol({
  title,
  links,
}: {
  title: string;
  links: { label: string; to: string; hash?: string }[];
}) {
  return (
    <div>
      <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
        {title}
      </div>
      <ul className="mt-4 space-y-2 text-sm">
        {links.map((l) =>
          l.hash ? (
            <li key={l.label}>
              <a
                href={`${l.to}${l.hash}`}
                className="text-foreground/80 transition hover:text-foreground"
              >
                {l.label}
              </a>
            </li>
          ) : (
            <li key={l.label}>
              <Link
                to={l.to}
                className="text-foreground/80 transition hover:text-foreground"
              >
                {l.label}
              </Link>
            </li>
          ),
        )}
      </ul>
    </div>
  );
}

function Monogram() {
  return (
    <span
      aria-hidden
      className="grid h-9 w-9 shrink-0 place-items-center rounded-md border border-border bg-surface-strong font-display text-sm font-bold tracking-tight text-foreground"
    >
      Ps
    </span>
  );
}
