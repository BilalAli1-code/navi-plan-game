import { createFileRoute } from "@tanstack/react-router";
import { streamText } from "ai";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";

type ContextMemory = { kind: string; summary: string; sentiment?: string | null };
type ContextCommitment = { description: string; dueInWorld?: string | null; status?: string };
type ContextMessage = { role: "learner" | "stakeholder"; content: string };

type Body = {
  question: string;
  stakeholderName: string;
  stakeholderRole: string;
  stakeholderPersonality: string;
  stakeholderPriorities: string[];
  projectName: string;
  industry: string;
  phase: string;
  // Optional grounding for evolving behavior.
  chapter?: number;
  chapterTitle?: string;
  storyHook?: string;
  trust?: number;
  sentiment?: string;
  recentMemories?: ContextMemory[];
  openCommitments?: ContextCommitment[];
  recentMessages?: ContextMessage[];
};

export const Route = createFileRoute("/api/sim-stakeholder")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = (await request.json()) as Body;

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

        // Derived relationship state
        const trust = typeof body.trust === "number" ? body.trust : 60;
        const sentiment = body.sentiment ?? "neutral";
        const mood =
          trust >= 75
            ? "warm, forthcoming, willing to give benefit of the doubt"
            : trust >= 50
              ? "professional but guarded"
              : trust >= 30
                ? "skeptical, testing the PM, quicker to push back"
                : "frustrated, terse, close to escalating";

        const memoriesBlock = (body.recentMemories ?? [])
          .slice(0, 6)
          .map((m) => `- (${m.kind}${m.sentiment ? `, ${m.sentiment}` : ""}) ${m.summary}`)
          .join("\n");

        const commitmentsBlock = (body.openCommitments ?? [])
          .slice(0, 6)
          .map((c) => `- ${c.description}${c.dueInWorld ? ` (due ${c.dueInWorld})` : ""}`)
          .join("\n");

        const historyBlock = (body.recentMessages ?? [])
          .slice(-8)
          .map((m) => `${m.role === "learner" ? "PM" : body.stakeholderName}: ${m.content}`)
          .join("\n");

        const system = `You are role-playing as ${body.stakeholderName}, ${body.stakeholderRole} on the "${body.projectName}" project in the ${body.industry} industry.

Personality: ${body.stakeholderPersonality}
Top priorities: ${body.stakeholderPriorities.join(", ")}
Current project phase: ${body.phase}${body.chapter ? ` · Chapter ${body.chapter}${body.chapterTitle ? " — " + body.chapterTitle : ""}` : ""}
${body.storyHook ? `Current storyline: ${body.storyHook}` : ""}

Relationship with the PM:
- Trust: ${trust}/100 (${sentiment})
- Your current mood toward them: ${mood}
${memoriesBlock ? `\nWhat you remember about recent interactions:\n${memoriesBlock}` : ""}
${commitmentsBlock ? `\nOpen promises the PM owes you (or you owe them):\n${commitmentsBlock}` : ""}
${historyBlock ? `\nRecent conversation so far:\n${historyBlock}` : ""}

You are talking to the Project Manager. Stay strictly in character.

Rules:
- Answer as this person would answer — with their concerns, biases, and vocabulary.
- Let trust and past memories color your tone. If trust is low, be more skeptical, reference past letdowns.
- Reference open commitments naturally when relevant ("what's the status on…?").
- Keep replies under 100 words. Be conversational, not a lecture.
- NEVER reveal the "correct" PMI answer to any dilemma; you are a stakeholder, not a coach.
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
