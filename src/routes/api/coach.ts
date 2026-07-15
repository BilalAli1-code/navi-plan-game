import { createFileRoute } from "@tanstack/react-router";
import { generateText } from "ai";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";
import { authenticateRequest, requireFeature } from "@/lib/billing/entitlement.server";

type CoachRequest = {
  phase: string;
  scenario: string;
  choiceLabel: string;
  choiceRationale?: string;
  metrics: Record<string, number | string>;
};

export const Route = createFileRoute("/api/coach")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const auth = await authenticateRequest(request);
        if (!auth) return new Response("Unauthorized", { status: 401 });
        try { await requireFeature(auth.supabase, auth.userId, "ai_coach"); }
        catch (r) { if (r instanceof Response) return r; throw r; }
        const body = (await request.json()) as CoachRequest;
        const key = process.env.LOVABLE_API_KEY;
        if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

        const gateway = createLovableAiGatewayProvider(key);
        const model = gateway("google/gemini-3-flash-preview");

        const system = `You are a Senior Project Manager and PMP-certified coach.
You evaluate learner decisions inside a project management simulation grounded in PMBOK 6 processes, PMBOK 7 principles, and hybrid practices.
Respond in strict markdown with exactly these three short sections and nothing else:

**Outcome impact** — 1-2 sentences on likely consequences to budget, schedule, scope, risk, stakeholders, morale.
**PMBOK insight** — 1-2 sentences naming the specific principle/process area (e.g. Integrated Change Control, Risk Response Planning, Stakeholder Engagement, Stewardship).
**Coach recommendation** — 1-2 sentences with a better or reinforcing action, plus a simulated stakeholder reaction (Sponsor/Client/Team/Vendor/PMO) in one clause.

Be concise, professional, training-focused. No preamble, no headings beyond the three bold labels.`;

        const prompt = `Phase: ${body.phase}
Current metrics: ${JSON.stringify(body.metrics)}
Scenario: ${body.scenario}
Learner decision: ${body.choiceLabel}${body.choiceRationale ? `\nWhy it matters: ${body.choiceRationale}` : ""}`;

        try {
          const { text } = await generateText({
            model,
            system,
            prompt,
          });
          return Response.json({ text });
        } catch (err) {
          const message = err instanceof Error ? err.message : "Coach unavailable";
          return new Response(message, { status: 500 });
        }
      },
    },
  },
});
