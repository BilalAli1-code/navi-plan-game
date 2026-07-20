import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  X,
  ChevronUp,
  ChevronDown,
  Send,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Lightbulb,
  Users,
  DollarSign,
  BookOpen,
} from "lucide-react";
import { toast } from "sonner";
import { useSim } from "@/lib/sim/store";
import { getCaseRef } from "@/lib/sim/cases";
import { cn } from "@/lib/utils";

type Advisory = {
  id: string;
  type: "warning" | "tip" | "coaching" | "pmbok";
  title: string;
  body: string;
};

function buildAdvisories(
  state: ReturnType<typeof useSim>["state"],
  caseRef: ReturnType<typeof getCaseRef>,
): Advisory[] {
  const advisories: Advisory[] = [];
  const m = state.metrics;

  // Warnings first
  if (m.risk < 55) {
    advisories.push({
      id: "warn-risk",
      type: "warning",
      title: "Risk exposure elevated",
      body: `Your risk posture is at ${Math.round(m.risk)}%. Review your risk register and activate contingency plans. This could impact project success.`,
    });
  }
  if (m.budget < 65) {
    advisories.push({
      id: "warn-budget",
      type: "warning",
      title: "Budget variance alert",
      body: `Budget health is ${Math.round(m.budget)}%. Prepare a variance analysis for your sponsor. Consider scope adjustment or resource optimization.`,
    });
  }
  if (m.morale < 60) {
    advisories.push({
      id: "warn-morale",
      type: "warning",
      title: "Team morale concern",
      body: `Team morale has dropped to ${Math.round(m.morale)}%. Arrange a team meeting to address concerns, recognize achievements, and redistribute workload.`,
    });
  }
  if (m.trust < 60) {
    advisories.push({
      id: "warn-trust",
      type: "warning",
      title: "Stakeholder trust declining",
      body: `Stakeholder trust is at ${Math.round(m.trust)}%. Increase proactive communication. Send a status update and hold a quick alignment meeting.`,
    });
  }

  // Coaching tips
  if (state.phase === "Tailoring") {
    advisories.push({
      id: "coach-tailoring",
      type: "coaching",
      title: "Tailoring is critical",
      body: `In ${caseRef.industry}, the delivery approach must match project complexity. Consider ${caseRef.recommendedApproach} given the project context.`,
    });
  } else if (state.phase === "Initiation") {
    advisories.push({
      id: "coach-initiation",
      type: "coaching",
      title: "Build your foundation now",
      body: `Initiation is your best chance to align stakeholders and set expectations. Make sure your Charter clearly defines success criteria.`,
    });
  } else if (state.phase === "Planning") {
    advisories.push({
      id: "coach-planning",
      type: "coaching",
      title: "Plan for uncertainty",
      body: `Use a risk-adjusted schedule. Identify critical path activities and set realistic buffers. Good planning prevents 80% of execution problems.`,
    });
  } else if (state.phase === "Execution") {
    advisories.push({
      id: "coach-execution",
      type: "coaching",
      title: "Maintain cadence",
      body: `Keep daily standups or weekly status meetings. Identify blockers early. Your role is to enable the team, not manage every task.`,
    });
  } else if (state.phase === "Monitoring") {
    advisories.push({
      id: "coach-monitoring",
      type: "coaching",
      title: "Trust but verify",
      body: `Monitor CPI and SPI weekly. When you see variance trends, intervene proactively rather than reactively.`,
    });
  } else if (state.phase === "Closing") {
    advisories.push({
      id: "coach-closing",
      type: "coaching",
      title: "Close properly",
      body: `Capture all lessons learned. Get formal acceptance from stakeholders. Complete procurement closure and release your team formally.`,
    });
  }

  // PMBOK tips
  advisories.push({
    id: "pmbok-tip",
    type: "pmbok",
    title: `PMBOK: ${state.phase} best practices`,
    body:
      state.phase === "Tailoring"
        ? "PMBOK 7th Edition: Tailoring the approach to context is a core PM competency. Not all processes need the same rigor."
        : state.phase === "Initiation"
          ? "PMI Principle: Stewardship — act with integrity, care, and trustworthiness. Start by setting ethical standards for your project."
          : state.phase === "Planning"
            ? "PMI Domain: Planning — develop an iterative, adaptable plan. Over-planning is as risky as under-planning."
            : state.phase === "Execution"
              ? "PMI Domain: Delivery — focus on delivering value. Remove impediments. Enable your team to do their best work."
              : state.phase === "Monitoring"
                ? "PMI Domain: Performance — use earned value analysis. EV = BAC × % complete. SPI = EV/PV. CPI = EV/AC."
                : state.phase === "Closing"
                  ? "PMI Domain: Stakeholders — ensure final acceptance is documented. A verbal 'OK' is not project closure."
                  : "PMI Principle: Stewardship of value — the project's purpose is to deliver lasting organizational value.",
  });

  // Proactive tips
  if (state.log.length === 0 && state.phase !== "Tailoring") {
    advisories.push({
      id: "tip-start",
      type: "tip",
      title: "Start making decisions",
      body: "You have unread emails and scheduled meetings. Check your inbox — each email or meeting may unlock a key decision.",
    });
  }
  if (state.xp < 50 && state.phase !== "Tailoring") {
    advisories.push({
      id: "tip-xp",
      type: "tip",
      title: "Earn XP by making quality decisions",
      body: "Excellent decisions give 25 XP, good ones give 15 XP. Focus on PMBOK-aligned choices to maximize your score.",
    });
  }

  return advisories.slice(0, 5);
}

