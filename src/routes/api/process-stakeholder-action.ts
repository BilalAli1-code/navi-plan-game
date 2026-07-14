import { createFileRoute } from "@tanstack/react-router";
import { processNegotiation, processEscalation, processInformationRequest, processExpectationManagement, processFeedback, processPresentation, processMeetingResponse } from "@/lib/sim/stakeholder-engine";
import { stakeholdersFor } from "@/lib/sim/cases";

export const Route = createFileRoute("/api/process-stakeholder-action")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = (await request.json()) as { data: { action: any; caseId: string } };
          const { action, caseId } = body.data;

          if (!action || !action.stakeholderId) {
            return Response.json({ error: "Missing stakeholder context" }, { status: 400 });
          }

          const stakes = stakeholdersFor(caseId);
          const stakeholder = stakes.find((s) => s.id === action.stakeholderId);
          if (!stakeholder) {
            return Response.json({ error: "Stakeholder not found" }, { status: 404 });
          }

          let outcome;

          if (action.interactionType === "negotiation") {
            outcome = processNegotiation(action.negotiationInput, stakeholder.priorities);
          } else if (action.interactionType === "escalation") {
            outcome = processEscalation(action.escalationInput, action.phase);
          } else if (action.interactionType === "information_request") {
            outcome = processInformationRequest(action.informationRequestInput);
          } else if (action.interactionType === "expectation_management") {
            outcome = processExpectationManagement(action.expectationManagementInput);
          } else if (action.interactionType === "feedback") {
            outcome = processFeedback(action.feedbackInput);
          } else if (action.interactionType === "presentation") {
            outcome = processPresentation(action.presentationInput);
          } else if (action.interactionType === "meeting_response") {
            outcome = processMeetingResponse(action.meetingResponseInput);
          } else {
            return Response.json({ error: "Unknown interaction type" }, { status: 400 });
          }

          return Response.json({ success: true, outcome });
        } catch (err) {
          console.error("Stakeholder action processing error:", err);
          const message = err instanceof Error ? err.message : "Processing failed";
          return Response.json({ error: message }, { status: 500 });
        }
      },
    },
  },
});
