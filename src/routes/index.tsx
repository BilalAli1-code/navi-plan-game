import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import {
  BookOpen,
  Brain,
  ClipboardCheck,
  Compass,
  Sparkles,
  Target,
  TrendingUp,
  Users,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ProjectSim — PMP Exam Simulator & PMBOK Training Platform" },
      {
        name: "description",
        content:
          "Prepare for the PMP exam with realistic 180-question simulations, adaptive coaching, and a full project-management flight simulator grounded in PMBOK 6 & 7.",
      },
      {
        property: "og:title",
        content: "ProjectSim — PMP Exam Simulator & PMBOK Training",
      },
      {
        property: "og:description",
        content:
          "Realistic PMP exam mode, adaptive project simulator, and AI coach — the modern way to prepare for the PMP exam.",
      },
    ],
  }),
  component: Landing,
});

const FEATURES = {
  simulator: [
    { icon: Compass, t: "Manage one project end-to-end", d: "Initiation → Planning → Execution → Monitoring → Closing, with consequences that carry across phases." },
    { icon: Brain, t: "AI PMP coach", d: "Every decision returns PMBOK-grounded coaching, PMI mindset cues, and stakeholder reactions." },
    { icon: TrendingUp, t: "Adaptive scenarios", d: "The simulator biases toward your weakest exam knowledge areas so you practice what actually matters." },
  ],
  exam: [
    { icon: ClipboardCheck, t: "Full 180-question exam", d: "Realistic 230-minute test with mark-for-review, breaks, and resume. Mini exams for daily reps." },
    { icon: Target, t: "Readiness scoring", d: "Domain and knowledge-area breakdowns, estimated pass probability, and timing diagnostics." },
    { icon: Sparkles, t: "AI review after every exam", d: "Ask follow-up questions and get a personalized study plan grounded in your actual weaknesses." },
  ],
  coach: [
    { icon: Users, t: "Simulated stakeholder reactions", d: "Sponsors, clients, and teams respond differently based on your PMBOK judgment." },
    { icon: BookOpen, t: "PMBOK 6 + PMBOK 7", d: "Coaching cites the specific process, principle, or performance domain — not generic advice." },
    { icon: TrendingUp, t: "Progress that persists", d: "XP, badges, streaks, and reports sync to your account across devices." },
  ],
};

