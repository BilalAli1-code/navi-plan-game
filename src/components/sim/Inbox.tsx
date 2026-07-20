import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import { Mail, Reply, Star, Archive, AlertCircle, Search, CheckCircle2 } from "lucide-react";
import { useSim } from "@/lib/sim/store";
import { stakeholdersFor } from "@/lib/sim/cases";
import { visibleEmails } from "@/lib/sim/visibility";
import { cn } from "@/lib/utils";

export function Inbox({ onOpenDecision }: { onOpenDecision: (id: string) => void }) {
  const { state, markEmailRead } = useSim();
  const stakes = stakeholdersFor(state.caseId);
  // Only surface emails whose gated chapter has opened. Future-chapter
  // messages stay hidden until the learner reaches that day.
  const emails = useMemo(() => visibleEmails(state), [state]);
  // Derive completion from the single source of truth (decision log).
  const answered = useMemo(
    () => new Set(state.log.map((l) => l.decisionId)),
    [state.log],
  );
  const isCompleted = (e: (typeof emails)[number]) =>
    e.unlocksDecisionId ? answered.has(e.unlocksDecisionId) : e.read;
  const [openId, setOpenId] = useState<string | null>(emails[0]?.id ?? null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "unread" | "important" | "completed">("all");

  const active = emails.find((e) => e.id === openId) ?? null;

  // Pre-compute stake lookup map to avoid O(n*m) in filter/render
  const stakeMap = useMemo(() => new Map(stakes.map((s) => [s.id, s])), [stakes]);

  function findStake(id: string) {
    return stakeMap.get(id) ?? stakes[0];
  }

  function open(id: string) {
    setOpenId(id);
    markEmailRead(id);
  }

  const isImportant = (subject: string) =>
    subject.toLowerCase().includes("urgent") ||
    subject.toLowerCase().includes("critical") ||
    subject.toLowerCase().includes("escalat") ||
    subject.toLowerCase().includes("blocked");

  const filteredEmails = useMemo(
    () =>
      emails.filter((e) => {
        if (
          search &&
          !e.subject.toLowerCase().includes(search.toLowerCase()) &&
          !(findStake(e.from)?.name ?? "").toLowerCase().includes(search.toLowerCase())
        )
          return false;
        const done = isCompleted(e);
        if (filter === "unread" && (e.read || done)) return false;
        if (filter === "important" && !isImportant(e.subject)) return false;
        if (filter === "completed" && !done) return false;
        // By default hide completed items so they don't compete for attention;
        // they remain reviewable under the Completed filter.
        if (filter === "all" && done) return false;
        return true;
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [emails, search, filter, stakes, answered],
  );

  const unreadCount = emails.filter((e) => !e.read && !isCompleted(e)).length;


  return (
    <div
      className="grid grid-cols-1 gap-4 md:grid-cols-[minmax(280px,340px)_1fr]"
      style={{ minHeight: "520px" }}
    >
      {/* ─── Email list panel ───────────────────────────────────────── */}
      <div className="flex flex-col rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden">
        {/* Toolbar */}
        <div className="border-b border-white/10 px-3 py-2.5">
          <div className="flex items-center gap-2 mb-2">
            <div className="flex items-center gap-1.5 text-[13px] font-semibold text-foreground">
              <Mail className="h-4 w-4 text-accent" />
              Inbox
            </div>
            {unreadCount > 0 && (
              <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-semibold text-accent">
                {unreadCount} new
              </span>
            )}
          </div>
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search messages…"
              className="w-full rounded-lg border border-white/10 bg-white/[0.02] py-1.5 pl-7 pr-3 text-[12px] focus:border-accent/40 focus:outline-none"
            />
          </div>
          {/* Filter tabs */}
          <div className="mt-2 flex gap-0.5">
            {(["all", "unread", "important", "completed"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "rounded-lg px-2.5 py-1 text-[11px] capitalize transition",
                  filter === f
                    ? "bg-accent/15 text-accent font-semibold"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {f}
              </button>
            ))}
          </div>

        </div>

        {/* Email list */}
        <ul className="flex-1 overflow-y-auto">
          {filteredEmails.length === 0 && (
            <li className="py-8 text-center text-[12px] text-muted-foreground">
              No messages match your filter.
            </li>
          )}
          {filteredEmails.map((e) => {
            const s = findStake(e.from);
            const selected = openId === e.id;
            const urgent = isImportant(e.subject);
            return (
              <li key={e.id}>
                <button
                  onClick={() => open(e.id)}
                  className={cn(
                    "flex w-full gap-3 border-b border-white/[0.04] px-3 py-3 text-left transition",
                    selected
                      ? "bg-accent/[0.08] border-l-2 border-l-accent"
                      : "hover:bg-white/[0.03]",
                  )}
                >
                  <div className="relative shrink-0">
                    <div
                      className={cn(
                        "grid h-9 w-9 place-items-center rounded-full text-[13px] font-bold text-white",
                        s.color,
                      )}
                    >
                      {s.avatarInitial}
                    </div>
                    {!e.read && (
                      <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-background bg-accent" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1.5">
                      <span
                        className={cn(
                          "truncate text-[12px]",
                          !e.read ? "font-semibold text-foreground" : "text-foreground/70",
                        )}
                      >
                        {s.name}
                      </span>
                      <span className="shrink-0 text-[10px] text-muted-foreground">
                        {new Date(e.receivedAt).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                    <div
                      className={cn(
                        "mt-0.5 truncate text-[12px]",
                        !e.read ? "font-medium text-foreground/90" : "text-muted-foreground",
                      )}
                    >
                      {e.subject}
                    </div>
                    <div className="mt-0.5 flex items-center gap-1.5">
                      <span className="flex-1 truncate text-[10px] text-muted-foreground/70">
                        {e.preview}
                      </span>
                      {urgent && (
                        <AlertCircle className="h-3 w-3 shrink-0 text-[color:var(--color-destructive)]" />
                      )}
                      {e.unlocksDecisionId && (
                        <span className="shrink-0 rounded-full bg-accent/15 px-1.5 py-0.5 text-[9px] font-semibold text-accent">
                          Action
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {/* ─── Email reading pane ─────────────────────────────────────── */}
      <motion.div
        key={active?.id}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.18 }}
        className="flex flex-col rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden"
      >
        {active ? (
          <>
            {/* Email header */}
            <div className="border-b border-white/10 px-5 py-4">
              <h3 className="text-[17px] font-bold text-foreground leading-snug">
                {active.subject}
              </h3>
              <div className="mt-2 flex items-center gap-3">
                <div
                  className={cn(
                    "grid h-10 w-10 shrink-0 place-items-center rounded-full text-[14px] font-bold text-white",
                    findStake(active.from).color,
                  )}
                >
                  {findStake(active.from).avatarInitial}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[14px] font-semibold text-foreground">
                    {findStake(active.from).name}
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    {findStake(active.from).role} · To: You
                  </div>
                </div>
                <div className="text-[11px] text-muted-foreground">
                  {new Date(active.receivedAt).toLocaleString(undefined, {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>

              {/* Quick action bar */}
              <div className="mt-3 flex gap-1.5">
                <button className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[11px] text-foreground/70 transition hover:border-accent/30 hover:text-accent">
                  <Reply className="h-3 w-3" /> Reply
                </button>
                <button className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[11px] text-foreground/70 transition hover:border-white/20 hover:text-foreground">
                  <Star className="h-3 w-3" /> Flag
                </button>
                <button className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[11px] text-foreground/70 transition hover:border-white/20 hover:text-foreground">
                  <Archive className="h-3 w-3" /> Archive
                </button>
                {isImportant(active.subject) && (
                  <span className="ml-auto flex items-center gap-1 rounded-full bg-[color:var(--color-destructive)]/15 px-2.5 py-1 text-[10px] font-semibold text-[color:var(--color-destructive)]">
                    <AlertCircle className="h-3 w-3" /> Urgent
                  </span>
                )}
              </div>
            </div>

            {/* Email body */}
            <div className="flex-1 overflow-y-auto px-5 py-4">
              <div className="text-[14px] leading-relaxed text-foreground/85 whitespace-pre-wrap">
                {active.body.replace(/\*\*/g, "")}
              </div>
            </div>

            {/* Action CTA */}
            {active.unlocksDecisionId && (
              <div className="border-t border-white/10 px-5 py-4">
                <div className="mb-2 text-[11px] text-muted-foreground">
                  This message requires a decision from you:
                </div>
                <button
                  onClick={() => onOpenDecision(active.unlocksDecisionId!)}
                  className="w-full rounded-xl bg-accent px-5 py-3 text-[13px] font-semibold text-accent-foreground transition hover:opacity-90"
                >
                  Respond with a decision →
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="grid flex-1 place-items-center text-center text-muted-foreground">
            <div>
              <Mail className="mx-auto mb-3 h-8 w-8 opacity-30" />
              <div className="text-[13px]">Select a message to read</div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
