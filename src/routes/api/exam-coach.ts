import { createFileRoute } from "@tanstack/react-router";
import { generateText } from "ai";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";
import { authenticateRequest, requireFeature } from "@/lib/billing/entitlement.server";

type ReportContext = {
  overallPercent: number;
  passProbability: number;
  readiness: string;
  weakestTopics: string[];
  strongestTopics: string[];
  domainScores: Array<{ domain: string; percent: number }>;
  avgTimePerQuestionMs: number;
};

type CoachRequest = {
  question: string;
  report: ReportContext;
};

export const Route = createFileRoute("/api/exam-coach")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const auth = await authenticateRequest(request);
        if (!auth) return new Response("Unauthorized", { status: 401 });
        try { await requireFeature(auth.supabase, auth.userId, "ai_coach"); }
        catch (r) { if (r instanceof Response) return r; throw r; }
        const body = (await request.json()) as CoachRequest;
        
        // Validate required fields
        if (!body?.question?.trim()) {
          return new Response("Missing question", { status: 400 });
        }
        if (!body?.report) {
          return new Response("Missing report context", { status: 400 });
        }
        
        const key = process.env.LOVABLE_API_KEY;
        if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

        const gateway = createLovableAiGatewayProvider(key);
        const model = gateway("google/gemini-3-flash-preview");

        const system = `You are a Senior PMP-certified exam coach.
You review a learner's practice exam report and answer their study questions.
Ground guidance in PMBOK 6 processes, PMBOK 7 principles, Agile Practice Guide, and PMI mindset.
Respond in concise markdown (max ~180 words) with these sections when relevant:
- **Readiness snapshot** — 1 sentence.
- **Focus areas** — 2-3 bullets tied to the weakest topics.
- **Study plan** — 3 bullets: what to review, one drill, one mindset cue.
- **Answer** — direct response to the learner's question.
Be specific to their weakest topics. No fluff.`;

        const prompt = `Learner exam report:
- Overall: ${body.report.overallPercent}% (${body.report.readiness}, est. pass probability ${body.report.passProbability}%)
- Domain scores: ${body.report.domainScores.map((d) => `${d.domain} ${d.percent}%`).join(", ")}
- Weakest topics: ${(body.report.weakestTopics ?? []).join(", ") || "n/a"}
- Strongest topics: ${(body.report.strongestTopics ?? []).join(", ") || "n/a"}
- Avg time per question: ${(body.report.avgTimePerQuestionMs / 1000).toFixed(1)}s

Learner question: ${body.question}`;

        try {
          const { text } = await generateText({ model, system, prompt });
          return Response.json({ text });
        } catch (err) {
          const message = err instanceof Error ? err.message : "Coach unavailable";
          console.error("Exam coach error:", err);
          return new Response(message, { status: 500 });
        }
      },
    },
  },
});
