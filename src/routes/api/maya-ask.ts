import { createFileRoute } from "@tanstack/react-router";
import { streamText } from "ai";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";

type AskRequest = {
  question: string;
  scenarioTitle?: string;
  scenarioSummary?: string;
  phase?: string;
  chosenLabel?: string | null;
};

export const Route = createFileRoute("/api/maya-ask")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = (await request.json()) as AskRequest;
        if (!body?.question?.trim()) {
          return new Response("Missing question", { status: 400 });
        }
        const key = process.env.LOVABLE_API_KEY;
        if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

        const gateway = createLovableAiGatewayProvider(key);
        const model = gateway("google/gemini-3-flash-preview");

        const system = `You are Maya, a senior project manager and PMP-certified mentor inside the ProjectSim training platform.
Voice: warm, direct, professional. You coach learners through the PMI mindset (PMBOK 6 processes + PMBOK 7 principles + hybrid/agile awareness).

Hard rules:
- NEVER reveal or hint at which multiple-choice option is "the answer" for the current scenario. If asked directly, redirect to the underlying principle.
- Keep replies under ~140 words. Use short paragraphs or 2-4 bullet points.
- Ground guidance in PMI terminology (e.g. Integrated Change Control, Risk Response Planning, Stakeholder Engagement, Servant Leadership, Value Delivery).
- End with one concise exam tip when useful.
- No preamble like "Great question". Get straight to the coaching.`;

        const context = [
          body.phase ? `Current phase: ${body.phase}` : null,
          body.scenarioTitle ? `Scenario: ${body.scenarioTitle}` : null,
          body.scenarioSummary ? `Context: ${body.scenarioSummary}` : null,
          body.chosenLabel ? `Learner already chose: ${body.chosenLabel}` : "Learner has not decided yet.",
        ]
          .filter(Boolean)
          .join("\n");

        const prompt = `${context}\n\nLearner question: ${body.question.trim()}`;

        try {
          const result = streamText({ model, system, prompt });
          return result.toTextStreamResponse();
        } catch (err) {
          const message = err instanceof Error ? err.message : "Coach unavailable";
          return new Response(message, { status: 500 });
        }
      },
    },
  },
});
