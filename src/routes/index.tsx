import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ProjectSim — PMBOK Project Management Training Simulator" },
      {
        name: "description",
        content:
          "A flight simulator for project managers. Learn PMBOK 6 & 7 by making live decisions under pressure with an AI PMP coach.",
      },
      { property: "og:title", content: "ProjectSim — PMBOK Training Simulator" },
      {
        property: "og:description",
        content:
          "Make project decisions under pressure. Get instant AI coaching grounded in PMBOK 6 & 7.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  const navigate = useNavigate();
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSignedIn(!!data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSignedIn(!!s));
    return () => sub.subscription.unsubscribe();
  }, []);

  return (
    <div className="min-h-screen bg-[#0b1020] text-slate-100">
      <header className="border-b border-white/5">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-400 font-black text-slate-950">
              PS
            </div>
            <div className="text-sm font-semibold sm:text-base">ProjectSim</div>
          </div>
          {signedIn ? (
            <Button asChild className="bg-gradient-to-r from-indigo-500 to-cyan-400 text-slate-950 hover:opacity-90">
              <Link to="/play">Open simulator</Link>
            </Button>
          ) : (
            <Button asChild variant="outline" className="border-white/10 bg-white/[0.04] text-slate-100 hover:bg-white/[0.08]">
              <Link to="/auth">Sign in</Link>
            </Button>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-16 sm:py-24">
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-xs text-cyan-200">
            PMBOK 6 · PMBOK 7 · Hybrid
          </div>
          <h1 className="mt-6 text-4xl font-black tracking-tight sm:text-6xl">
            The flight simulator for
            <span className="bg-gradient-to-r from-indigo-400 to-cyan-300 bg-clip-text text-transparent"> project managers</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-slate-300">
            Run a full project — from business case through closing — as realistic scenarios unfold.
            Get instant AI coaching grounded in PMBOK, and see your XP, badges and progress persist across every device.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button
              size="lg"
              onClick={() => navigate({ to: signedIn ? "/play" : "/auth" })}
              className="bg-gradient-to-r from-indigo-500 to-cyan-400 px-8 text-slate-950 hover:opacity-90"
            >
              {signedIn ? "Continue simulation →" : "Start free simulation →"}
            </Button>
          </div>
          <p className="mt-3 text-xs text-slate-500">
            Installable on any phone — add ProjectSim to your home screen.
          </p>
        </div>

        <div className="mx-auto mt-20 grid max-w-4xl gap-4 sm:grid-cols-3">
          {[
            { t: "Business case first", d: "Every run starts with the executive-level go/no-go decision, not a quiz." },
            { t: "3 decisions per phase", d: "Initiation, Planning, Execution, Monitoring, Closing — plus random events." },
            { t: "Progress saved", d: "Sign in once and your XP, badges and completed runs follow you." },
          ].map((f) => (
            <div key={f.t} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <div className="text-sm font-semibold text-white">{f.t}</div>
              <div className="mt-1 text-sm text-slate-400">{f.d}</div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
