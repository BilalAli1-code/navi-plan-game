import type { ProjectionFreshness } from "./types";

export interface ProjectionFreshnessBannerProps {
  readonly freshness: ProjectionFreshness;
  readonly onRetry?: () => void;
}

export function ProjectionFreshnessBanner({
  freshness,
  onRetry,
}: ProjectionFreshnessBannerProps) {
  if (freshness === "current") {
    return null;
  }
  const message =
    freshness === "rebuild_failed"
      ? "Displayed simulation data may not be current. Decision submission is disabled until refresh succeeds."
      : "Displayed simulation data is stale. Decision submission is disabled.";
  return (
    <div
      className="ps-freshness-banner"
      role="status"
      aria-live="polite"
      data-freshness={freshness}
    >
      <p>{message}</p>
      {onRetry ? (
        <button type="button" onClick={onRetry}>
          Refresh projection
        </button>
      ) : null}
    </div>
  );
}