// ─── Advisory Card ────────────────────────────────────────────────────────────

const ADVISORY_STYLE = {
  warning: {
    bg: "bg-[color:var(--color-destructive)]/[0.08]",
    border: "border-[color:var(--color-destructive)]/30",
    icon: <ShieldAlert className="h-4 w-4" />,
    iconCls: "text-[color:var(--color-destructive)]",
    badge: "bg-[color:var(--color-destructive)]/15 text-[color:var(--color-destructive)]",
    badgeLabel: "Warning",
  },
  coaching: {
    bg: "bg-accent/[0.06]",
    border: "border-accent/20",
    icon: <Users className="h-4 w-4" />,
    iconCls: "text-accent",
    badge: "bg-accent/15 text-accent",
    badgeLabel: "Coaching",
  },
  tip: {
    bg: "bg-blue-500/[0.06]",
    border: "border-blue-500/20",
    icon: <Lightbulb className="h-4 w-4" />,
    iconCls: "text-blue-400",
    badge: "bg-blue-500/15 text-blue-400",
    badgeLabel: "Tip",
  },
  pmbok: {
    bg: "bg-purple-500/[0.06]",
    border: "border-purple-500/20",
    icon: <BookOpen className="h-4 w-4" />,
    iconCls: "text-purple-400",
    badge: "bg-purple-500/15 text-purple-400",
    badgeLabel: "PMBOK",
  },
};

function AdvisoryCard({ advisory }: { advisory: Advisory }) {
  const s = ADVISORY_STYLE[advisory.type];
  return (
    <div className={cn("rounded-xl border p-3", s.bg, s.border)}>
      <div className="flex items-start gap-2.5">
        <span className={cn("mt-0.5 shrink-0", s.iconCls)}>{s.icon}</span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[12px] font-semibold text-foreground">{advisory.title}</span>
            <span className={cn("rounded-full px-1.5 py-0.5 text-[9px] font-semibold", s.badge)}>
              {s.badgeLabel}
            </span>
          </div>
          <p className="mt-1 text-[11px] leading-relaxed text-foreground/75">{advisory.body}</p>
        </div>
      </div>
    </div>
  );
}

// ─── Main MayaFloating export ─────────────────────────────────────────────────

