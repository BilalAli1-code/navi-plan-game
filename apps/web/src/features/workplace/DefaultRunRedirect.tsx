import { Navigate, useParams } from "react-router-dom";
import { workplaceMissionControlPath } from "./routes";

/**
 * Deterministic default for `/app/runs/:simulationRunId`.
 * Always replaces to Mission Control — no payload/time/localStorage inference.
 */
export function DefaultRunRedirect() {
  const { simulationRunId = "" } = useParams();
  if (!simulationRunId.trim()) {
    return <Navigate to="/" replace />;
  }
  return <Navigate to={workplaceMissionControlPath(simulationRunId)} replace />;
}
