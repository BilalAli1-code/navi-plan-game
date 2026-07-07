import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { AppShell } from "@/components/app-shell";
import {
  BookOpen,
  Brain,
  ClipboardCheck,
  Compass,
  Sparkles,
  Target,
  TrendingUp,
  Users,
  ArrowRight,
  Quote,
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
      { property: "og:title", content: "ProjectSim — PMP Exam Simulator & PMBOK Training" },
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
    { icon: Compass, t: "One project, five phases", d: "Initiation through Closing with consequences that carry across phases." },
    { icon: Brain, t: "AI PMP coach", d: "PMBOK-grounded coaching, PMI mindset cues, and simulated stakeholder reactions." },
    { icon: TrendingUp, t: "Adaptive scenarios", d: "The simulator biases toward the knowledge areas you underperform on in the exam." },
  ],
  exam: [
    { icon: ClipboardCheck, t: "Full 180-question exam", d: "Realistic 230-minute test with mark-for-review, breaks, resume, and review screen." },
    { icon: Target, t: "Readiness scoring", d: "Domain and knowledge-area breakdowns, estimated pass probability, timing diagnostics." },
    { icon: Sparkles, t: "AI review after every exam", d: "Follow-up questions and a personalized study plan grounded in your actual weaknesses." },
  ],
  coach: [
    { icon: Users, t: "Stakeholder reactions", d: "Sponsors, clients, and teams respond differently based on your PMBOK judgment." },
    { icon: BookOpen, t: "PMBOK 6 + PMBOK 7", d: "Coaching cites the specific process, principle, or performance domain — not generic advice." },
    { icon: TrendingUp, t: "Progress that persists", d: "XP, badges, streaks, and reports sync to your account across every device." },
  ],
};