const BLOG_POSTS = [
  {
    tag: "Study strategy",
    title: "How to pass the PMP exam in 6 weeks (without burning out)",
    excerpt:
      "A realistic study cadence built around 3 practice exams, targeted knowledge-area drills, and a weekly retro on your weakest topics.",
    read: "8 min read",
  },
  {
    tag: "PMBOK 7",
    title: "The 12 PMBOK 7 principles, translated for exam questions",
    excerpt:
      "How stewardship, tailoring, and systems thinking actually show up in scenario answers — and the trap distractors PMI loves.",
    read: "6 min read",
  },
  {
    tag: "Mindset",
    title: "PMI mindset cheatsheet: choosing the 'least wrong' answer",
    excerpt:
      "The 9 decision heuristics that separate the correct PMP answer from the plausible-looking one. Save this before your next mock exam.",
    read: "5 min read",
  },
  {
    tag: "Simulator",
    title: "Why simulated projects beat flashcards for PMP prep",
    excerpt:
      "Retention research on why decision-under-pressure practice outperforms passive review — and how to structure your own dry runs.",
    read: "4 min read",
  },
];

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
      <header className="sticky top-0 z-20 border-b border-white/5 bg-[#0b1020]/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-400 font-black text-slate-950">
              PS
            </div>
            <div className="text-sm font-semibold sm:text-base">ProjectSim</div>
          </div>
          <nav className="hidden items-center gap-6 text-sm text-slate-300 md:flex">
            <a href="#features" className="hover:text-white">Features</a>
            <a href="#blog" className="hover:text-white">Blog</a>
            <Link to="/pricing" className="hover:text-white">Pricing</Link>
          </nav>
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

      <main>
        {/* HERO */}
        <section className="relative overflow-hidden">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-40"
            style={{
              backgroundImage:
                "radial-gradient(60% 40% at 50% 0%, rgba(99,102,241,0.35), transparent 70%), radial-gradient(40% 30% at 80% 20%, rgba(34,211,238,0.25), transparent 70%)",
            }}
          />
          <div className="relative mx-auto max-w-6xl px-4 py-20 sm:py-28">
            <div className="mx-auto max-w-3xl text-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-xs text-cyan-200">
                PMBOK 6 · PMBOK 7 · Hybrid · Agile
              </div>
              <h1 className="mt-6 text-4xl font-black tracking-tight sm:text-6xl">
                Pass the PMP exam by
                <span className="bg-gradient-to-r from-indigo-400 to-cyan-300 bg-clip-text text-transparent">
                  {" "}managing real projects
                </span>
              </h1>
              <p className="mx-auto mt-5 max-w-2xl text-lg text-slate-300">
                A full PMP exam simulator plus a decision-based project simulator — with an AI coach
                that grounds every explanation in PMBOK. Practice like the exam, learn like the job.
              </p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                <Button
                  size="lg"
                  onClick={() => navigate({ to: signedIn ? "/exam" : "/auth" })}
                  className="bg-gradient-to-r from-indigo-500 to-cyan-400 px-8 text-slate-950 hover:opacity-90"
                >
                  Start PMP exam simulator →
                </Button>
                <Button asChild size="lg" variant="outline" className="border-white/10 bg-white/[0.04] text-slate-100 hover:bg-white/[0.08]">
                  <Link to={signedIn ? "/play" : "/auth"}>Open project simulator</Link>
                </Button>
              </div>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-slate-400">
                <span>✓ 180-question full exam mode</span>
                <span>✓ Adaptive AI coaching</span>
                <span>✓ Progress synced to your account</span>
              </div>
            </div>
          </div>
        </section>

        {/* FEATURE TABS */}
        <section id="features" className="mx-auto max-w-6xl px-4 py-16 sm:py-20">
          <div className="mx-auto max-w-2xl text-center">
            <div className="text-xs uppercase tracking-widest text-cyan-300">One platform, three surfaces</div>
            <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
              The exam prep tool PMs actually use
            </h2>
            <p className="mt-3 text-slate-400">
              Switch between exam-style practice, decision-based project simulation, and AI coaching
              — all working from one shared performance model.
            </p>
          </div>

          <Tabs defaultValue="exam" className="mt-10">
            <TabsList className="mx-auto flex w-full max-w-lg bg-white/[0.04]">
              <TabsTrigger value="exam" className="flex-1">Exam Simulator</TabsTrigger>
              <TabsTrigger value="simulator" className="flex-1">Project Simulator</TabsTrigger>
              <TabsTrigger value="coach" className="flex-1">AI Coach</TabsTrigger>
            </TabsList>
            {(["exam", "simulator", "coach"] as const).map((k) => (
              <TabsContent key={k} value={k} className="mt-8">
                <div className="grid gap-4 sm:grid-cols-3">
                  {FEATURES[k].map((f) => (
                    <Card
                      key={f.t}
                      className="border-white/10 bg-white/[0.03] p-5 text-slate-100"
                    >
                      <f.icon className="h-6 w-6 text-cyan-300" />
                      <div className="mt-3 text-sm font-semibold">{f.t}</div>
                      <p className="mt-1 text-sm text-slate-400">{f.d}</p>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </section>

        {/* SOCIAL / STATS */}
        <section className="border-y border-white/5 bg-white/[0.02]">
          <div className="mx-auto grid max-w-6xl gap-6 px-4 py-10 sm:grid-cols-4">
            {[
              { k: "180", v: "Full exam length" },
              { k: "230m", v: "Timed like the real exam" },
              { k: "3", v: "PMP domains covered" },
              { k: "24/7", v: "AI PMP coach on-call" },
            ].map((s) => (
              <div key={s.v} className="text-center">
                <div className="text-3xl font-black text-white">{s.k}</div>
                <div className="mt-1 text-xs uppercase tracking-widest text-slate-400">{s.v}</div>
              </div>
            ))}
          </div>
        </section>

        {/* BLOG */}
        <section id="blog" className="mx-auto max-w-6xl px-4 py-16 sm:py-20">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
            <div>
              <div className="text-xs uppercase tracking-widest text-cyan-300">The ProjectSim blog</div>
              <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
                Articles for people preparing for the PMP
              </h2>
              <p className="mt-2 max-w-2xl text-slate-400">
                Study strategies, PMBOK deep-dives, and PMI-mindset breakdowns from working project managers.
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {BLOG_POSTS.map((p) => (
              <article
                key={p.title}
                className="group cursor-pointer rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition hover:border-cyan-400/40 hover:bg-white/[0.05]"
              >
                <div className="flex items-center gap-2 text-xs text-cyan-200">
                  <span className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-2 py-0.5">
                    {p.tag}
                  </span>
                  <span className="text-slate-500">{p.read}</span>
                </div>
                <h3 className="mt-3 text-lg font-semibold leading-snug text-white group-hover:text-cyan-200">
                  {p.title}
                </h3>
                <p className="mt-2 text-sm text-slate-400">{p.excerpt}</p>
                <div className="mt-4 text-xs font-medium text-cyan-300">Read article →</div>
              </article>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="mx-auto max-w-6xl px-4 pb-20">
          <div className="overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-indigo-600/30 via-slate-900 to-cyan-500/20 p-10 text-center">
            <h2 className="text-3xl font-bold sm:text-4xl">Ready to test where you stand?</h2>
            <p className="mx-auto mt-3 max-w-xl text-slate-300">
              Take a mini exam in 30 minutes. Get a readiness score, weakest topics, and an AI-generated study plan.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Button
                size="lg"
                onClick={() => navigate({ to: signedIn ? "/exam" : "/auth" })}
                className="bg-gradient-to-r from-indigo-500 to-cyan-400 px-8 text-slate-950 hover:opacity-90"
              >
                Start a mini exam
              </Button>
              <Button asChild size="lg" variant="outline" className="border-white/10 bg-white/[0.04] text-slate-100 hover:bg-white/[0.08]">
                <Link to="/pricing">See Pro — $19/mo</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/5 py-8">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 text-xs text-slate-500">
          <div>© {new Date().getFullYear()} ProjectSim. Not affiliated with PMI.</div>
          <div className="flex gap-4">
            <Link to="/pricing" className="hover:text-slate-300">Pricing</Link>
            <a href="#blog" className="hover:text-slate-300">Blog</a>
            <Link to="/auth" className="hover:text-slate-300">Sign in</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
