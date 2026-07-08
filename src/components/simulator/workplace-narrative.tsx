import { motion } from "framer-motion";
import {
  Mail,
  Calendar,
  FileText,
  ShieldAlert,
  FileEdit,
  Users,
  Building2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  ChangeRequestArtifact,
  DocumentArtifact,
  EmailArtifact,
  MeetingArtifact,
  NarrativeArtifact,
  RiskRegisterArtifact,
  ScenarioNarrative,
  StakeholderCardArtifact,
  VendorCardArtifact,
} from "@/lib/simulator/narrative";

export function WorkplaceNarrative({ narrative }: { narrative: ScenarioNarrative }) {
  return (
    <div className="space-y-4">
      <Hero hero={narrative.hero} />
      <p className="text-sm leading-relaxed text-foreground/85">{narrative.intro}</p>
      <div className="space-y-3">
        {narrative.artifacts.map((a, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.05 * i }}
          >
            <ArtifactCard artifact={a} />
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function Hero({ hero }: { hero: ScenarioNarrative["hero"] }) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br p-6",
        hero.tone,
      )}
    >
      <div className="absolute -right-6 -top-6 text-8xl opacity-20 select-none">
        {hero.emoji}
      </div>
      <div className="relative">
        <div className="text-[11px] uppercase tracking-widest text-foreground/70">
          Workplace Simulation
        </div>
        <h2 className="mt-1 text-xl font-bold tracking-tight text-foreground">
          {hero.heroTitle}
        </h2>
        <p className="mt-1 text-sm text-foreground/75">{hero.subline}</p>
      </div>
    </div>
  );
}

function ArtifactCard({ artifact }: { artifact: NarrativeArtifact }) {
  switch (artifact.kind) {
    case "email":
      return <EmailCard email={artifact} />;
    case "meeting":
      return <MeetingCard meeting={artifact} />;
    case "document":
      return <DocumentCard doc={artifact} />;
    case "risk-register":
      return <RiskRegisterCard reg={artifact} />;
    case "change-request":
      return <ChangeRequestCard cr={artifact} />;
    case "stakeholder-card":
      return <StakeholderCards sc={artifact} />;
    case "vendor-card":
      return <VendorCards vc={artifact} />;
  }
}

function ArtifactShell({
  icon,
  label,
  tone = "slate",
  children,
}: {
  icon: React.ReactNode;
  label: string;
  tone?: "slate" | "primary" | "amber" | "rose" | "emerald";
  children: React.ReactNode;
}) {
  const toneMap: Record<string, string> = {
    slate: "border-border/60 bg-surface/70",
    primary: "border-primary/30 bg-primary/[0.06]",
    amber: "border-amber-400/30 bg-amber-400/[0.06]",
    rose: "border-rose-400/30 bg-rose-400/[0.06]",
    emerald: "border-emerald-400/30 bg-emerald-400/[0.06]",
  };
  return (
    <div className={cn("rounded-xl border p-4", toneMap[tone])}>
      <div className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-foreground/70">
        {icon}
        <span>{label}</span>
      </div>
      {children}
    </div>
  );
}

function EmailCard({ email }: { email: EmailArtifact }) {
  return (
    <ArtifactShell
      icon={<Mail className="h-3.5 w-3.5" />}
      label={email.priority === "urgent" ? "Email · Urgent" : "Email"}
      tone={email.priority === "urgent" ? "amber" : "slate"}
    >
      <div className="text-xs text-muted-foreground">
        <span className="font-medium text-foreground">{email.from.name}</span>{" "}
        <span>&lt;{email.from.email}&gt;</span>
        <span className="mx-1">·</span>
        <span>{email.from.role}</span>
        <span className="mx-1">·</span>
        <span>{email.time}</span>
      </div>
      <div className="mt-1 text-sm font-semibold text-foreground">{email.subject}</div>
      <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-foreground/90">
        {email.body}
      </p>
    </ArtifactShell>
  );
}

function MeetingCard({ meeting }: { meeting: MeetingArtifact }) {
  return (
    <ArtifactShell icon={<Calendar className="h-3.5 w-3.5" />} label="Meeting invite" tone="primary">
      <div className="text-sm font-semibold text-foreground">{meeting.title}</div>
      <div className="mt-1 text-xs text-muted-foreground">
        {meeting.when} · {meeting.where} · Organizer: {meeting.organizer}
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {meeting.attendees.map((a) => (
          <span key={a} className="rounded-full bg-surface-strong px-2 py-0.5 text-[10px] text-foreground/80">
            {a}
          </span>
        ))}
      </div>
      <ul className="mt-3 list-inside list-disc space-y-0.5 text-xs text-foreground/85">
        {meeting.agenda.map((a) => (
          <li key={a}>{a}</li>
        ))}
      </ul>
    </ArtifactShell>
  );
}