const JOURNAL = [
  {
    tag: "Study strategy",
    title: "How to pass the PMP exam in six weeks without burning out",
    excerpt: "A realistic study cadence built around three practice exams, targeted knowledge-area drills, and a weekly retro on your weakest topics.",
    read: "8 min",
  },
  {
    tag: "PMBOK 7",
    title: "The twelve PMBOK 7 principles, translated for exam questions",
    excerpt: "How stewardship, tailoring, and systems thinking actually show up in scenario answers — and the trap distractors PMI loves.",
    read: "6 min",
  },
  {
    tag: "Mindset",
    title: "The PMI mindset cheatsheet for choosing the least-wrong answer",
    excerpt: "The nine decision heuristics that separate the correct PMP answer from the plausible-looking one. Save this before your next mock.",
    read: "5 min",
  },
  {
    tag: "Simulator",
    title: "Why simulated projects outperform flashcards for PMP prep",
    excerpt: "Retention research on why decision-under-pressure practice beats passive review — and how to structure your own dry runs.",
    read: "4 min",
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
    <AppShell variant="marketing">
      {/* ============ HERO — magazine masthead ============ */}
      <section className="relative overflow-hidden border-b border-border/60">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-70"
          style={{
            backgroundImage:
              "radial-gradient(80% 60% at 50% 0%, oklch(0.34 0.09 253 / 0.6), transparent 70%)",
          }}
        />
        <div className="relative mx-auto max-w-7xl px-6 pt-20 pb-24 sm:pt-28">
          {/* Masthead rule */}
          <div className="flex items-center justify-between gap-6 border-b border-border/60 pb-6 text-[11px] uppercase tracking-[0.28em] text-muted-foreground">
            <span>Volume 01 · The PMP Issue</span>
            <span className="hidden sm:inline">Est. 2026 · A study in decisions</span>
          </div>

          <div className="mt-10 grid gap-12 md:grid-cols-12">
            <div className="md:col-span-8">
              <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                PMBOK 6 · PMBOK 7 · Hybrid · Agile
              </div>
              <h1 className="mt-6 font-display text-5xl leading-[1.02] tracking-tight sm:text-6xl md:text-7xl">
                Pass the PMP by <em className="not-italic text-primary">managing</em> real projects,
                not by memorizing them.
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
                A full 180-question exam simulator, a decision-based project simulator,
                and an AI coach that grounds every explanation in PMBOK. Practice like
                the exam. Learn like the job.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Button
                  size="lg"
                  onClick={() => navigate({ to: signedIn ? "/exam" : "/auth" })}
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  Start the exam simulator
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="border-border bg-surface/60 hover:bg-surface"
                >
                  <Link to={signedIn ? "/play" : "/auth"}>Open project simulator</Link>
                </Button>
              </div>

              <dl className="mt-10 grid grid-cols-3 gap-6 border-t border-border/60 pt-6 text-sm">
                {[
                  { k: "180", v: "Question full exam" },
                  { k: "230m", v: "Timed like the real test" },
                  { k: "24/7", v: "AI coach on-call" },
                ].map((s) => (
                  <div key={s.v}>
                    <dt className="font-display text-3xl font-bold tracking-tight">{s.k}</dt>
                    <dd className="mt-1 text-xs uppercase tracking-widest text-muted-foreground">
                      {s.v}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>

            {/* Sidebar feature card */}
            <aside className="md:col-span-4">
              <div className="sticky top-24 rounded-2xl border border-border bg-surface p-6 shadow-2xl shadow-background/50">
                <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                  <span>Featured</span>
                  <span>04 · 2026</span>
                </div>
                <h2 className="mt-4 font-display text-2xl leading-tight tracking-tight">
                  A simulator that answers back
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  Every decision returns a PMBOK-grounded rationale, a PMI mindset cue,
                  and a stakeholder reaction. This is not a quiz.
                </p>
                <div className="mt-6 rounded-xl border border-border/70 bg-background/60 p-4">
                  <Quote className="h-4 w-4 text-primary" />
                  <p className="mt-3 font-serif text-[15px] italic leading-relaxed">
                    "The closest thing to actually running a project I've found for PMP prep."
                  </p>
                  <div className="mt-3 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                    — L. Ortiz, PMP · March 2026
                  </div>
                </div>
                <div className="mt-6 flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Read the method</span>
                  <a
                    href="#features"
                    className="font-medium text-primary hover:underline"
                  >
                    Continue →
                  </a>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>

      {/* ============ FEATURES — tabbed magazine spread ============ */}
      <section id="features" className="border-b border-border/60">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <div className="grid gap-10 md:grid-cols-12">
            <div className="md:col-span-4">
              <div className="text-xs uppercase tracking-[0.28em] text-muted-foreground">
                Section 01 — The Method
              </div>
              <h2 className="mt-3 font-display text-4xl leading-tight tracking-tight sm:text-5xl">
                One platform.<br />
                <em className="not-italic text-primary">Three surfaces.</em>
              </h2>
              <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
                Switch between exam-style practice, decision-based simulation, and AI
                coaching — all working from a shared performance model. What you miss on
                the exam biases the simulator; what you learn in the simulator surfaces
                on the exam.
              </p>
            </div>

            <div className="md:col-span-8">
              <Tabs defaultValue="exam">
                <TabsList className="flex w-full max-w-lg bg-surface">
                  <TabsTrigger value="exam" className="flex-1">Exam</TabsTrigger>
                  <TabsTrigger value="simulator" className="flex-1">Simulator</TabsTrigger>
                  <TabsTrigger value="coach" className="flex-1">Coach</TabsTrigger>
                </TabsList>
                {(["exam", "simulator", "coach"] as const).map((k) => (
                  <TabsContent key={k} value={k} className="mt-6">
                    <div className="grid gap-4 sm:grid-cols-3">
                      {FEATURES[k].map((f) => (
                        <Card
                          key={f.t}
                          className="border-border/70 bg-surface/60 p-5 transition hover:border-primary/50 hover:bg-surface"
                        >
                          <f.icon className="h-5 w-5 text-primary" />
                          <div className="mt-4 font-display text-lg tracking-tight">
                            {f.t}
                          </div>
                          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                            {f.d}
                          </p>
                        </Card>
                      ))}
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            </div>
          </div>
        </div>
      </section>

      {/* ============ MID-PAGE PULL QUOTE ============ */}
      <section className="border-b border-border/60 bg-surface/40">
        <div className="mx-auto max-w-4xl px-6 py-20 text-center">
          <Quote className="mx-auto h-6 w-6 text-primary" />
          <blockquote className="mt-6 font-display text-3xl italic leading-snug tracking-tight sm:text-4xl">
            "Reading PMBOK teaches you the vocabulary.
            <br className="hidden sm:block" />
            Running a project teaches you the judgment."
          </blockquote>
          <div className="mt-6 text-xs uppercase tracking-[0.22em] text-muted-foreground">
            The ProjectSim editorial
          </div>
        </div>
      </section>

      {/* ============ JOURNAL — magazine grid ============ */}
      <section id="blog" className="border-b border-border/60">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <div className="mb-10 flex flex-wrap items-end justify-between gap-4 border-b border-border/60 pb-6">
            <div>
              <div className="text-xs uppercase tracking-[0.28em] text-muted-foreground">
                Section 02 — Journal
              </div>
              <h2 className="mt-2 font-display text-4xl tracking-tight sm:text-5xl">
                Field notes for PMP candidates
              </h2>
            </div>
            <div className="max-w-md text-sm text-muted-foreground">
              Study strategies, PMBOK deep-dives, and PMI-mindset breakdowns from
              working project managers.
            </div>
          </div>

          <div className="grid gap-8 md:grid-cols-12">
            {/* Featured article — column-span 7 */}
            <article className="group md:col-span-7">
              <div className="aspect-[16/10] overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-primary/40 via-surface-strong to-background">
                <div className="grid h-full place-items-center">
                  <div className="text-center">
                    <div className="font-display text-6xl tracking-tight">PMP.</div>
                    <div className="mt-2 text-xs uppercase tracking-[0.28em] text-muted-foreground">
                      The six-week plan
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-6 flex items-center gap-3 text-xs uppercase tracking-[0.2em] text-muted-foreground">
                <span className="rounded-full bg-primary-soft px-2 py-1 text-primary">{JOURNAL[0].tag}</span>
                <span>{JOURNAL[0].read} read</span>
              </div>
              <h3 className="mt-4 font-display text-3xl leading-tight tracking-tight group-hover:text-primary sm:text-4xl">
                {JOURNAL[0].title}
              </h3>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                {JOURNAL[0].excerpt}
              </p>
            </article>

            {/* Secondary articles — column-span 5 stacked */}
            <div className="space-y-8 md:col-span-5">
              {JOURNAL.slice(1).map((p) => (
                <article
                  key={p.title}
                  className="group cursor-pointer border-b border-border/60 pb-6 last:border-0 last:pb-0"
                >
                  <div className="flex items-center gap-3 text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                    <span className="rounded-full bg-primary-soft px-2 py-0.5 text-primary">{p.tag}</span>
                    <span>{p.read} read</span>
                  </div>
                  <h3 className="mt-3 font-display text-xl leading-snug tracking-tight group-hover:text-primary">
                    {p.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{p.excerpt}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ============ CTA ============ */}
      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="overflow-hidden rounded-3xl border border-border bg-surface p-10 sm:p-14">
          <div className="grid items-center gap-10 md:grid-cols-2">
            <div>
              <div className="text-xs uppercase tracking-[0.28em] text-muted-foreground">
                Ready when you are
              </div>
              <h2 className="mt-3 font-display text-4xl leading-tight tracking-tight sm:text-5xl">
                Test where you stand today.
              </h2>
              <p className="mt-4 text-muted-foreground">
                Take a 30-minute mini exam. Get a readiness score, weakest topics, and
                an AI-generated study plan calibrated to your gaps.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 md:justify-end">
              <Button
                size="lg"
                onClick={() => navigate({ to: signedIn ? "/exam" : "/auth" })}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Start a mini exam
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button asChild size="lg" variant="outline" className="border-border bg-background/60">
                <Link to="/pricing">See pricing</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </AppShell>
  );
}
