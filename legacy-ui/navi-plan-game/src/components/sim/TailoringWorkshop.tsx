import { useState } from "react";
import { motion } from "framer-motion";
import { TAILORING_QUESTIONS, scoreTailoring } from "@/lib/sim/tailoring";
import type { DeliveryApproach, TailoringAnswers } from "@/lib/sim/types";
import { Button } from "@/components/ui/button";

type Props = {
  recommendedApproach: DeliveryApproach;
  industryName: string;
  projectName: string;
  onSubmit: (answers: TailoringAnswers, approach: DeliveryApproach) => void;
};

export function TailoringWorkshop({ recommendedApproach, industryName, projectName, onSubmit }: Props) {
  const [answers, setAnswers] = useState<TailoringAnswers>({});
  const [preview, setPreview] = useState(false);

  const allAnswered = TAILORING_QUESTIONS.every((q) => answers[q.id]);
  const score = allAnswered ? scoreTailoring(answers, recommendedApproach) : null;

  function submit() {
    if (!allAnswered || !score) return;
    onSubmit(answers, score.approach);
  }

  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
      <div className="mb-1 text-[11px] font-semibold uppercase tracking-widest text-accent">
        Phase 0 · Project Tailoring Workshop
      </div>
      <h2 className="text-2xl font-bold text-foreground">Define how you will manage {projectName}</h2>
      <p className="mt-2 text-[14px] text-muted-foreground">
        Before initiation, define your project-management strategy. There is no single "right" delivery approach —
        PMBOK 7/8 asks you to <em>tailor</em> based on this project's {industryName.toLowerCase()} context.
      </p>

      <div className="mt-6 space-y-5">
        {TAILORING_QUESTIONS.map((q, i) => (
          <motion.div
            key={q.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
            className="rounded-2xl border border-white/10 bg-white/[0.02] p-4"
          >
            <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Q{i + 1}
            </div>
            <div className="mt-1 text-[15px] font-semibold text-foreground">{q.question}</div>
            <div className="text-[12px] italic text-muted-foreground">{q.hint}</div>
            <div className="mt-3 flex flex-wrap gap-2">
              {q.options.map((o) => {
                const selected = answers[q.id] === o.id;
                return (
                  <button
                    key={o.id}
                    onClick={() => setAnswers({ ...answers, [q.id]: o.id })}
                    className={
                      "rounded-full border px-3 py-1.5 text-[12px] font-medium transition " +
                      (selected
                        ? "border-accent bg-accent/20 text-accent"
                        : "border-white/10 bg-white/[0.02] text-foreground/80 hover:border-white/25")
                    }
                  >
                    {o.label}
                  </button>
                );
              })}
            </div>
            {preview && answers[q.id] && (
              <div className="mt-2 text-[11px] text-muted-foreground">
                {q.options.find((o) => o.id === answers[q.id])?.explanation}
              </div>
            )}
          </motion.div>
        ))}
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <Button onClick={submit} disabled={!allAnswered} className="rounded-full">
          Submit tailoring & begin Initiation
        </Button>
        <button
          onClick={() => setPreview((v) => !v)}
          className="text-[13px] text-muted-foreground hover:text-foreground"
        >
          {preview ? "Hide" : "Show"} rationale
        </button>
        {score && (
          <div className="ml-auto rounded-full bg-white/[0.05] px-3 py-1 text-[12px] text-foreground/80">
            Preview score: <span className="font-semibold text-accent">{score.percent}%</span>
          </div>
        )}
      </div>
    </div>
  );
}
