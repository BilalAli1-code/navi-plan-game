import { createFileRoute } from "@tanstack/react-router";
import { streamText } from "ai";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";

type Body = {
  question: string;
  stakeholderName: string;
  stakeholderRole: string;
  stakeholderPersonality: string;
  stakeholderPriorities: string[];
  projectName: string;
  industry: string;
  phase: string;
};

export const Route = createFileRoute("/api/sim-stakeholder")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = (await request.json()) as Body;

        // Validate required fields
        if (!body?.question?.trim()) {
          return new Response("Missing question", { status: 400 });
        }
        if (!body?.stakeholderName || !body?.stakeholderRole || !body?.projectName) {
          return new Response("Missing stakeholder context", { status: 400 });
        }
        
        const key = process.env.LOVABLE_API_KEY;
        if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

        const gateway = createLovableAiGatewayProvider(key);
        const model = gateway("google/gemini-3-flash-preview");

        const system = `You are role-playing as ${body.stakeholderName}, ${body.stakeholderRole} on the "${body.projectName}" project in the ${body.industry} industry.

Personality: ${body.stakeholderPersonality}
Top priorities: ${body.stakeholderPriorities.join(", ")}
Current project phase: ${body.phase}

You are talking to the Project Manager. Stay strictly in character.

Rules:
- Answer as this person would answer — with their concerns, biases, and vocabulary.
- Keep replies under 100 words. Be conversational, not a lecture.
- NEVER reveal what the "correct" PMI answer to any dilemma is; you are a stakeholder, not a coach.
- If asked something outside your role, deflect naturally ("that's a question for the sponsor / vendor / risk officer").
- Do not break character to explain PMI theory.`;

        try {
          const result = streamText({ model, system, prompt: body.question.trim() });
          return result.toTextStreamResponse();
        } catch (err) {
          const message = err instanceof Error ? err.message : "Stakeholder unavailable";
          console.error("Stakeholder API error:", err);
          return new Response(message, { status: 500 });
        }
      },
    },
  },
});
