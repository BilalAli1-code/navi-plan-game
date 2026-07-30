import { useEffect, useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { ApiClientError, createApiClient } from "../../api/client";
import { createDevBrowserToken, useAuthSession } from "../../auth/session";
import { useMeetingsProjection } from "./useMeetingsProjection";
import "./MeetingsPage.css";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "";

const STATUS_LABELS: Record<
  "scheduled" | "available" | "started" | "completed" | "cancelled",
  string
> = {
  scheduled: "Scheduled",
  available: "Available",
  started: "Started",
  completed: "Completed",
  cancelled: "Cancelled",
};

const formatTimestamp = (value: string | null): string | null => {
  if (value === null) {
    return null;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
};

type MeetingRow = {
  readonly meetingOccurrenceId: string;
  readonly meetingDefinitionId: string;
  readonly title: string;
  readonly agenda: string | null;
  readonly status:
    "scheduled" | "available" | "started" | "completed" | "cancelled";
  readonly scheduledFor: string;
  readonly durationMinutes: number | null;
  readonly channel: string | null;
  readonly location: string | null;
  readonly participants: readonly {
    readonly stakeholderId: string;
    readonly displayName: string;
  }[];
};

export function MeetingsPage() {
  const { simulationRunId = "" } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const session = useAuthSession();
  const expectedVersionRaw = searchParams.get("expectVersion");
  const expectedSourceAggregateVersion =
    expectedVersionRaw && /^\d+$/.test(expectedVersionRaw)
      ? Number(expectedVersionRaw)
      : null;
  const [convergenceTimedOut, setConvergenceTimedOut] = useState(false);
  const [busyMeetingId, setBusyMeetingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionStatus, setActionStatus] = useState<string | null>(null);

  const apiClient = useMemo(
    () =>
      createApiClient({
        baseUrl: apiBaseUrl,
        getAccessToken: () => session.accessToken,
      }),
    [session.accessToken],
  );

  const query = useMeetingsProjection({
    apiClient,
    simulationRunId,
    actorId: session.actorId,
    enabled: Boolean(session.accessToken && simulationRunId),
    expectedSourceAggregateVersion,
  });

  const data = query.data;
  const converging =
    expectedSourceAggregateVersion !== null &&
    data !== undefined &&
    !(
      data.meta.freshness === "current" &&
      data.meta.sourceAggregateVersion >= expectedSourceAggregateVersion
    );

  useEffect(() => {
    if (!converging) {
      setConvergenceTimedOut(false);
      return;
    }
    const timer = window.setTimeout(() => {
      setConvergenceTimedOut(true);
    }, 8_000);
    return () => {
      window.clearTimeout(timer);
    };
  }, [converging]);

  const runMeetingCommand = async (
    meetingDefinitionId: string,
    action: "start" | "complete",
  ) => {
    if (!data || busyMeetingId !== null) {
      return;
    }
    setActionError(null);
    setActionStatus(null);
    setBusyMeetingId(meetingDefinitionId);
    try {
      const common = {
        simulationRunId,
        commandId: `cmd_${crypto.randomUUID()}`,
        correlationId: `corr_${crypto.randomUUID()}`,
        expectedAggregateVersion: data.meta.sourceAggregateVersion,
        meetingId: meetingDefinitionId,
      };
      const receipt =
        action === "start"
          ? await apiClient.startMeeting(common)
          : await apiClient.completeMeeting(common);
      setActionStatus(
        action === "start"
          ? "Meeting started. Refreshing Meetings…"
          : "Meeting completed. Refreshing Meetings…",
      );
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.set("expectVersion", String(receipt.data.aggregateVersion));
          return next;
        },
        { replace: true },
      );
      await query.refetch();
    } catch (error) {
      setActionError(
        error instanceof Error
          ? error.message
          : action === "start"
            ? "Unable to start meeting."
            : "Unable to complete meeting.",
      );
    } finally {
      setBusyMeetingId(null);
    }
  };

  if (!session.accessToken) {
    return (
      <main className="meetings-page">
        <h1>Meetings</h1>
        <p role="alert">Authentication required.</p>
        {import.meta.env.DEV ? (
          <button
            type="button"
            onClick={() =>
              session.setSession({
                actorId: "actor_1",
                tenantId: "tenant_local",
                accessToken: createDevBrowserToken({
                  actorId: "actor_1",
                  tenantId: "tenant_local",
                }),
                authSource: "dev",
              })
            }
          >
            Sign in (dev)
          </button>
        ) : (
          <p>Sign in with Supabase Auth, then reopen Meetings.</p>
        )}
        <p>
          <Link to="/">Back to home</Link>
        </p>
      </main>
    );
  }

  if (!simulationRunId) {
    return (
      <main className="meetings-page">
        <h1>Meetings</h1>
        <p role="alert">A simulation run id is required.</p>
      </main>
    );
  }

  const error = query.error;
  const retryable =
    error instanceof ApiClientError ? error.retryable : Boolean(error);

  const upcoming = data?.data.meetings.filter(
    (meeting) =>
      meeting.status === "scheduled" ||
      meeting.status === "available" ||
      meeting.status === "started",
  );
  const completed = data?.data.meetings.filter(
    (meeting) => meeting.status === "completed",
  );
  const cancelled = data?.data.meetings.filter(
    (meeting) => meeting.status === "cancelled",
  );

  return (
    <main className="meetings-page">
      <header className="meetings-header">
        <p className="meetings-eyebrow">ProjectSim</p>
        <h1>Meetings</h1>
        <p className="meetings-subtitle">
          Scheduled meetings for run{" "}
          <span className="meetings-run-id">{simulationRunId}</span>
        </p>
      </header>

      {query.isLoading && !data ? (
        <p role="status" aria-live="polite">
          Loading Meetings…
        </p>
      ) : null}

      {error && !data ? (
        <section aria-labelledby="meetings-error-heading">
          <h2 id="meetings-error-heading">Unable to load Meetings</h2>
          <p role="alert">
            {error instanceof Error ? error.message : "Unexpected error."}
          </p>
          {retryable ? (
            <button type="button" onClick={() => void query.refetch()}>
              Retry
            </button>
          ) : null}
        </section>
      ) : null}

      {data ? (
        <>
          {data.meta.freshness === "rebuild_failed" ? (
            <p role="status" className="meetings-stale">
              Showing the last available Meetings. A refresh did not complete.
            </p>
          ) : null}
          {data.meta.freshness === "stale" || converging ? (
            <p role="status" className="meetings-stale" aria-live="polite">
              {convergenceTimedOut
                ? "Meetings is still catching up. Use Retry or reopen this page."
                : "Meetings is catching up with the latest simulation state…"}
            </p>
          ) : null}
          {data.meta.freshness === "current" && !converging ? (
            <p className="meetings-freshness" data-testid="meetings-freshness">
              Current
            </p>
          ) : null}

          {actionError ? (
            <p role="alert" className="meetings-action-error">
              {actionError}
            </p>
          ) : null}
          {actionStatus ? (
            <p
              role="status"
              className="meetings-action-status"
              aria-live="polite"
            >
              {actionStatus}
            </p>
          ) : null}

          {data.data.summary.isEmpty || data.data.meetings.length === 0 ? (
            <p className="meetings-empty" data-testid="meetings-empty">
              No meetings are currently scheduled for this simulation run.
            </p>
          ) : (
            <>
              <section
                className="meetings-section"
                aria-labelledby="meetings-upcoming-heading"
              >
                <h2 id="meetings-upcoming-heading">Active and upcoming</h2>
                {upcoming && upcoming.length > 0 ? (
                  <ul className="meetings-list" data-testid="meetings-upcoming">
                    {upcoming.map((meeting) => (
                      <MeetingListItem
                        key={meeting.meetingOccurrenceId}
                        meeting={meeting}
                        busyMeetingId={busyMeetingId}
                        onStart={() =>
                          void runMeetingCommand(
                            meeting.meetingDefinitionId,
                            "start",
                          )
                        }
                        onComplete={() =>
                          void runMeetingCommand(
                            meeting.meetingDefinitionId,
                            "complete",
                          )
                        }
                      />
                    ))}
                  </ul>
                ) : (
                  <p>No active or upcoming meetings.</p>
                )}
              </section>

              <section
                className="meetings-section"
                aria-labelledby="meetings-completed-heading"
              >
                <h2 id="meetings-completed-heading">Completed</h2>
                {completed && completed.length > 0 ? (
                  <ul
                    className="meetings-list"
                    data-testid="meetings-completed"
                  >
                    {completed.map((meeting) => (
                      <MeetingListItem
                        key={meeting.meetingOccurrenceId}
                        meeting={meeting}
                        busyMeetingId={busyMeetingId}
                      />
                    ))}
                  </ul>
                ) : (
                  <p>No completed meetings.</p>
                )}
              </section>

              <section
                className="meetings-section"
                aria-labelledby="meetings-cancelled-heading"
              >
                <h2 id="meetings-cancelled-heading">Cancelled</h2>
                {cancelled && cancelled.length > 0 ? (
                  <ul
                    className="meetings-list"
                    data-testid="meetings-cancelled"
                  >
                    {cancelled.map((meeting) => (
                      <MeetingListItem
                        key={meeting.meetingOccurrenceId}
                        meeting={meeting}
                        busyMeetingId={busyMeetingId}
                      />
                    ))}
                  </ul>
                ) : (
                  <p>No cancelled meetings.</p>
                )}
              </section>
            </>
          )}
        </>
      ) : null}
    </main>
  );
}

