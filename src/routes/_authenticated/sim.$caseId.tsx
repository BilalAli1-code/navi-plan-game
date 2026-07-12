import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SimProvider, useSim } from "@/lib/sim/store";
import { WorkplaceShell } from "@/components/sim/WorkplaceShell";
import { listCases, getCaseRef } from "@/lib/sim/cases";
import { Sparkles, Send } from "lucide-react";

export const Route = createFileRoute("/_authenticated/sim/$caseId")({
  head: ({ params }) => {
    const c = listCases().find((x) => x.id === params.caseId);
    const title = c ? `${c.projectName} · ProjectSim` : "ProjectSim workplace";
    return {
      meta: [
        { title },
        {
          name: "description",
          content:
            "Manage a realistic project end-to-end — inbox, meetings, documents, stakeholders, and live dashboards — coached by Maya.",
        },
      ],
    };
  },
  component: SimRoute,
});

function SimRoute() {
  const { caseId } = Route.useParams();
  const navigate = useNavigate();
  const known = listCases().some((c) => c.id === caseId);

  useEffect(() => {
    if (!known) navigate({ to: "/play", replace: true });
  }, [known, navigate]);

  if (!known) return null;

  return (
    <SimProvider caseId={caseId}>
      <WorkplaceShell mayaSlot={<MayaSidePanel />} />
    </SimProvider>
  );
}

function MayaSidePanel() {
  const { state, activeDecision } = useSim();
  const c = getCaseRef(state.caseId);
  const [q, setQ] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);

  const scenarioTitle = activeDecision?.title ?? `${c.projectName} — ${state.phase}`;
  const scenarioSummary = activeDecision?.situation ?? c.body;

  async function ask(question: string) {
    const trimmed = question.trim();
    if (!trimmed || loading) return;
    setLoading(true);
    setAnswer("");
    try {
      const res = await fetch("/api/maya-ask", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          question: trimmed,
          scenarioTitle,
          scenarioSummary: scenarioSummary.replace(/\*\*/g, ""),
          phase: state.phase,
          chosenLabel: null,
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

  const prompts = activeDecision
    ? [
        "What PMI principle applies here?",
        "What should I pay attention to?",
        "Who owns this decision?",
      ]
    : [
        "How do I approach this phase?",
        "Which stakeholder should I engage first?",
        "What are the biggest risks now?",
      ];

  return (
    <div className="sticky top-4 rounded-3xl border border-white/10 bg-white/[0.03] p-5">
      <div className="mb-3 flex items-center gap-2">
        <div className="grid h-9 w-9 place-items-center rounded-full bg-accent text-accent-foreground font-bold">M</div>
        <div>
          <div className="text-[14px] font-semibold text-foreground">Maya</div>
          <div className="text-[11px] text-muted-foreground">Senior PM · Your PMP coach</div>
        </div>
      </div>

      <div className="rounded-2xl bg-white/[0.05] p-3 text-[12px] text-foreground/80">
        <div className="mb-1 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-widest text-accent">
          <Sparkles className="h-3 w-3" /> Context
        </div>
        {activeDecision
          ? `Coaching you on "${activeDecision.title}" (${activeDecision.ecoDomain} · ${activeDecision.pmbokDomain}).`
          : `We're in the ${state.phase} phase of ${c.projectName}. Ask me anything.`}
      </div>

      <div className="mt-4 flex flex-col gap-1.5">
        {prompts.map((p) => (
          <button
            key={p}
            onClick={() => {
              setQ(p);
              void ask(p);
            }}
            disabled={loading}
            className="rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2 text-left text-[12px] text-foreground/80 transition hover:border-accent/40 hover:text-accent disabled:opacity-60"
          >
            {p}
          </button>
        ))}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void ask(q);
        }}
        className="mt-3 flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] pl-3 pr-1"
      >
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Ask Maya…"
          className="flex-1 bg-transparent py-2 text-[12px] focus:outline-none"
        />
        <button
          type="submit"
          disabled={loading || !q.trim()}
          className="grid h-8 w-8 place-items-center rounded-full bg-accent text-accent-foreground disabled:opacity-50"
          aria-label="Send"
        >
          <Send className="h-3.5 w-3.5" />
        </button>
      </form>

      {(loading || answer) && (
        <div className="mt-3 rounded-2xl bg-white/[0.03] p-3 text-[12px] leading-relaxed text-foreground/85 whitespace-pre-wrap">
          {answer || "Maya is thinking…"}
          {loading && answer && <span className="ml-0.5 animate-pulse">▍</span>}
        </div>
      )}
    </div>
  );
}