export function MayaFloating() {
  const { state, activeDecision, runId } = useSim();
  const c = getCaseRef(state.caseId);
  const [expanded, setExpanded] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [q, setQ] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);

  // Proactive advisory notifications — re-fires if metric recovers then degrades again
  const firedAlerts = useRef(new Set<string>());
  useEffect(() => {
    const m = state.metrics;
    const proactive = [
      {
        key: `risk-${Math.round(m.risk / 10) * 10}`,
        trigger: m.risk < 55 && m.risk > 0,
        recover: m.risk >= 65, // clear key when metric recovers
        recoverKey: `risk-`,
        message: `⚠ Maya: Risk posture at ${Math.round(m.risk)}%. Activate your contingency plans now.`,
        type: "warning" as const,
      },
      {
        key: `budget-${Math.round(m.budget / 10) * 10}`,
        trigger: m.budget < 65 && m.budget > 0,
        recover: m.budget >= 75,
        recoverKey: `budget-`,
        message: `💸 Maya: Budget health is ${Math.round(m.budget)}%. Prepare a variance analysis for your sponsor.`,
        type: "warning" as const,
      },
      {
        key: `morale-${Math.round(m.morale / 10) * 10}`,
        trigger: m.morale < 60 && m.morale > 0,
        recover: m.morale >= 70,
        recoverKey: `morale-`,
        message: `😟 Maya: Team morale dropped to ${Math.round(m.morale)}%. Schedule a team check-in.`,
        type: "warning" as const,
      },
      {
        key: `trust-${Math.round(m.trust / 10) * 10}`,
        trigger: m.trust < 55 && m.trust > 0,
        recover: m.trust >= 65,
        recoverKey: `trust-`,
        message: `🤝 Maya: Stakeholder trust at ${Math.round(m.trust)}%. Send a proactive status update.`,
        type: "warning" as const,
      },
      {
        key: `phase-${state.phase}`,
        trigger: state.phase !== "Tailoring" && state.phase !== "Complete",
        recover: false,
        recoverKey: "",
        message: `📋 Maya: You've entered ${state.phase}. ${c.projectName} — stay focused on your critical path.`,
        type: "info" as const,
      },
    ];

    proactive.forEach(({ key, trigger, recover, recoverKey, message, type }) => {
      // Clear stale keys when metric recovers so future degradation re-fires
      if (recover && recoverKey) {
        for (const fired of firedAlerts.current) {
          if (fired.startsWith(recoverKey)) firedAlerts.current.delete(fired);
        }
      }
      if (trigger && !firedAlerts.current.has(key)) {
        firedAlerts.current.add(key);
        setTimeout(() => {
          if (type === "warning") {
            toast.warning(message, { duration: 5000 });
          } else {
            toast.info(message, { duration: 4000 });
          }
        }, 1200);
      }
    });
  }, [state.metrics, state.phase, c.projectName]);

  const advisories = buildAdvisories(state, c);
  const urgentCount = advisories.filter((a) => a.type === "warning").length;

  const scenarioTitle = activeDecision?.title ?? `${c.projectName} — ${state.phase}`;
  const scenarioSummary = activeDecision?.situation ?? c.body;

  async function ask(question: string) {
    const trimmed = question.trim();
    if (!trimmed || loading) return;
    setLoading(true);
    setAnswer("");
    try {
      const { supabase } = await import("@/integrations/supabase/client");
      const { data: sess } = await supabase.auth.getSession();
      const token = sess.session?.access_token;
      const res = await fetch("/api/maya-ask", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          question: trimmed,
          scenarioTitle,
          scenarioSummary: scenarioSummary.replace(/\*\*/g, ""),
          phase: state.phase,
          chosenLabel: null,
          runId: runId ?? undefined,
        }),
      });
      if (!res.ok || !res.body) throw new Error(await res.text().catch(() => "unavailable"));
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        setAnswer((p) => p + decoder.decode(value, { stream: true }));
      }
    } catch (err) {
      setAnswer(err instanceof Error ? err.message : "Maya is offline");
    } finally {
      setLoading(false);
    }
  }

  const quickPrompts = activeDecision
    ? ["What PMI principle applies here?", "Which option is PMBOK-aligned?", "What are the risks?"]
    : ["How do I approach this phase?", "What should I prioritize?", "What are the biggest risks?"];

  if (minimized) {
    return (
      <motion.button
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        onClick={() => setMinimized(false)}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-accent shadow-lg shadow-accent/20 ring-2 ring-accent/30 transition hover:scale-105"
      >
        <div className="text-accent-foreground font-bold text-lg">M</div>
        {urgentCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-[color:var(--color-destructive)] text-[10px] font-bold text-white">
            {urgentCount}
          </span>
        )}
      </motion.button>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className="fixed bottom-6 right-6 z-50 w-[340px] rounded-3xl border border-white/10 bg-background/95 shadow-2xl shadow-black/40 backdrop-blur-xl"
    >
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-white/10 px-4 py-3">
        <div className="relative">
          <div className="grid h-9 w-9 place-items-center rounded-full bg-accent text-accent-foreground font-bold text-[15px]">
            M
          </div>
          <div className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-background bg-[color:var(--color-success)]" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[13px] font-semibold text-foreground">Maya</div>
          <div className="text-[10px] text-muted-foreground">Senior PM · Your project advisor</div>
        </div>
        <div className="flex items-center gap-1">
          {urgentCount > 0 && (
            <span className="flex items-center gap-1 rounded-full bg-[color:var(--color-destructive)]/15 px-2 py-0.5 text-[10px] font-semibold text-[color:var(--color-destructive)]">
              <AlertTriangle className="h-3 w-3" />
              {urgentCount}
            </span>
          )}
          <button
            onClick={() => setExpanded((v) => !v)}
            className="grid h-7 w-7 place-items-center rounded-lg text-muted-foreground hover:bg-white/[0.08] hover:text-foreground"
          >
            {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          </button>
          <button
            onClick={() => setMinimized(true)}
            className="grid h-7 w-7 place-items-center rounded-lg text-muted-foreground hover:bg-white/[0.08] hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            key="expanded"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            {/* Context chip */}
            <div className="mx-4 mt-3 rounded-xl bg-white/[0.04] px-3 py-2 text-[11px] text-foreground/75">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-accent">
                Context
              </span>
              <div className="mt-0.5">
                {activeDecision
                  ? `Active decision: "${activeDecision.title}" (${activeDecision.ecoDomain})`
                  : `${state.phase} phase · ${c.projectName}`}
              </div>
            </div>

            {/* Advisories */}
            <div className="mx-4 mt-3 space-y-2">
              {advisories.slice(0, 3).map((a) => (
                <AdvisoryCard key={a.id} advisory={a} />
              ))}
            </div>

            {/* Quick prompts */}
            <div className="mx-4 mt-3 space-y-1">
              {quickPrompts.map((p) => (
                <button
                  key={p}
                  onClick={() => {
                    setQ(p);
                    void ask(p);
                  }}
                  disabled={loading}
                  className="w-full rounded-xl border border-white/[0.08] bg-white/[0.02] px-3 py-2 text-left text-[11px] text-foreground/75 transition hover:border-accent/30 hover:text-accent disabled:opacity-60"
                >
                  {p}
                </button>
              ))}
            </div>

            {/* Answer */}
            {(loading || answer) && (
              <div className="mx-4 mt-2 rounded-xl bg-white/[0.03] p-3 text-[11px] leading-relaxed text-foreground/85 whitespace-pre-wrap max-h-[120px] overflow-y-auto">
                {answer || "Maya is thinking…"}
                {loading && answer && <span className="ml-0.5 animate-pulse">▍</span>}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void ask(q);
          setExpanded(true);
        }}
        className="flex items-center gap-2 border-t border-white/10 px-3 py-2.5"
      >
        <Sparkles className="h-3.5 w-3.5 shrink-0 text-accent" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Ask Maya anything…"
          className="flex-1 bg-transparent text-[12px] focus:outline-none"
        />
        <button
          type="submit"
          disabled={loading || !q.trim()}
          className="grid h-7 w-7 place-items-center rounded-lg bg-accent text-accent-foreground disabled:opacity-40"
        >
          <Send className="h-3 w-3" />
        </button>
      </form>
    </motion.div>
  );
}
