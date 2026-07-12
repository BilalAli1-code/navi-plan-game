import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

type Props = {
  label: string;
  value: number;         // 0-100
  hint?: string;
  invert?: boolean;      // true = lower is better
  icon?: React.ReactNode;
};

export function MetricMeter({ label, value, hint, invert = false, icon }: Props) {
  const v = Math.max(0, Math.min(100, Math.round(value)));
  const good = invert ? v <= 30 : v >= 70;
  const bad = invert ? v >= 70 : v <= 40;
  const tone = good ? "success" : bad ? "destructive" : "warning";
  const barBg =
    tone === "success"
      ? "bg-[color:var(--color-success)]"
      : tone === "destructive"
        ? "bg-[color:var(--color-destructive)]"
        : "bg-[color:var(--color-warning)]";
  const textTone =
    tone === "success"
      ? "text-[color:var(--color-success)]"
      : tone === "destructive"
        ? "text-[color:var(--color-destructive)]"
        : "text-[color:var(--color-warning)]";
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div className="flex items-center justify-between text-[13px]">
        <div className="flex items-center gap-2 text-foreground/80">
          {icon}
          <span className="font-medium">{label}</span>
        </div>
        <motion.span
          key={v}
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn("text-[15px] font-semibold tabular-nums", textTone)}
        >
          {v}
        </motion.span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/[0.08]">
        <motion.div
          initial={false}
          animate={{ width: `${v}%` }}
          transition={{ type: "spring", stiffness: 120, damping: 18 }}
          className={cn("h-full rounded-full", barBg)}
        />
      </div>
      {hint && <div className="mt-1.5 text-[11px] text-muted-foreground">{hint}</div>}
    </div>
  );
}
