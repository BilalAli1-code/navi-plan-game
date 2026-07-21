import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Hash, Search, Circle, Smile, Zap } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { useSim } from "@/lib/sim/store";
import { stakeholdersFor, getCaseRef } from "@/lib/sim/cases";
import { processAction } from "@/lib/sim/actions.functions";
import {
  appendChatMessage,
  listChatHistory,
  type ChatMessageRow,
} from "@/lib/sim/stakeholders.functions";
import type { Stakeholder } from "@/lib/sim/types";
import { cn } from "@/lib/utils";

// ChatPanel uses the same /api/sim-stakeholder streaming endpoint as Stakeholders.tsx
// and records interactions via processAction for mastery tracking.

// ─── Types ───────────────────────────────────────────────────────────────────

type ChatMessage = {
  id: string;
  senderId: string;
  senderName: string;
  senderInitial: string;
  senderColor: string;
  text: string;
  timestamp: string;
  isMe: boolean;
};

type Channel = {
  id: string;
  name: string;
  unread: number;
  description: string;
};

// ─── Seed messages from emails ────────────────────────────────────────────────

function buildChannelMessages(
  stakeholder: Stakeholder,
  state: ReturnType<typeof useSim>["state"],
): ChatMessage[] {
  const msgs: ChatMessage[] = [];

  // Convert emails from this stakeholder into chat messages
  const emailsFromStake = state.emails.filter((e) => e.from === stakeholder.id);
  emailsFromStake.forEach((email, i) => {
    msgs.push({
      id: `email-${email.id}-${i}`,
      senderId: stakeholder.id,
      senderName: stakeholder.name,
      senderInitial: stakeholder.avatarInitial,
      senderColor: stakeholder.color,
      text: email.preview,
      timestamp: email.receivedAt,
      isMe: false,
    });

    // If email is read and has a decision, add a follow-up
    if (email.read && email.unlocksDecisionId) {
      const dec = state.decisions.find((d) => d.id === email.unlocksDecisionId);
      if (dec) {
        msgs.push({
          id: `dec-followup-${email.id}-${i}`,
          senderId: stakeholder.id,
          senderName: stakeholder.name,
          senderInitial: stakeholder.avatarInitial,
          senderColor: stakeholder.color,
          text: `Also — ${dec.situation.split(".")[0].substring(0, 120)}.`,
          timestamp: email.receivedAt,
          isMe: false,
        });
      }
    }
  });

  return msgs.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
}

function toUiMessage(
  row: ChatMessageRow,
  stakeholder: Stakeholder,
  idx: number,
): ChatMessage {
  const isMe = row.role === "learner";
  return {
    id: `persisted-${stakeholder.id}-${idx}`,
    senderId: isMe ? "me" : stakeholder.id,
    senderName: isMe ? "You" : stakeholder.name,
    senderInitial: isMe ? "Y" : stakeholder.avatarInitial,
    senderColor: isMe ? "bg-slate-600" : stakeholder.color,
    text: row.content,
    timestamp: row.createdAt
      ? new Date(row.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      : new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    isMe,
  };
}

// ─── Single message bubble ───────────────────────────────────────────────────

function MessageBubble({ msg }: { msg: ChatMessage }) {
  if (msg.isMe) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[75%] rounded-2xl rounded-tr-sm bg-accent px-4 py-2.5 text-[13px] text-accent-foreground">
          {msg.text}
          <div className="mt-1 text-right text-[10px] opacity-60">{msg.timestamp}</div>
        </div>
      </div>
    );
  }
  return (
    <div className="flex items-start gap-3">
      <div
        className={cn(
          "grid h-8 w-8 shrink-0 place-items-center rounded-full text-[12px] font-bold text-white",
          msg.senderColor,
        )}
      >
        {msg.senderInitial}
      </div>
      <div className="max-w-[75%]">
        <div className="mb-1 text-[11px] font-semibold text-foreground/60">{msg.senderName}</div>
        <div className="rounded-2xl rounded-tl-sm border border-white/10 bg-white/[0.06] px-4 py-2.5 text-[13px] text-foreground/90">
          {msg.text}
        </div>
        <div className="mt-1 text-[10px] text-muted-foreground">{msg.timestamp}</div>
      </div>
    </div>
  );
}

// ─── Chat with one stakeholder ────────────────────────────────────────────────

