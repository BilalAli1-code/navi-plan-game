import { useState } from "react";
import { motion } from "framer-motion";
import { Send, X } from "lucide-react";
import { useSim } from "@/lib/sim/store";
import { stakeholdersFor, getCaseRef } from "@/lib/sim/cases";
import type { Stakeholder } from "@/lib/sim/types";
import { cn } from "@/lib/utils";

export function Stakeholders() {
  const { state } = useSim();
  const stakes = stakeholdersFor(state.caseId);
  const [chatWith, setChatWith] = useState<Stakeholder | null>(null);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {stakes.map((s) => (
          <div key={s.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <div className="flex items-start gap-3">
              <div className={cn("grid h-11 w-11 shrink-0 place-items-center rounded-full text-[14px] font-bold text-white", s.color)}>
                {s.avatarInitial}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[14px] font-semibold text-foreground">{s.name}</div>
                <div className="text-[11px] text-muted-foreground">{s.role}</div>
              </div>
            </div>
            <p className="mt-3 text-[12px] leading-relaxed text-foreground/75">{s.personality}</p>
            <div className="mt-2 flex flex-wrap gap-1">
              {s.priorities.map((p) => (
                <span key={p} className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[10px] text-foreground/70">
                  {p}
                </span>
              ))}
            </div>
            <button
              onClick={() => setChatWith(s)}
              className="mt-3 w-full rounded-full bg-accent/15 py-2 text-[12px] font-semibold text-accent transition hover:bg-accent/25"
            >
              Chat with {s.name.split(" ")[0]}
            </button>
          </div>
        ))}
      </div>

      {chatWith && <StakeholderChat stakeholder={chatWith} onClose={() => setChatWith(null)} />}
    </div>
  );
}

function StakeholderChat({ stakeholder, onClose }: { stakeholder: Stakeholder; onClose: () => void }) {
  const { state } = useSim();
  const c = getCaseRef(state.caseId);
  const [messages, setMessages] = useState<{ role: "you" | "them"; text: string }[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);

  async function send() {
    const trimmed = q.trim();
    if (!trimmed || loading) return;
    setQ("");
    setMessages((m) => [...m, { role: "you", text: trimmed }, { role: "them", text: "" }]);
    setLoading(true);
    try {
      const res = await fetch("/api/sim-stakeholder", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          question: trimmed,
          stakeholderName: stakeholder.name,
          stakeholderRole: stakeholder.role,
          stakeholderPersonality: stakeholder.personality,
          stakeholderPriorities: stakeholder.priorities,
          projectName: c.projectName,
          industry: c.industry,
          phase: state.phase,
        }),
      });
      if (!res.ok || !res.body) throw new Error(await res.text().catch(() => "unavailable"));
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        setMessages((m) => {
          const copy = [...m];
          copy[copy.length - 1] = { role: "them", text: copy[copy.length - 1].text + chunk };
          return copy;
        });
      }
    } catch (err) {
      setMessages((m) => {
        const copy = [...m];
        copy[copy.length - 1] = { role: "them", text: `(${stakeholder.name.split(" ")[0]} couldn't respond right now)` };
        return copy;
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.96, y: 10 }}
        animate={{ scale: 1, y: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="flex h-[75vh] w-full max-w-lg flex-col overflow-hidden rounded-3xl border border-white/15 bg-[color:var(--color-surface)]"
      >
        <div className="flex items-center gap-3 border-b border-white/10 p-4">
          <div className={cn("grid h-10 w-10 place-items-center rounded-full text-[13px] font-bold text-white", stakeholder.color)}>
            {stakeholder.avatarInitial}
          </div>
          <div className="flex-1">
            <div className="text-[14px] font-semibold text-foreground">{stakeholder.name}</div>
            <div className="text-[11px] text-muted-foreground">{stakeholder.role}</div>
          </div>
          <button onClick={onClose} className="rounded-full p-1 text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          {messages.length === 0 && (
            <div className="rounded-2xl bg-white/[0.03] p-4 text-[13px] text-muted-foreground">
              Start a conversation with {stakeholder.name.split(" ")[0]}. They will respond in-character.
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} className={m.role === "you" ? "flex justify-end" : "flex justify-start"}>
              <div
                className={cn(
                  "max-w-[80%] rounded-2xl px-3 py-2 text-[13px] leading-relaxed",
                  m.role === "you"
                    ? "bg-accent text-accent-foreground"
                    : "bg-white/[0.06] text-foreground/90",
                )}
              >
                {m.text || (loading && i === messages.length - 1 ? "…" : "")}
              </div>
            </div>
          ))}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            void send();
          }}
          className="flex items-center gap-2 border-t border-white/10 p-3"
        >
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={`Ask ${stakeholder.name.split(" ")[0]}…`}
            className="flex-1 rounded-full bg-white/[0.05] px-4 py-2.5 text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent"
          />
          <button
            type="submit"
            disabled={loading || !q.trim()}
            className="grid h-10 w-10 place-items-center rounded-full bg-accent text-accent-foreground disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </motion.div>
    </motion.div>
  );
}