function MeetingListItem(input: {
  readonly meeting: MeetingRow;
  readonly busyMeetingId: string | null;
  readonly onStart?: () => void;
  readonly onComplete?: () => void;
}) {
  const { meeting, busyMeetingId, onStart, onComplete } = input;
  const scheduledLabel = formatTimestamp(meeting.scheduledFor);
  const busy = busyMeetingId !== null;
  const thisBusy = busyMeetingId === meeting.meetingDefinitionId;
  return (
    <li
      className="meetings-item"
      data-testid="meetings-item"
      data-meeting-id={meeting.meetingOccurrenceId}
      data-meeting-definition-id={meeting.meetingDefinitionId}
      data-status={meeting.status}
    >
      <h3 className="meetings-item-title">{meeting.title}</h3>
      <p className="meetings-item-meta">
        <span className="meetings-status">{STATUS_LABELS[meeting.status]}</span>
        {scheduledLabel ? ` · ${scheduledLabel}` : null}
        {meeting.durationMinutes !== null
          ? ` · ${meeting.durationMinutes} min`
          : null}
      </p>
      {meeting.channel || meeting.location ? (
        <p className="meetings-item-meta">
          {[meeting.channel, meeting.location].filter(Boolean).join(" · ")}
        </p>
      ) : null}
      {meeting.agenda ? (
        <p className="meetings-item-agenda">{meeting.agenda}</p>
      ) : null}
      <p className="meetings-item-participants">
        Participants:{" "}
        {meeting.participants
          .map((participant) => participant.displayName)
          .join(", ")}
      </p>
      {meeting.status === "available" && onStart ? (
        <div className="meetings-item-actions">
          <button
            type="button"
            data-testid="meetings-start"
            disabled={busy}
            onClick={onStart}
          >
            {thisBusy ? "Starting…" : "Start"}
          </button>
        </div>
      ) : null}
      {meeting.status === "started" && onComplete ? (
        <div className="meetings-item-actions">
          <button
            type="button"
            data-testid="meetings-complete"
            disabled={busy}
            onClick={onComplete}
          >
            {thisBusy ? "Completing…" : "Complete"}
          </button>
        </div>
      ) : null}
    </li>
  );
}
