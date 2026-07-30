import { motion, AnimatePresence } from "framer-motion";
import { useSim } from "@/lib/sim/store";
import type { Decision, DecisionOption } from "@/lib/sim/types";
import { CheckCircle2, XCircle, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";

export function DecisionPanel({ decision }: { decision: Decision }) {
  const { state, submitDecision, setActiveDecision } = useSim();
  const logged = state.log.find((l) => l.decisionId === decision.id);
  const chosen = logged
    ? decision.options.find((o) => o.id === logged.optionId) ?? null
    : null;

  function pick(o: DecisionOption) {
    submitDecision(o, decision.id);
  }

  return (
    <motion.div
      key={decision.id}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-3xl border border-white/10 bg-white/[0.04] p-6"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="text-[10px] font-semibold uppercase tracking-widest text-accent">
            {decision.phase} · {decision.ecoDomain}
          </div>
          <h2 className="mt-1 text-[22px] font-bold leading-tight text-foreground">{decision.title}</h2>
          <div className="mt-1 text-[11px] text-muted-foreground">
            ECO: {decision.ecoTask} · PMBOK 8 Domain: {decision.pmbokDomain}
          </div>
        </div>
        <button
          onClick={() => setActiveDecision(null)}
          className="rounded-full px-2 py-1 text-[12px] text-muted-foreground hover:text-foreground"
        >
          Close
        </button>
      </div>

      <div
        className="prose prose-invert mt-4 max-w-none text-[15px] leading-relaxed text-foreground/85"
        dangerouslySetInnerHTML={{ __html: mdToHtml(decision.situation) }}
      />

      <div className="mt-6 space-y-3">
        {decision.options.map((o) => {
          const isChosen = chosen?.id === o.id;
          const disabled = !!chosen && !isChosen;
          return (
            <button
              key={o.id}
              disabled={!!chosen}
              onClick={() => pick(o)}
              className={
                "block w-full rounded-2xl border p-4 text-left transition " +
                (isChosen
                  ? "border-accent bg-accent/10"
                  : disabled
                    ? "cursor-not-allowed border-white/5 bg-white/[0.01] opacity-60"
                    : "border-white/10 bg-white/[0.02] hover:border-accent/50 hover:bg-white/[0.04]")
              }
            >
              <div className="flex items-start gap-3">
                <div className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-white/10 text-[11px] font-bold">
                  {o.id}
                </div>
                <div className="min-w-0">
                  <div className="text-[14px] font-medium text-foreground">{o.label}</div>
                  {chosen && (
                    <div className="mt-2 text-[12px] text-muted-foreground">{o.rationale}</div>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <AnimatePresence>
        {chosen && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 space-y-3"
          >
            <div
              className={
                "flex items-start gap-3 rounded-2xl border p-4 " +
                (logged?.correct
                  ? "border-[color:var(--color-success)]/40 bg-[color:var(--color-success)]/10"
                  : "border-[color:var(--color-destructive)]/40 bg-[color:var(--color-destructive)]/10")
              }
            >
              {logged?.correct ? (
                <CheckCircle2 className="mt-0.5 h-5 w-5 text-[color:var(--color-success)]" />
              ) : (
                <XCircle className="mt-0.5 h-5 w-5 text-[color:var(--color-destructive)]" />
              )}
              <div>
                <div className="text-[12px] font-semibold uppercase tracking-widest">
                  {logged?.correct ? "PMI-aligned move" : "Not the PMI-recommended path"}
                </div>
                <div className="mt-1 text-[14px] text-foreground/85">{chosen.consequence}</div>
                <div className="mt-2 text-[12px] italic text-foreground/70">{chosen.pmiPrinciple}</div>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-2xl border border-[color:var(--color-warning)]/30 bg-[color:var(--color-warning)]/5 p-4">
              <Lightbulb className="mt-0.5 h-5 w-5 text-[color:var(--color-warning)]" />
              <div className="text-[13px] text-foreground/85">
                <span className="mr-2 font-semibold text-[color:var(--color-warning)]">Exam tip:</span>
                {decision.examTip}
              </div>
            </div>

            <Button
              onClick={() => setActiveDecision(null)}
              className="w-full rounded-full"
              variant="secondary"
            >
              Continue working
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// Extremely small subset: **bold** and paragraphs. Sanitized: only escapes HTML then re-injects our bold.
function mdToHtml(md: string): string {
  const escape = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return escape(md)
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .split("\n\n")
    .map((p) => `<p>${p.replace(/\n/g, "<br/>")}</p>`)
    .join("");
}