function DocumentCard({ doc }: { doc: DocumentArtifact }) {
  return (
    <ArtifactShell icon={<FileText className="h-3.5 w-3.5" />} label={doc.docType}>
      <div className="text-sm font-semibold text-foreground">{doc.title}</div>
      <div className="text-xs text-muted-foreground">
        {doc.author} · {doc.date}
      </div>
      <div className="mt-3 space-y-2.5">
        {doc.sections.map((s) => (
          <div key={s.heading}>
            <div className="text-[11px] font-semibold uppercase tracking-widest text-primary/80">
              {s.heading}
            </div>
            <p className="text-sm leading-relaxed text-foreground/85">{s.body}</p>
          </div>
        ))}
      </div>
    </ArtifactShell>
  );
}

function RiskRegisterCard({ reg }: { reg: RiskRegisterArtifact }) {
  return (
    <ArtifactShell icon={<ShieldAlert className="h-3.5 w-3.5" />} label="Risk register" tone="rose">
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-left text-[10px] uppercase tracking-widest text-muted-foreground">
              <th className="pb-2 pr-2">ID</th>
              <th className="pb-2 pr-2">Risk</th>
              <th className="pb-2 pr-2">P</th>
              <th className="pb-2 pr-2">I</th>
              <th className="pb-2 pr-2">Response</th>
              <th className="pb-2">Owner</th>
            </tr>
          </thead>
          <tbody className="text-foreground/90">
            {reg.rows.map((r) => (
              <tr key={r.id} className="border-t border-border/40">
                <td className="py-1.5 pr-2 font-mono text-[10px] text-muted-foreground">{r.id}</td>
                <td className="py-1.5 pr-2">{r.risk}</td>
                <td className="py-1.5 pr-2">{r.prob}</td>
                <td className="py-1.5 pr-2">{r.impact}</td>
                <td className="py-1.5 pr-2">{r.response}</td>
                <td className="py-1.5">{r.owner}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </ArtifactShell>
  );
}

function ChangeRequestCard({ cr }: { cr: ChangeRequestArtifact }) {
  return (
    <ArtifactShell icon={<FileEdit className="h-3.5 w-3.5" />} label={`Change Request ${cr.crId}`} tone="amber">
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <span className="rounded-full bg-surface-strong px-2 py-0.5 text-foreground/80">{cr.status}</span>
        <span>Requester: {cr.requester}</span>
        <span>·</span>
        <span>Submitted {cr.submitted}</span>
      </div>
      <div className="mt-2 text-sm font-semibold text-foreground">{cr.summary}</div>
      <p className="mt-1 text-sm text-foreground/85">{cr.reason}</p>
      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
        {(["scope", "schedule", "cost", "risk"] as const).map((k) => (
          <div key={k} className="rounded-md border border-border/40 bg-surface/60 p-2">
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{k}</div>
            <div className="text-foreground/85">{cr.impact[k]}</div>
          </div>
        ))}
      </div>
    </ArtifactShell>
  );
}

function StakeholderCards({ sc }: { sc: StakeholderCardArtifact }) {
  const stanceTone: Record<string, string> = {
    Champion: "bg-emerald-400/15 text-emerald-200",
    Supporter: "bg-primary/15 text-primary",
    Neutral: "bg-surface-strong text-foreground/80",
    Critic: "bg-rose-400/15 text-rose-200",
  };
  return (
    <ArtifactShell icon={<Users className="h-3.5 w-3.5" />} label="Stakeholders" tone="primary">
      <div className="grid gap-2 sm:grid-cols-2">
        {sc.people.map((p) => (
          <div key={p.name} className="flex items-start gap-3 rounded-lg border border-border/40 bg-surface/60 p-2.5">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary/20 text-xs font-bold text-primary">
              {p.avatar}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <div className="truncate text-sm font-medium text-foreground">{p.name}</div>
                <span className={cn("rounded-full px-1.5 py-0.5 text-[9px] font-semibold", stanceTone[p.stance])}>
                  {p.stance}
                </span>
              </div>
              <div className="truncate text-xs text-muted-foreground">{p.role}</div>
              <div className="mt-1 text-[10px] text-muted-foreground">
                Influence: {p.influence} · Interest: {p.interest}
              </div>
            </div>
          </div>
        ))}
      </div>
    </ArtifactShell>
  );
}

function VendorCards({ vc }: { vc: VendorCardArtifact }) {
  const perfTone: Record<string, string> = {
    Excellent: "bg-emerald-400/15 text-emerald-200",
    "On Track": "bg-primary/15 text-primary",
    "At Risk": "bg-amber-400/15 text-amber-200",
    Underperforming: "bg-rose-400/15 text-rose-200",
  };
  return (
    <ArtifactShell icon={<Building2 className="h-3.5 w-3.5" />} label="Vendors" tone="amber">
      <div className="space-y-2">
        {vc.vendors.map((v) => (
          <div key={v.name} className="rounded-lg border border-border/40 bg-surface/60 p-3">
            <div className="flex items-center justify-between gap-2">
              <div className="text-sm font-semibold text-foreground">{v.name}</div>
              <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold", perfTone[v.performance])}>
                {v.performance}
              </span>
            </div>
            <div className="mt-1 text-xs text-muted-foreground">{v.scope}</div>
            <div className="mt-1 text-xs text-foreground/80">{v.contract}</div>
            <div className="mt-1 text-xs text-foreground/70">{v.slaNotes}</div>
          </div>
        ))}
      </div>
    </ArtifactShell>
  );
}
