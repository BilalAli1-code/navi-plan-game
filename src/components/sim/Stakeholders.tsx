import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Archive, ArchiveRestore, MessageSquare, Send, X } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { useSim } from "@/lib/sim/store";
import { stakeholdersFor, getCaseRef } from "@/lib/sim/cases";
import {
  appendChatMessage,
  listAllConversations,
  listChatHistory,
  listMemories,
  listCommitments,
  setConversationArchived,
  type ConversationSummary,
  type ChatMessageRow,
} from "@/lib/sim/stakeholders.functions";
import { stakeholderEngagementForChapter } from "@/lib/sim/stakeholder-interactions";
import { getChapter } from "@/lib/sim/days";
import type { Stakeholder } from "@/lib/sim/types";
import { cn } from "@/lib/utils";

type SummaryMap = Record<string, ConversationSummary>;

export function Stakeholders() {
  const { state, runId } = useSim();
  const stakes = stakeholdersFor(state.caseId);
  const [chatWith, setChatWith] = useState<Stakeholder | null>(null);
  const [summaries, setSummaries] = useState<SummaryMap>({});
  const [showArchived, setShowArchived] = useState(false);
  const [refreshTick, setRefreshTick] = useState(0);
  const chapter = Math.max(1, Math.min(7, state.currentDay ?? 1));

  const load = useServerFn(listAllConversations);

  useEffect(() => {
    if (!runId) return;
    let cancelled = false;
    load({ data: { runId } })
      .then((rows) => {
        if (cancelled) return;
        const map: SummaryMap = {};
        for (const r of rows) map[r.stakeholderId] = r;
        setSummaries(map);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [runId, refreshTick, load]);

  const visible = useMemo(
    () =>
      stakes.filter((s) => {
        const archived = summaries[s.id]?.archived;
        return showArchived ? archived : !archived;
      }),
    [stakes, summaries, showArchived],
  );

  const archivedCount = stakes.filter((s) => summaries[s.id]?.archived).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[16px] font-semibold text-foreground">Stakeholders</h2>
          <p className="text-[12px] text-muted-foreground">
            Conversations persist across the whole week. Trust and memory evolve with every interaction.
          </p>
        </div>
        {archivedCount > 0 && (
          <button
            onClick={() => setShowArchived((v) => !v)}
            className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[11px] text-foreground/80 hover:bg-white/[0.06]"
          >
            {showArchived ? "Show active" : `Show archived (${archivedCount})`}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((s) => (
          <StakeholderCard
            key={s.id}
            stakeholder={s}
            summary={summaries[s.id]}
            chapter={chapter}
            onOpen={() => setChatWith(s)}
            onArchiveChanged={() => setRefreshTick((t) => t + 1)}
          />
        ))}
        {visible.length === 0 && (
          <div className="col-span-full rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-center text-[13px] text-muted-foreground">
            {showArchived ? "No archived conversations." : "No active stakeholders."}
          </div>
        )}
      </div>

      {chatWith && (
        <StakeholderChat
          stakeholder={chatWith}
          summary={summaries[chatWith.id]}
          chapter={chapter}
          onClose={() => {
            setChatWith(null);
            setRefreshTick((t) => t + 1);
          }}
        />
      )}
    </div>
  );
}

function StakeholderCard({
  stakeholder: s,
  summary,
  chapter,
  onOpen,
  onArchiveChanged,
}: {
  stakeholder: Stakeholder;
  summary?: ConversationSummary;
  chapter: number;
  onOpen: () => void;
  onArchiveChanged: () => void;
}) {
  const { runId } = useSim();
  const archive = useServerFn(setConversationArchived);
  const engagement = stakeholderEngagementForChapter(s.id, chapter);
  const trust = summary?.trust ?? 60;
  const sentiment = summary?.sentiment ?? "neutral";
  const trustTone =
    trust >= 75 ? "text-emerald-300" : trust >= 50 ? "text-foreground/80" : trust >= 30 ? "text-amber-300" : "text-rose-300";
  const engagementLabel =
    engagement === "primary" ? "Active this chapter" : engagement === "supporting" ? "Available" : "Quiet this chapter";
  const engagementDot =
    engagement === "primary" ? "bg-emerald-400" : engagement === "supporting" ? "bg-white/40" : "bg-white/20";

  async function toggleArchive(next: boolean) {
    if (!runId) return;
    await archive({ data: { runId, stakeholderId: s.id, archived: next } }).catch(() => {});
    onArchiveChanged();
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div className="flex items-start gap-3">
        <div className={cn("grid h-11 w-11 shrink-0 place-items-center rounded-full text-[14px] font-bold text-white", s.color)}>
          {s.avatarInitial}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <div className="truncate text-[14px] font-semibold text-foreground">{s.name}</div>
            <span className="inline-flex items-center gap-1 rounded-full bg-white/[0.06] px-2 py-0.5 text-[10px] text-foreground/70">
              <span className={cn("h-1.5 w-1.5 rounded-full", engagementDot)} />
              {engagementLabel}
            </span>
          </div>
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

      <div className="mt-3 flex items-center justify-between text-[11px]">
        <span className={cn("font-semibold", trustTone)}>Trust {trust}</span>
        <span className="capitalize text-muted-foreground">{sentiment}</span>
        <span className="text-muted-foreground">{summary?.interactionCount ?? 0} exchanges</span>
      </div>

      {summary?.lastMessagePreview && (
        <div className="mt-2 rounded-xl bg-white/[0.03] px-3 py-2 text-[11px] text-foreground/70 line-clamp-2">
          <span className="text-muted-foreground">
            {summary.lastMessageRole === "learner" ? "You" : s.name.split(" ")[0]}:
          </span>{" "}
          {summary.lastMessagePreview}
        </div>
      )}

      <div className="mt-3 flex gap-2">
        <button
          onClick={onOpen}
          className="flex-1 rounded-full bg-accent/15 py-2 text-[12px] font-semibold text-accent transition hover:bg-accent/25"
        >
          <MessageSquare className="mr-1.5 inline h-3.5 w-3.5" />
          {summary?.interactionCount ? "Continue" : "Start"} conversation
        </button>
        {(summary?.interactionCount ?? 0) > 0 && (
          <button
            onClick={() => toggleArchive(!summary?.archived)}
            title={summary?.archived ? "Unarchive" : "Archive thread"}
            className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-2 text-foreground/70 transition hover:bg-white/[0.06]"
          >
            {summary?.archived ? <ArchiveRestore className="h-3.5 w-3.5" /> : <Archive className="h-3.5 w-3.5" />}
          </button>
        )}
      </div>
    </div>
  );
}

function StakeholderChat({
  stakeholder,
  summary,
  chapter,
  onClose,
}: {
  stakeholder: Stakeholder;
  summary?: ConversationSummary;
  chapter: number;
  onClose: () => void;
}) {
  const { state, runId, dispatchLearnerAction } = useSim();
  const c = getCaseRef(state.caseId);
  const chapterDef = getChapter(chapter);
  const [messages, setMessages] = useState<{ role: "you" | "them"; text: string }[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const persist = useServerFn(appendChatMessage);
  const loadHistory = useServerFn(listChatHistory);
  const loadMemories = useServerFn(listMemories);
  const loadCommitments = useServerFn(listCommitments);

  // Load persisted history on mount and when stakeholder changes.
  useEffect(() => {
    setMessages([]);
    setHistoryLoaded(false);

    if (!runId) {
      setHistoryLoaded(true);
      return;
    }

    let cancelled = false;
    loadHistory({ data: { runId, stakeholderId: stakeholder.id } })
      .then((rows: ChatMessageRow[]) => {
        if (cancelled) return;
        setMessages(rows.map((r) => ({ role: r.role === "learner" ? "you" : "them", text: r.content })));
        setHistoryLoaded(true);
      })
      .catch(() => {
        if (!cancelled) setHistoryLoaded(true);
      });

    return () => {
      cancelled = true;
    };
  }, [runId, stakeholder.id, loadHistory]);

  async function send() {
    const trimmed = q.trim();
    if (!trimmed || loading || !historyLoaded) return;

    const baseMessages = messages;

    setQ("");
    setMessages((m) => [...m, { role: "you", text: trimmed }, { role: "them", text: "" }]);
    setLoading(true);

    // Persist the learner message immediately (fire-and-forget).
    if (runId) {
      void persist({
        data: { runId, stakeholderId: stakeholder.id, role: "learner", content: trimmed, chapter },
      }).catch(() => {});
    }

    // Gather grounding context in parallel.
    const [recentMemories, openCommitments] = runId
      ? await Promise.all([
          loadMemories({ data: { runId, stakeholderId: stakeholder.id, limit: 6 } }).catch(() => []),
          loadCommitments({ data: { runId, stakeholderId: stakeholder.id } }).catch(() => []),
        ])
      : [[], []];

    // Include persisted/base thread + the just-typed user message for model context.
    const recentMessagesForModel = [...baseMessages, { role: "you" as const, text: trimmed }]
      .filter((m) => m.text.trim().length > 0)
      .slice(-8)
      .map<{ role: "learner" | "stakeholder"; content: string }>((m) => ({
        role: m.role === "you" ? "learner" : "stakeholder",
        content: m.text,
      }));

    let assistantText = "";
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
          chapter,
          chapterTitle: chapterDef?.title,
          storyHook: chapterDef?.storyHook,
          trust: summary?.trust ?? 60,
          sentiment: summary?.sentiment ?? "neutral",
          recentMemories: (recentMemories as Array<{ kind: string; summary: string; sentiment?: string | null }>).map((m) => ({
            kind: m.kind,
            summary: m.summary,
            sentiment: m.sentiment ?? null,
          })),
          openCommitments: (openCommitments as Array<{ description: string; due_in_world?: string | null; status?: string }>)
            .filter((c) => (c.status ?? "open") === "open")
            .map((c) => ({ description: c.description, dueInWorld: c.due_in_world ?? null })),
          recentMessages: recentMessagesForModel,
        }),
      });
      if (!res.ok || !res.body) throw new Error(await res.text().catch(() => "unavailable"));
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        assistantText += chunk;
        setMessages((m) => {
          const copy = [...m];
          copy[copy.length - 1] = { role: "them", text: copy[copy.length - 1].text + chunk };
          return copy;
        });
      }
    } catch (err) {
      assistantText = `(${stakeholder.name.split(" ")[0]} couldn't respond right now)`;
      setMessages((m) => {
        const copy = [...m];
        copy[copy.length - 1] = { role: "them", text: assistantText };
        return copy;
      });
    } finally {
      setLoading(false);

      // Persist stakeholder reply.
      if (runId && assistantText.trim()) {
        void persist({
          data: { runId, stakeholderId: stakeholder.id, role: "stakeholder", content: assistantText, chapter },
        }).catch(() => {});
      }

      // First-class engine action: updates relationships, memories, scoring.
      if (runId) {
        void dispatchLearnerAction({
          type: "engine.action",
          action: {
            actionType: "stakeholder_interaction",
            runId,
            sectionNumber: chapter,
            stakeholderId: stakeholder.id,
            interactionType: "chat",
            learnerMessage: trimmed,
          },
        }).catch(() => {});
      }

      // Flip the canonical `workplace` activity flag for this chapter.
      void dispatchLearnerAction({
        type: "chat.send",
        stakeholderId: stakeholder.id,
      }).catch(() => {});
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
          <div className="min-w-0 flex-1">
            <div className="truncate text-[14px] font-semibold text-foreground">{stakeholder.name}</div>
            <div className="truncate text-[11px] text-muted-foreground">
              {stakeholder.role} · Trust {summary?.trust ?? 60} · {summary?.sentiment ?? "neutral"}
            </div>
          </div>
          <button onClick={onClose} className="rounded-full p-1 text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          {!historyLoaded && (
            <div className="rounded-2xl bg-white/[0.03] p-4 text-[13px] text-muted-foreground">Loading history…</div>
          )}
          {historyLoaded && messages.length === 0 && (
            <div className="rounded-2xl bg-white/[0.03] p-4 text-[13px] text-muted-foreground">
              Start a conversation with {stakeholder.name.split(" ")[0]}. They will respond in-character — and remember what you
              say for the rest of the week.
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} className={m.role === "you" ? "flex justify-end" : "flex justify-start"}>
              <div
                className={cn(
                  "max-w-[80%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-[13px] leading-relaxed",
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
            disabled={loading || !q.trim() || !historyLoaded}
            className="grid h-10 w-10 place-items-center rounded-full bg-accent text-accent-foreground disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </motion.div>
    </motion.div>
  );
}