function StakeholderChatThread({
  stakeholder,
  onBack,
  onOpenDecision,
}: {
  stakeholder: Stakeholder;
  onBack: () => void;
  onOpenDecision?: (id: string) => void;
}) {
  const { state, runId } = useSim();
  const caseRef = getCaseRef(state.caseId);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const recordAction = useServerFn(processAction);
  const persist = useServerFn(appendChatMessage);
  const loadHistory = useServerFn(listChatHistory);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Load persisted thread history for this stakeholder.
  useEffect(() => {
    let cancelled = false;
    setMessages([]);
    setHistoryLoaded(false);

    const seed = buildChannelMessages(stakeholder, state);

    if (!runId) {
      if (!cancelled) {
        setMessages(seed);
        setHistoryLoaded(true);
      }
      return () => {
        cancelled = true;
      };
    }

    loadHistory({ data: { runId, stakeholderId: stakeholder.id } })
      .then((rows: ChatMessageRow[]) => {
        if (cancelled) return;

        const persisted = rows.map((r, i) => toUiMessage(r, stakeholder, i));

        // Keep old seeded email context only if it isn't already represented.
        const persistedTextSet = new Set(
          persisted.map((m) => `${m.senderId}::${m.text.trim().toLowerCase()}`),
        );
        const dedupedSeed = seed.filter(
          (m) => !persistedTextSet.has(`${m.senderId}::${m.text.trim().toLowerCase()}`),
        );

        setMessages([...dedupedSeed, ...persisted]);
        setHistoryLoaded(true);
      })
      .catch(() => {
        if (!cancelled) {
          setMessages(seed);
          setHistoryLoaded(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [runId, stakeholder.id, loadHistory, state, stakeholder]);

  async function sendMessage() {
    const text = input.trim();
    if (!text || loading || !historyLoaded) return;
    setInput("");

    const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    const userMsg: ChatMessage = {
      id: `me-${Date.now()}`,
      senderId: "me",
      senderName: "You",
      senderInitial: "Y",
      senderColor: "bg-slate-600",
      text,
      timestamp: now,
      isMe: true,
    };
    // Append user msg + empty stakeholder placeholder
    setMessages((m) => [
      ...m,
      userMsg,
      {
        id: `reply-${Date.now()}`,
        senderId: stakeholder.id,
        senderName: stakeholder.name,
        senderInitial: stakeholder.avatarInitial,
        senderColor: stakeholder.color,
        text: "",
        timestamp: now,
        isMe: false,
      },
    ]);

    // Persist learner message immediately.
    if (runId) {
      void persist({
        data: {
          runId,
          stakeholderId: stakeholder.id,
          role: "learner",
          content: text,
          chapter: Math.max(1, Math.min(7, state.currentDay ?? 1)),
        },
      }).catch(() => {});
    }

    setLoading(true);
    let assistantText = "";
    try {
      const res = await fetch("/api/sim-stakeholder", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          question: text,
          stakeholderName: stakeholder.name,
          stakeholderRole: stakeholder.role,
          stakeholderPersonality: stakeholder.personality,
          stakeholderPriorities: stakeholder.priorities,
          projectName: caseRef.projectName,
          industry: caseRef.industry,
          phase: state.phase,
        }),
      });
      if (!res.ok || !res.body) throw new Error("unavailable");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        assistantText += chunk;
        setMessages((m) => {
          const copy = [...m];
          copy[copy.length - 1] = {
            ...copy[copy.length - 1],
            text: copy[copy.length - 1].text + chunk,
          };
          return copy;
        });
      }
    } catch {
      assistantText = `(${stakeholder.name.split(" ")[0]} couldn't respond right now)`;
      setMessages((m) => {
        const copy = [...m];
        copy[copy.length - 1] = {
          ...copy[copy.length - 1],
          text: assistantText,
        };
        return copy;
      });
    } finally {
      setLoading(false);

      // Persist stakeholder reply.
      if (runId && assistantText.trim()) {
        void persist({
          data: {
            runId,
            stakeholderId: stakeholder.id,
            role: "stakeholder",
            content: assistantText,
            chapter: Math.max(1, Math.min(7, state.currentDay ?? 1)),
          },
        }).catch(() => {});
      }

      // Record interaction for mastery tracking (fire-and-forget)
      if (runId) {
        void recordAction({
          data: {
            action: {
              actionType: "stakeholder_interaction",
              runId,
              sectionNumber: Math.max(1, Math.min(7, state.currentDay ?? 1)),
              stakeholderId: stakeholder.id,
              interactionType: "chat",
              learnerMessage: text,
            },
          },
        }).catch(() => {});
      }
    }
  }

  const pendingDecisionEmails = (() => {
    if (!onOpenDecision) return [];
    const answered = new Set(state.log.map((l) => l.decisionId));
    return state.emails.filter(
      (e) =>
        e.from === stakeholder.id &&
        e.unlocksDecisionId &&
        !answered.has(e.unlocksDecisionId),
    );
  })();

  return (
    <div className="flex h-full flex-col">
      {/* Channel header */}
      <div className="flex items-center gap-3 border-b border-white/10 px-5 py-3">
        <button
          onClick={onBack}
          className="text-[11px] text-muted-foreground hover:text-foreground"
        >
          ← Back
        </button>
        <div
          className={cn(
            "grid h-9 w-9 shrink-0 place-items-center rounded-full text-[13px] font-bold text-white",
            stakeholder.color,
          )}
        >
          {stakeholder.avatarInitial}
        </div>
        <div>
          <div className="text-[14px] font-semibold text-foreground">{stakeholder.name}</div>
          <div className="text-[11px] text-muted-foreground">{stakeholder.role} · Active now</div>
        </div>
        <div className="ml-auto flex h-2.5 w-2.5 rounded-full bg-[color:var(--color-success)]" />
      </div>

      {/* Messages */}
      <div className="flex-1 space-y-4 overflow-y-auto p-5">
        {!historyLoaded && (
          <div className="py-8 text-center text-[12px] text-muted-foreground">Loading history…</div>
        )}
        {historyLoaded && messages.length === 0 && (
          <div className="py-8 text-center text-[12px] text-muted-foreground">
            No messages yet. Say hello to {stakeholder.name.split(" ")[0]}!
          </div>
        )}
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              <MessageBubble msg={msg} />
            </motion.div>
          ))}
        </AnimatePresence>
        {loading && (
          <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
            <span className="animate-pulse">●</span>
            {stakeholder.name.split(" ")[0]} is typing…
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Pending decision CTA — shown when this stakeholder has emails with unanswered decisions */}
      {pendingDecisionEmails.length > 0 && onOpenDecision && (
        <div className="space-y-2 border-t border-white/10 px-5 py-3">
          {pendingDecisionEmails.map((e) => (
            <button
              key={e.unlocksDecisionId}
              onClick={() => onOpenDecision(e.unlocksDecisionId!)}
              className="flex w-full items-center gap-2 rounded-xl bg-accent/10 border border-accent/30 px-4 py-2.5 text-left text-[12px] font-semibold text-accent transition hover:bg-accent/15"
            >
              <Zap className="h-3.5 w-3.5 shrink-0" />
              <span className="flex-1 truncate">{e.subject} — Make the decision →</span>
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="border-t border-white/10 p-4">
        <form
          className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2"
          onSubmit={(e) => {
            e.preventDefault();
            void sendMessage();
          }}
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Message ${stakeholder.name.split(" ")[0]}…`}
            className="flex-1 bg-transparent text-[13px] focus:outline-none"
            disabled={loading || !historyLoaded}
          />
          <button
            type="submit"
            disabled={!input.trim() || loading || !historyLoaded}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-accent text-accent-foreground disabled:opacity-40"
          >
            <Send className="h-3.5 w-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── Main ChatPanel export ────────────────────────────────────────────────────

export function ChatPanel({ onOpenDecision }: { onOpenDecision?: (id: string) => void }) {
  const { state } = useSim();
  const stakes = stakeholdersFor(state.caseId);
  const [activeStakeholder, setActiveStakeholder] = useState<Stakeholder | null>(null);
  const [search, setSearch] = useState("");

  const channels: Channel[] = stakes.map((s) => ({
    id: s.id,
    name: s.name,
    unread: state.emails.filter((e) => e.from === s.id && !e.read).length,
    description: s.role,
  }));

  const filtered = channels.filter(
    (ch) =>
      search === "" ||
      ch.name.toLowerCase().includes(search.toLowerCase()) ||
      ch.description.toLowerCase().includes(search.toLowerCase()),
  );

  if (activeStakeholder) {
    return (
      <div className="flex h-[600px] overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02]">
        <StakeholderChatThread
          stakeholder={activeStakeholder}
          onBack={() => setActiveStakeholder(null)}
          onOpenDecision={onOpenDecision}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search stakeholders…"
            className="w-full rounded-xl border border-white/10 bg-white/[0.03] py-2 pl-9 pr-3 text-[13px] focus:border-accent/50 focus:outline-none"
          />
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-2">
        <div className="mb-2 flex items-center gap-1.5 px-2 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
          <Hash className="h-3 w-3" /> Direct Messages
        </div>
        {filtered.length === 0 ? (
          <p className="px-3 py-4 text-center text-[12px] text-muted-foreground">
            No stakeholders found.
          </p>
        ) : (
          <ul className="space-y-0.5">
            {filtered.map((ch) => {
              const s = stakes.find((x) => x.id === ch.id)!;
              return (
                <li key={ch.id}>
                  <button
                    onClick={() => setActiveStakeholder(s)}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-white/[0.05]"
                  >
                    <div className="relative">
                      <div
                        className={cn(
                          "grid h-9 w-9 place-items-center rounded-full text-[13px] font-bold text-white",
                          s.color,
                        )}
                      >
                        {s.avatarInitial}
                      </div>
                      <Circle className="absolute bottom-0 right-0 h-3 w-3 fill-[color:var(--color-success)] text-[color:var(--color-success)]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[13px] font-medium text-foreground">{ch.name}</span>
                        {ch.unread > 0 && (
                          <span className="rounded-full bg-[color:var(--color-destructive)] px-1.5 text-[10px] font-bold text-white">
                            {ch.unread}
                          </span>
                        )}
                      </div>
                      <div className="truncate text-[11px] text-muted-foreground">
                        {ch.description}
                      </div>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.01] p-4 text-center text-[12px] text-muted-foreground">
        <Smile className="mx-auto mb-2 h-5 w-5 text-muted-foreground/50" />
        Click a stakeholder above to start a conversation. Their responses are powered by AI and
        based on their role and personality.
      </div>
    </div>
  );
}
