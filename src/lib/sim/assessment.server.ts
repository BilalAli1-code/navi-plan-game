// Server-only helpers for the Day 7 final assessment. Kept out of the
// .functions.ts module because the TanStack server-fn splitter deletes sibling
// module-scope declarations from the handler bundle at runtime.

import { generateObject } from "ai";
import { z } from "zod";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";

export const ReportSchema = z.object({
  overall_score: z.number().min(0).max(100),
  readiness_level: z.enum(["developing", "approaching", "ready", "exam_ready"]),
  project_outcome_summary: z.string(),
  leadership_strengths: z.array(z.string()).min(1),
  decision_making_strengths: z.array(z.string()).min(1),
  development_areas: z.array(z.string()).min(1),
  stakeholder_management_assessment: z.string(),
  risk_management_assessment: z.string(),
  delivery_approach_assessment: z.string(),
  pmbok_performance_domains: z
    .array(z.object({ domain: z.string(), score: z.number().min(0).max(100), notes: z.string() }))
    .min(4),
  eco_people_score: z.number().min(0).max(100),
  eco_process_score: z.number().min(0).max(100),
  eco_business_environment_score: z.number().min(0).max(100),
  recommended_next_case: z.string(),
  seven_day_follow_up_plan: z
    .array(z.object({ day: z.number(), focus: z.string(), activities: z.array(z.string()) }))
    .length(7),
});

export type FinalReport = z.infer<typeof ReportSchema>;

export async function generateFinalReport(payload: unknown, caseId: string): Promise<FinalReport> {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("Missing LOVABLE_API_KEY");
  const gateway = createLovableAiGatewayProvider(key);
  const model = gateway("google/gemini-3-flash-preview");

  const system = `You are Maya, a senior PMP-certified project management mentor.
Write a rigorous, honest, PMI-aligned final assessment for a learner who completed a 7-day project simulation.
Ground scores in the trusted data provided. Do not invent numbers. Be specific, use PMI vocabulary, and give actionable coaching.`;

  const prompt = `Generate the final assessment as strict JSON matching the schema.

Trusted learner data:
${JSON.stringify(payload, null, 2)}

Scoring guidance:
- overall_score: weighted blend of project health, decision correctness, and practice average.
- readiness_level: developing (<55), approaching (55-69), ready (70-84), exam_ready (>=85).
- pmbok_performance_domains: cover at minimum Stakeholders, Team, Planning, Delivery, Measurement, Uncertainty.
- ECO scores: derive from decisions and practice mapped to People / Process / Business Environment.
- seven_day_follow_up_plan: exactly 7 days of targeted follow-up, each 60-90 min, targeting the learner's weakest areas.
- recommended_next_case: pick a plausible next industry (e.g. Healthcare, Software, Aerospace, Retail) different from ${caseId}.`;

  const { object } = await generateObject({ model, schema: ReportSchema, prompt, system });
  return object;
}
