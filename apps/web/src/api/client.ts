/**
 * Authenticated browser API client for Decision UI.
 * Never uses service-role credentials. Does not log tokens or rationale.
 */

export interface ApiClientConfig {
  readonly baseUrl: string;
  readonly getAccessToken: () => string | null;
  readonly allocateCorrelationId?: () => string;
}

export class ApiClientError extends Error {
  readonly status: number;
  readonly code: string;
  readonly retryable: boolean;
  readonly requestId: string;
  readonly correlationId: string;
  readonly fieldErrors?: Readonly<Record<string, readonly string[]>>;

  constructor(input: {
    readonly status: number;
    readonly code: string;
    readonly message: string;
    readonly retryable: boolean;
    readonly requestId: string;
    readonly correlationId: string;
    readonly fieldErrors?: Readonly<Record<string, readonly string[]>>;
  }) {
    super(input.message);
    this.name = "ApiClientError";
    this.status = input.status;
    this.code = input.code;
    this.retryable = input.retryable;
    this.requestId = input.requestId;
    this.correlationId = input.correlationId;
    if (input.fieldErrors !== undefined) {
      this.fieldErrors = input.fieldErrors;
    }
  }
}

export interface ProjectionApiResult {
  readonly data: {
    readonly simulationRunId: string;
    readonly learnerId: string;
    readonly contentPackageVersionId: string;
    readonly sourceAggregateVersion: number;
    readonly sourceStateVersion: number;
    readonly sourceActionSequence: number;
    readonly generatedAt: string;
    readonly projectionSchemaVersion: number;
    readonly run: {
      readonly status: string;
    };
    readonly project: {
      readonly status: string;
      readonly metrics: readonly {
        readonly metricKey: string;
        readonly value: number;
        readonly unit: string | null;
      }[];
    };
    readonly availableDecisions: readonly {
      readonly decisionDefinitionId: string;
      readonly title: string;
      readonly prompt: string;
      readonly description: string | null;
      readonly expiresAt: string | null;
      readonly authoredOrder: number;
      readonly options: readonly {
        readonly optionId: string;
        readonly label: string;
        readonly authoredOrder: number;
      }[];
    }[];
    readonly decisionHistory: readonly {
      readonly decisionRecordId: string;
      readonly decisionDefinitionId: string;
      readonly selectedOptionId: string;
      readonly selectedOptionLabel: string | null;
      readonly submittedAt: string;
      readonly resolvedAt: string | null;
      readonly status: "submitted" | "resolved";
      readonly qualityClassification: string | null;
      readonly publicResultSummary: string | null;
    }[];
  };
  readonly meta: {
    readonly requestId: string;
    readonly correlationId: string;
    readonly apiVersion: "v1";
    readonly projectionSchemaVersion: number;
    readonly sourceAggregateVersion: number;
    readonly freshness: "current" | "stale" | "rebuild_failed";
    readonly generatedAt: string;
  };
}

export interface SubmitDecisionReceiptResult {
  readonly data: {
    readonly commandId: string;
    readonly status: "accepted";
    readonly aggregateVersion: number;
    readonly simulationRunId: string;
    readonly correlationId: string;
  };
  readonly meta: {
    readonly requestId: string;
    readonly correlationId: string;
    readonly apiVersion: "v1";
  };
}

export type MissionControlChannelCount =
  | { readonly availability: "available"; readonly count: number }
  | {
      readonly availability: "unavailable";
      readonly reason: "channel_not_implemented";
    };

export interface MissionControlApiResult {
  readonly data: {
    readonly projectionId?: string;
    readonly projectionType: "mission_control";
    readonly projectionSchemaVersion: 1;
    readonly tenantId: string;
    readonly simulationRunId: string;
    readonly learnerId: string;
    readonly contentPackageVersionId: string;
    readonly sourceAggregateVersion: number;
    readonly sourceStateVersion: number;
    readonly sourceActionSequence: number;
    readonly generatedAt: string;
    readonly runSummary: {
      readonly simulationRunId: string;
      readonly status: string;
      readonly startedAt: string | null;
      readonly completedAt: string | null;
      readonly currentChapterId: string | null;
      readonly currentDayId: string | null;
      readonly contentPackageVersionId: string;
    };
    readonly projectSummary: {
      readonly status: string;
      readonly metrics: readonly {
        readonly metricKey: string;
        readonly value: number;
        readonly unit: string | null;
      }[];
    };
    readonly counts: {
      readonly pendingDecisions: {
        readonly availability: "available";
        readonly count: number;
      };
      readonly unreadActionRequiredInboxItems: MissionControlChannelCount;
      readonly upcomingMeetings: MissionControlChannelCount;
      readonly activeActivities: {
        readonly availability: "available";
        readonly count: number;
      };
      readonly blockingCrises: {
        readonly availability: "available";
        readonly count: number;
      };
    };
    readonly nextRecommendedActions: readonly {
      readonly actionId: string;
      readonly label: string;
      readonly targetKind: "decision";
      readonly targetId: string;
      readonly authoredOrder: number;
    }[];
    readonly recentRevealedOutcome: {
      readonly decisionRecordId: string;
      readonly decisionDefinitionId: string;
      readonly selectedOptionLabel: string | null;
      readonly publicResultSummary: string;
      readonly resolvedAt: string;
    } | null;
  };
  readonly meta: {
    readonly requestId: string;
    readonly correlationId: string;
    readonly apiVersion: "v1";
    readonly projectionSchemaVersion: number;
    readonly sourceAggregateVersion: number;
    readonly freshness: "current" | "stale" | "rebuild_failed";
    readonly generatedAt: string;
  };
}

export interface DecisionLogApiResult {
  readonly data: {
    readonly projectionId?: string;
    readonly projectionType: "decision_log";
    readonly projectionSchemaVersion: 1;
    readonly tenantId: string;
    readonly simulationRunId: string;
    readonly learnerId: string;
    readonly contentPackageVersionId: string;
    readonly sourceAggregateVersion: number;
    readonly sourceStateVersion: number;
    readonly sourceActionSequence: number;
    readonly generatedAt: string;
    readonly entries: readonly {
      readonly entryId: string;
      readonly decisionRecordId: string;
      readonly decisionDefinitionId: string;
      readonly sequence: number;
      readonly decidedAt: string;
      readonly title: string;
      readonly selectedOption: {
        readonly optionId: string;
        readonly label: string | null;
      };
      readonly status: "submitted" | "resolved";
      readonly revealedOutcome: { readonly summary: string } | null;
    }[];
    readonly summary: {
      readonly totalEntries: number;
      readonly isEmpty: boolean;
    };
  };
  readonly meta: {
    readonly requestId: string;
    readonly correlationId: string;
    readonly apiVersion: "v1";
    readonly projectionSchemaVersion: number;
    readonly sourceAggregateVersion: number;
    readonly freshness: "current" | "stale" | "rebuild_failed";
    readonly generatedAt: string;
  };
}

export interface MeetingsApiResult {
  readonly data: {
    readonly projectionId?: string;
    readonly projectionType: "meetings";
    readonly projectionSchemaVersion: 1;
    readonly tenantId: string;
    readonly simulationRunId: string;
    readonly learnerId: string;
    readonly contentPackageVersionId: string;
    readonly sourceAggregateVersion: number;
    readonly sourceStateVersion: number;
    readonly sourceActionSequence: number;
    readonly generatedAt: string;
    readonly meetings: readonly {
      readonly meetingOccurrenceId: string;
      readonly meetingDefinitionId: string;
      readonly meetingDefinitionVersion: string;
      readonly scheduleSequence: number;
      readonly scheduledFor: string;
      readonly durationMinutes: number | null;
      readonly title: string;
      readonly agenda: string | null;
      readonly participants: readonly {
        readonly stakeholderId: string;
        readonly displayName: string;
      }[];
      readonly channel: string | null;
      readonly location: string | null;
      readonly status:
        "scheduled" | "available" | "started" | "completed" | "cancelled";
      readonly scheduledAt: string;
      readonly availableAt: string | null;
      readonly startedAt: string | null;
      readonly completedAt: string | null;
      readonly cancelledAt: string | null;
    }[];
    readonly summary: {
      readonly totalMeetings: number;
      readonly upcomingCount: number;
      readonly activeCount: number;
      readonly completedCount: number;
      readonly cancelledCount: number;
      readonly isEmpty: boolean;
    };
    readonly capabilities: {
      readonly start: "unsupported";
      readonly complete: "unsupported";
      readonly cancel: "unsupported";
      readonly reschedule: "unsupported";
    };
  };
  readonly meta: {
    readonly requestId: string;
    readonly correlationId: string;
    readonly apiVersion: "v1";
    readonly projectionSchemaVersion: number;
    readonly sourceAggregateVersion: number;
    readonly freshness: "current" | "stale" | "rebuild_failed";
    readonly generatedAt: string;
  };
}

export interface StakeholdersApiResult {
  readonly data: {
    readonly projectionId?: string;
    readonly projectionType: "stakeholders";
    readonly projectionSchemaVersion: 1;
    readonly tenantId: string;
    readonly simulationRunId: string;
    readonly learnerId: string;
    readonly contentPackageVersionId: string;
    readonly sourceAggregateVersion: number;
    readonly sourceStateVersion: number;
    readonly sourceActionSequence: number;
    readonly generatedAt: string;
    readonly stakeholders: readonly {
      readonly stakeholderId: string;
      readonly stakeholderDefinitionId: string;
      readonly stakeholderDefinitionVersion: string;
      readonly initializationSequence: number;
      readonly profile: {
        readonly displayName: string;
        readonly roleLabel: string | null;
        readonly organization: string | null;
        readonly department: string | null;
        readonly biography: string | null;
      };
      readonly conversation: {
        readonly conversationId: string;
        readonly messages: readonly {
          readonly messageId: string;
          readonly conversationSequence: number;
          readonly direction: "learner_to_stakeholder";
          readonly author: {
            readonly kind: "learner";
            readonly label: "You";
          };
          readonly body: string;
          readonly occurredAt: string;
        }[];
      } | null;
    }[];
    readonly summary: {
      readonly totalStakeholders: number;
      readonly stakeholdersWithConversation: number;
      readonly totalMessages: number;
      readonly isEmpty: boolean;
    };
    readonly capabilities: {
      readonly sendMessage: "unsupported";
      readonly editProfile: "unsupported";
    };
  };
  readonly meta: {
    readonly requestId: string;
    readonly correlationId: string;
    readonly apiVersion: "v1";
    readonly projectionSchemaVersion: number;
    readonly sourceAggregateVersion: number;
    readonly freshness: "current" | "stale" | "rebuild_failed";
    readonly generatedAt: string;
  };
}

export interface NotificationsApiResult {
  readonly data: {
    readonly projectionId?: string;
    readonly projectionType: "notifications";
    readonly projectionSchemaVersion: 1;
    readonly tenantId: string;
    readonly simulationRunId: string;
    readonly learnerId: string;
    readonly contentPackageVersionId: string;
    readonly sourceAggregateVersion: number;
    readonly sourceStateVersion: number;
    readonly sourceActionSequence: number;
    readonly generatedAt: string;
    readonly notifications: readonly {
      readonly notificationId: string;
      readonly creationSequence: number;
      readonly title: string;
      readonly summary: string;
      readonly body: string | null;
      readonly source: {
        readonly kind: string;
        readonly sourceId: string | null;
        readonly reason: string | null;
      };
      readonly status: "active";
      readonly createdAt: string;
    }[];
    readonly summary: {
      readonly totalNotifications: number;
      readonly isEmpty: boolean;
    };
    readonly capabilities: {
      readonly markRead: "unsupported";
      readonly dismiss: "unsupported";
      readonly preferences: "unsupported";
    };
  };
  readonly meta: {
    readonly requestId: string;
    readonly correlationId: string;
    readonly apiVersion: "v1";
    readonly projectionSchemaVersion: number;
    readonly sourceAggregateVersion: number;
    readonly freshness: "current" | "stale" | "rebuild_failed";
    readonly generatedAt: string;
  };
}

export interface ActivitiesApiResult {
  readonly data: {
    readonly projectionId?: string;
    readonly projectionType: "activities";
    readonly projectionSchemaVersion: 1;
    readonly tenantId: string;
    readonly simulationRunId: string;
    readonly learnerId: string;
    readonly contentPackageVersionId: string;
    readonly sourceAggregateVersion: number;
    readonly sourceStateVersion: number;
    readonly sourceActionSequence: number;
    readonly generatedAt: string;
    readonly activities: readonly {
      readonly activityId: string;
      readonly creationSequence: number;
      readonly title: string;
      readonly summary: string;
      readonly body: string | null;
      readonly source: {
        readonly kind: string;
        readonly sourceId: string | null;
        readonly reason: string | null;
      };
      readonly status: "active";
      readonly createdAt: string;
    }[];
    readonly summary: {
      readonly totalActivities: number;
      readonly isEmpty: boolean;
    };
    readonly capabilities: {
      readonly complete: "unsupported";
      readonly reopen: "unsupported";
      readonly assign: "unsupported";
    };
  };
  readonly meta: {
    readonly requestId: string;
    readonly correlationId: string;
    readonly apiVersion: "v1";
    readonly projectionSchemaVersion: number;
    readonly sourceAggregateVersion: number;
    readonly freshness: "current" | "stale" | "rebuild_failed";
    readonly generatedAt: string;
  };
}

export interface CompletedHistoryApiResult {
  readonly data: {
    readonly projectionId?: string;
    readonly projectionType: "completed_history";
    readonly projectionSchemaVersion: 1;
    readonly tenantId: string;
    readonly simulationRunId: string;
    readonly learnerId: string;
    readonly contentPackageVersionId: string;
    readonly sourceAggregateVersion: number;
    readonly sourceStateVersion: number;
    readonly sourceActionSequence: number;
    readonly generatedAt: string;
    readonly items: readonly {
      readonly activityId: string;
      readonly creationSequence: number;
      readonly completionSequence: number;
      readonly title: string;
      readonly summary: string;
      readonly body: string | null;
      readonly source: {
        readonly kind: string;
        readonly sourceId: string | null;
        readonly reason: string | null;
      };
      readonly status: "completed";
      readonly createdAt: string;
      readonly completedAt: string;
    }[];
    readonly summary: {
      readonly totalCompleted: number;
      readonly isEmpty: boolean;
    };
    readonly capabilities: {
      readonly reopen: "unsupported";
      readonly clear: "unsupported";
      readonly export: "unsupported";
    };
  };
  readonly meta: {
    readonly requestId: string;
    readonly correlationId: string;
    readonly apiVersion: "v1";
    readonly projectionSchemaVersion: number;
    readonly sourceAggregateVersion: number;
    readonly freshness: "current" | "stale" | "rebuild_failed";
    readonly generatedAt: string;
  };
}

export interface DocumentsApiResult {
  readonly data: {
    readonly projectionId?: string;
    readonly projectionType: "documents";
    readonly projectionSchemaVersion: 1;
    readonly tenantId: string;
    readonly simulationRunId: string;
    readonly learnerId: string;
    readonly contentPackageVersionId: string;
    readonly sourceAggregateVersion: number;
    readonly sourceStateVersion: number;
    readonly sourceActionSequence: number;
    readonly generatedAt: string;
    readonly documents: readonly {
      readonly documentId: string;
      readonly documentDefinitionId: string;
      readonly documentDefinitionVersion: string;
      readonly creationSequence: number;
      readonly title: string;
      readonly category: string | null;
      readonly description: string | null;
      readonly contentType: "plain_text";
      readonly body: string;
      readonly status: "available";
      readonly createdAt: string;
    }[];
    readonly summary: {
      readonly totalDocuments: number;
      readonly isEmpty: boolean;
    };
    readonly capabilities: {
      readonly upload: "unsupported";
      readonly edit: "unsupported";
      readonly comment: "unsupported";
    };
  };
  readonly meta: {
    readonly requestId: string;
    readonly correlationId: string;
    readonly apiVersion: "v1";
    readonly projectionSchemaVersion: number;
    readonly sourceAggregateVersion: number;
    readonly freshness: "current" | "stale" | "rebuild_failed";
    readonly generatedAt: string;
  };
}

export interface PerformanceApiResult {
  readonly data: {
    readonly projectionId?: string;
    readonly projectionType: "performance";
    readonly projectionSchemaVersion: 1;
    readonly tenantId: string;
    readonly simulationRunId: string;
    readonly learnerId: string;
    readonly contentPackageVersionId: string;
    readonly sourceAggregateVersion: number;
    readonly sourceStateVersion: number;
    readonly sourceActionSequence: number;
    readonly generatedAt: string;
    readonly runSummary: {
      readonly simulationRunId: string;
      readonly status: string;
      readonly startedAt: string | null;
      readonly completedAt: string | null;
      readonly currentChapterId: string | null;
      readonly currentDayId: string | null;
      readonly contentPackageVersionId: string;
    };
    readonly projectSummary: {
      readonly status: string;
      readonly metrics: readonly {
        readonly metricKey: string;
        readonly value: number;
        readonly unit: string | null;
      }[];
    };
    readonly decisionCounts: {
      readonly submitted: number;
      readonly resolved: number;
    };
    readonly activityCounts: {
      readonly active: number;
      readonly completed: number;
    };
    readonly meetingCounts: {
      readonly upcoming: number;
      readonly active: number;
      readonly completed: number;
      readonly cancelled: number;
    };
    readonly documentCount: number;
    readonly crisisSummary: {
      readonly activeCount: number;
      readonly resolvedCount: number;
      readonly activeCrisisIds: readonly string[];
    };
    readonly recentlyResolvedDecisions: readonly {
      readonly decisionRecordId: string;
      readonly decisionDefinitionId: string;
      readonly selectedOptionLabel: string | null;
      readonly publicResultSummary: string;
      readonly resolvedAt: string;
    }[];
  };
  readonly meta: {
    readonly requestId: string;
    readonly correlationId: string;
    readonly apiVersion: "v1";
    readonly projectionSchemaVersion: number;
    readonly sourceAggregateVersion: number;
    readonly freshness: "current" | "stale" | "rebuild_failed";
    readonly generatedAt: string;
  };
}

export interface LearnerProgressionApiResult {
  readonly data: {
    readonly projectionId?: string;
    readonly projectionType: "learner_progression";
    readonly projectionSchemaVersion: 1;
    readonly tenantId: string;
    readonly simulationRunId: string;
    readonly learnerId: string;
    readonly contentPackageVersionId: string;
    readonly sourceAggregateVersion: number;
    readonly sourceStateVersion: number;
    readonly sourceActionSequence: number;
    readonly generatedAt: string;
    readonly chapters: readonly {
      readonly chapterId: string;
      readonly order: number;
      readonly title: string;
      readonly status:
        "locked" | "available" | "active" | "blocked" | "completed";
      readonly requirements: readonly {
        readonly kind: "decision" | "activity" | "meeting";
        readonly targetId: string;
        readonly status: "pending" | "completed";
      }[];
      readonly blockers: readonly {
        readonly code: string;
        readonly kind: "decision" | "activity" | "meeting" | "crisis";
        readonly targetId: string;
        readonly message: string;
      }[];
    }[];
    readonly summary: {
      readonly totalChapters: number;
      readonly completedChapterCount: number;
      readonly activeChapterId: string | null;
      readonly blockedChapterCount: number;
      readonly lockedChapterCount: number;
      readonly availableChapterCount: number;
    };
  };
  readonly meta: {
    readonly requestId: string;
    readonly correlationId: string;
    readonly apiVersion: "v1";
    readonly projectionSchemaVersion: number;
    readonly sourceAggregateVersion: number;
    readonly freshness: "current" | "stale" | "rebuild_failed";
    readonly generatedAt: string;
  };
}

type LearningProjectionMeta = {
  readonly requestId: string;
  readonly correlationId: string;
  readonly apiVersion: "v1";
  readonly projectionSchemaVersion: number;
  readonly sourceAggregateVersion: number;
  readonly freshness: "current" | "stale" | "rebuild_failed";
  readonly generatedAt: string;
};

type LearningProjectionEnvelope<T extends string, Body> = {
  readonly data: {
    readonly projectionType: T;
    readonly projectionSchemaVersion: 1;
    readonly tenantId: string;
    readonly simulationRunId: string;
    readonly learnerId: string;
    readonly contentPackageVersionId: string;
    readonly sourceAggregateVersion: number;
    readonly sourceStateVersion: number;
    readonly sourceActionSequence: number;
    readonly generatedAt: string;
  } & Body;
  readonly meta: LearningProjectionMeta;
};

export type AchievementsApiResult = LearningProjectionEnvelope<
  "achievements",
  {
    readonly awards: readonly {
      readonly achievementId: string;
      readonly title: string;
      readonly description: string;
      readonly awardId: string;
      readonly qualifyingEvidenceIds: readonly string[];
      readonly ruleVersion: string;
    }[];
    readonly xpSummary: {
      readonly availability: "unavailable";
      readonly reason: "xp_amounts_not_authored";
      readonly totalXp: 0;
    };
  }
>;

export type MasteryApiResult = LearningProjectionEnvelope<
  "mastery",
  {
    readonly competencies: readonly {
      readonly competencyId: string;
      readonly title: string;
      readonly evidenceCount: number;
      readonly totalDelta: number;
      readonly evidenceIds: readonly string[];
      readonly bandAvailability: "unavailable";
      readonly bandUnavailableReason: "mastery_thresholds_not_authored";
      readonly band: null;
    }[];
    readonly xpSummary: AchievementsApiResult["data"]["xpSummary"];
  }
>;

export type CoachingApiResult = LearningProjectionEnvelope<
  "coaching",
  {
    readonly interventions: readonly {
      readonly id: string;
      readonly interventionType: string;
      readonly chapterId: string | null;
      readonly title: string;
      readonly guidance: string;
      readonly relatedDecisionIds: readonly string[];
      readonly relatedActivityIds: readonly string[];
      readonly timingHint: string;
      readonly fallbackText: string;
    }[];
  }
>;

export interface InboxApiResult {
  readonly data: {
    readonly projectionId?: string;
    readonly projectionType: "inbox";
    readonly projectionSchemaVersion: 1;
    readonly tenantId: string;
    readonly simulationRunId: string;
    readonly learnerId: string;
    readonly contentPackageVersionId: string;
    readonly sourceAggregateVersion: number;
    readonly sourceStateVersion: number;
    readonly sourceActionSequence: number;
    readonly generatedAt: string;
    readonly messages: readonly {
      readonly messageId: string;
      readonly definitionId: string;
      readonly definitionVersion: string;
      readonly sequence: number;
      readonly deliveredAt: string | null;
      readonly sender: {
        readonly senderId: string | null;
        readonly displayName: string;
        readonly roleLabel: string | null;
      };
      readonly subject: string;
      readonly preview: string;
      readonly body: string;
    }[];
    readonly summary: {
      readonly totalMessages: number;
      readonly isEmpty: boolean;
    };
    readonly capabilities: {
      readonly readState: "unsupported";
      readonly archive: "unsupported";
      readonly reply: "unsupported";
      readonly compose: "unsupported";
    };
  };
  readonly meta: {
    readonly requestId: string;
    readonly correlationId: string;
    readonly apiVersion: "v1";
    readonly projectionSchemaVersion: number;
    readonly sourceAggregateVersion: number;
    readonly freshness: "current" | "stale" | "rebuild_failed";
    readonly generatedAt: string;
  };
}

export type ExperienceLevel = "explorer" | "practitioner" | "leader";

export type CaseAvailability =
  "available" | "coming_soon" | "restricted" | "retired";

export type Difficulty =
  "introductory" | "intermediate" | "advanced" | "adaptive";

/** Learner-safe catalog card from GET /api/v1/business-cases. */
export interface BusinessCaseCatalogEntry {
  readonly businessCaseId: string;
  readonly contentVersion: string;
  readonly contentPackageVersionId: string;
  readonly title: string;
  readonly shortTitle: string;
  readonly summary: string;
  readonly industry: string;
  readonly organizationType: string;
  readonly projectType: string;
  readonly estimatedMinutes: number;
  readonly learningDays: number;
  readonly difficulty: Difficulty;
  readonly supportedExperienceLevels: readonly ExperienceLevel[];
  readonly availability: CaseAvailability;
  readonly selectable: boolean;
  readonly accessibilitySummary: string;
}

/** Learner-safe catalog details from GET /api/v1/business-cases/:id. */
export interface BusinessCaseCatalogDetails extends BusinessCaseCatalogEntry {
  readonly learningFocus: readonly string[];
  readonly learnerRole: string;
  readonly prerequisites: readonly string[];
  readonly chapterCount: number;
  readonly pmbokAlignment: readonly string[];
}

export interface BusinessCaseListApiResult {
  readonly data: readonly BusinessCaseCatalogEntry[];
  readonly meta: {
    readonly requestId: string;
    readonly correlationId: string;
    readonly apiVersion: "v1";
  };
}

export interface BusinessCaseDetailsApiResult {
  readonly data: BusinessCaseCatalogDetails;
  readonly meta: {
    readonly requestId: string;
    readonly correlationId: string;
    readonly apiVersion: "v1";
  };
}

export interface CreateSimulationRunApiResult {
  readonly data: {
    readonly simulationRunId: string;
    readonly businessCaseId: string;
    readonly contentVersion: string;
    readonly contentPackageVersionId: string;
    readonly experienceLevel: ExperienceLevel;
    readonly status: string;
    readonly runtimeVersion: string;
    readonly chapterId: string;
    readonly initialized: {
      readonly stakeholders: number;
      readonly documents: number;
      readonly notifications: number;
      readonly activities: number;
      readonly messages: number;
      readonly meetings: number;
    };
  };
  readonly meta: {
    readonly requestId: string;
    readonly correlationId: string;
    readonly apiVersion: "v1";
  };
}

const parseError = async (
  response: Response,
  correlationId: string,
): Promise<ApiClientError> => {
  let code = "UNEXPECTED_ERROR";
  let message = response.statusText || "Request failed.";
  let retryable = response.status >= 500;
  let requestId = "";
  let fieldErrors: Readonly<Record<string, readonly string[]>> | undefined;
  try {
    const body = (await response.json()) as {
      error?: {
        code?: string;
        message?: string;
        retryable?: boolean;
        requestId?: string;
        correlationId?: string;
        fieldErrors?: Record<string, string[]>;
      };
    };
    if (body.error) {
      code = body.error.code ?? code;
      message = body.error.message ?? message;
      retryable = body.error.retryable ?? retryable;
      requestId = body.error.requestId ?? "";
      fieldErrors = body.error.fieldErrors;
    }
  } catch {
    // keep defaults
  }
  return new ApiClientError(
    fieldErrors === undefined
      ? {
          status: response.status,
          code,
          message,
          retryable,
          requestId,
          correlationId,
        }
      : {
          status: response.status,
          code,
          message,
          retryable,
          requestId,
          correlationId,
          fieldErrors,
        },
  );
};

export const createApiClient = (config: ApiClientConfig) => {
  const allocateCorrelationId =
    config.allocateCorrelationId ?? (() => `corr_${crypto.randomUUID()}`);

  const authorizedFetch = async (
    path: string,
    init: RequestInit & {
      readonly correlationId?: string;
      readonly idempotencyKey?: string;
      readonly ifMatch?: string;
    } = {},
  ) => {
    const token = config.getAccessToken();
    if (!token) {
      throw new ApiClientError({
        status: 401,
        code: "UNAUTHENTICATED",
        message: "No authenticated session.",
        retryable: false,
        requestId: "",
        correlationId: init.correlationId ?? "",
      });
    }
    if (token.includes("service_role") || token.includes("service-role")) {
      throw new ApiClientError({
        status: 401,
        code: "UNAUTHENTICATED",
        message: "Service-role credentials are not permitted.",
        retryable: false,
        requestId: "",
        correlationId: init.correlationId ?? "",
      });
    }
    const correlationId = init.correlationId ?? allocateCorrelationId();
    const headers = new Headers(init.headers);
    headers.set("Authorization", `Bearer ${token}`);
    headers.set("X-Correlation-ID", correlationId);
    if (init.idempotencyKey) {
      headers.set("Idempotency-Key", init.idempotencyKey);
    }
    if (init.ifMatch) {
      headers.set("If-Match", init.ifMatch);
    }
    const response = await fetch(`${config.baseUrl}${path}`, {
      ...init,
      headers,
    });
    if (!response.ok) {
      throw await parseError(response, correlationId);
    }
    return response.json();
  };

  return {
    async getProjection(
      simulationRunId: string,
      init?: { readonly signal?: AbortSignal },
    ): Promise<ProjectionApiResult> {
      return authorizedFetch(
        `/api/v1/simulation-runs/${encodeURIComponent(simulationRunId)}/projection`,
        init?.signal ? { signal: init.signal } : {},
      ) as Promise<ProjectionApiResult>;
    },

    async getMissionControl(
      simulationRunId: string,
      init?: { readonly signal?: AbortSignal },
    ): Promise<MissionControlApiResult> {
      return authorizedFetch(
        `/api/v1/simulation-runs/${encodeURIComponent(simulationRunId)}/mission-control`,
        init?.signal ? { signal: init.signal } : {},
      ) as Promise<MissionControlApiResult>;
    },

    async getDecisionLog(
      simulationRunId: string,
      init?: { readonly signal?: AbortSignal },
    ): Promise<DecisionLogApiResult> {
      return authorizedFetch(
        `/api/v1/simulation-runs/${encodeURIComponent(simulationRunId)}/decision-log`,
        init?.signal ? { signal: init.signal } : {},
      ) as Promise<DecisionLogApiResult>;
    },

    async getInbox(
      simulationRunId: string,
      init?: { readonly signal?: AbortSignal },
    ): Promise<InboxApiResult> {
      return authorizedFetch(
        `/api/v1/simulation-runs/${encodeURIComponent(simulationRunId)}/inbox`,
        init?.signal ? { signal: init.signal } : {},
      ) as Promise<InboxApiResult>;
    },

    async getMeetings(
      simulationRunId: string,
      init?: { readonly signal?: AbortSignal },
    ): Promise<MeetingsApiResult> {
      return authorizedFetch(
        `/api/v1/simulation-runs/${encodeURIComponent(simulationRunId)}/meetings`,
        init?.signal ? { signal: init.signal } : {},
      ) as Promise<MeetingsApiResult>;
    },

    async getStakeholders(
      simulationRunId: string,
      init?: { readonly signal?: AbortSignal },
    ): Promise<StakeholdersApiResult> {
      return authorizedFetch(
        `/api/v1/simulation-runs/${encodeURIComponent(simulationRunId)}/stakeholders`,
        init?.signal ? { signal: init.signal } : {},
      ) as Promise<StakeholdersApiResult>;
    },

    async getDocuments(
      simulationRunId: string,
      init?: { readonly signal?: AbortSignal },
    ): Promise<DocumentsApiResult> {
      return authorizedFetch(
        `/api/v1/simulation-runs/${encodeURIComponent(simulationRunId)}/documents`,
        init?.signal ? { signal: init.signal } : {},
      ) as Promise<DocumentsApiResult>;
    },

    async getPerformance(
      simulationRunId: string,
      init?: { readonly signal?: AbortSignal },
    ): Promise<PerformanceApiResult> {
      return authorizedFetch(
        `/api/v1/simulation-runs/${encodeURIComponent(simulationRunId)}/performance`,
        init?.signal ? { signal: init.signal } : {},
      ) as Promise<PerformanceApiResult>;
    },

    async getLearnerProgression(
      simulationRunId: string,
      init?: { readonly signal?: AbortSignal },
    ): Promise<LearnerProgressionApiResult> {
      return authorizedFetch(
        `/api/v1/simulation-runs/${encodeURIComponent(simulationRunId)}/learner-progression`,
        init?.signal ? { signal: init.signal } : {},
      ) as Promise<LearnerProgressionApiResult>;
    },

    async getAchievements(
      simulationRunId: string,
      init?: { readonly signal?: AbortSignal },
    ): Promise<AchievementsApiResult> {
      return authorizedFetch(
        `/api/v1/simulation-runs/${encodeURIComponent(simulationRunId)}/achievements`,
        init?.signal ? { signal: init.signal } : {},
      ) as Promise<AchievementsApiResult>;
    },

    async getMastery(
      simulationRunId: string,
      init?: { readonly signal?: AbortSignal },
    ): Promise<MasteryApiResult> {
      return authorizedFetch(
        `/api/v1/simulation-runs/${encodeURIComponent(simulationRunId)}/mastery`,
        init?.signal ? { signal: init.signal } : {},
      ) as Promise<MasteryApiResult>;
    },

    async getCoaching(
      simulationRunId: string,
      init?: { readonly signal?: AbortSignal },
    ): Promise<CoachingApiResult> {
      return authorizedFetch(
        `/api/v1/simulation-runs/${encodeURIComponent(simulationRunId)}/coaching`,
        init?.signal ? { signal: init.signal } : {},
      ) as Promise<CoachingApiResult>;
    },

    async getNotifications(
      simulationRunId: string,
      init?: { readonly signal?: AbortSignal },
    ): Promise<NotificationsApiResult> {
      return authorizedFetch(
        `/api/v1/simulation-runs/${encodeURIComponent(simulationRunId)}/notifications`,
        init?.signal ? { signal: init.signal } : {},
      ) as Promise<NotificationsApiResult>;
    },

    async getActivities(
      simulationRunId: string,
      init?: { readonly signal?: AbortSignal },
    ): Promise<ActivitiesApiResult> {
      return authorizedFetch(
        `/api/v1/simulation-runs/${encodeURIComponent(simulationRunId)}/activities`,
        init?.signal ? { signal: init.signal } : {},
      ) as Promise<ActivitiesApiResult>;
    },

    async getCompletedHistory(
      simulationRunId: string,
      init?: { readonly signal?: AbortSignal },
    ): Promise<CompletedHistoryApiResult> {
      return authorizedFetch(
        `/api/v1/simulation-runs/${encodeURIComponent(simulationRunId)}/completed-history`,
        init?.signal ? { signal: init.signal } : {},
      ) as Promise<CompletedHistoryApiResult>;
    },

    async submitDecision(input: {
      readonly simulationRunId: string;
      readonly commandId: string;
      readonly correlationId: string;
      readonly expectedAggregateVersion: number;
      readonly decisionId: string;
      readonly optionId: string;
      readonly rationale?: string;
    }): Promise<SubmitDecisionReceiptResult> {
      return authorizedFetch(
        `/api/v1/simulation-runs/${encodeURIComponent(input.simulationRunId)}/commands/submit-decision`,
        {
          method: "POST",
          correlationId: input.correlationId,
          idempotencyKey: input.commandId,
          ifMatch: `"${input.expectedAggregateVersion}"`,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            commandId: input.commandId,
            commandType: "SubmitDecision",
            commandVersion: 1,
            expectedAggregateVersion: input.expectedAggregateVersion,
            payload: {
              decisionId: input.decisionId,
              optionId: input.optionId,
              ...(input.rationale !== undefined
                ? { rationale: input.rationale }
                : {}),
            },
          }),
        },
      ) as Promise<SubmitDecisionReceiptResult>;
    },

    async completeActivity(input: {
      readonly simulationRunId: string;
      readonly commandId: string;
      readonly correlationId: string;
      readonly expectedAggregateVersion: number;
      readonly activityId: string;
    }): Promise<SubmitDecisionReceiptResult> {
      return authorizedFetch(
        `/api/v1/simulation-runs/${encodeURIComponent(input.simulationRunId)}/commands/complete-activity`,
        {
          method: "POST",
          correlationId: input.correlationId,
          idempotencyKey: input.commandId,
          ifMatch: `"${input.expectedAggregateVersion}"`,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            commandId: input.commandId,
            commandType: "CompleteActivity",
            commandVersion: 1,
            expectedAggregateVersion: input.expectedAggregateVersion,
            payload: { activityId: input.activityId },
          }),
        },
      ) as Promise<SubmitDecisionReceiptResult>;
    },

    async startMeeting(input: {
      readonly simulationRunId: string;
      readonly commandId: string;
      readonly correlationId: string;
      readonly expectedAggregateVersion: number;
      readonly meetingId: string;
    }): Promise<SubmitDecisionReceiptResult> {
      return authorizedFetch(
        `/api/v1/simulation-runs/${encodeURIComponent(input.simulationRunId)}/commands/start-meeting`,
        {
          method: "POST",
          correlationId: input.correlationId,
          idempotencyKey: input.commandId,
          ifMatch: `"${input.expectedAggregateVersion}"`,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            commandId: input.commandId,
            commandType: "StartMeeting",
            commandVersion: 1,
            expectedAggregateVersion: input.expectedAggregateVersion,
            payload: { meetingId: input.meetingId },
          }),
        },
      ) as Promise<SubmitDecisionReceiptResult>;
    },

    async completeMeeting(input: {
      readonly simulationRunId: string;
      readonly commandId: string;
      readonly correlationId: string;
      readonly expectedAggregateVersion: number;
      readonly meetingId: string;
    }): Promise<SubmitDecisionReceiptResult> {
      return authorizedFetch(
        `/api/v1/simulation-runs/${encodeURIComponent(input.simulationRunId)}/commands/complete-meeting`,
        {
          method: "POST",
          correlationId: input.correlationId,
          idempotencyKey: input.commandId,
          ifMatch: `"${input.expectedAggregateVersion}"`,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            commandId: input.commandId,
            commandType: "CompleteMeeting",
            commandVersion: 1,
            expectedAggregateVersion: input.expectedAggregateVersion,
            payload: { meetingId: input.meetingId },
          }),
        },
      ) as Promise<SubmitDecisionReceiptResult>;
    },

    async completeChapter(input: {
      readonly simulationRunId: string;
      readonly commandId: string;
      readonly correlationId: string;
      readonly expectedAggregateVersion: number;
      readonly chapterId?: string;
    }): Promise<
      SubmitDecisionReceiptResult & {
        readonly data: SubmitDecisionReceiptResult["data"] & {
          readonly chapterId: string;
          readonly nextChapterId: string | null;
          readonly endingNotificationId: string | null;
        };
      }
    > {
      return authorizedFetch(
        `/api/v1/simulation-runs/${encodeURIComponent(input.simulationRunId)}/commands/complete-chapter`,
        {
          method: "POST",
          correlationId: input.correlationId,
          idempotencyKey: input.commandId,
          ifMatch: `"${input.expectedAggregateVersion}"`,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            commandId: input.commandId,
            commandType: "CompleteChapter",
            commandVersion: 1,
            expectedAggregateVersion: input.expectedAggregateVersion,
            payload: {
              ...(input.chapterId !== undefined
                ? { chapterId: input.chapterId }
                : {}),
            },
          }),
        },
      ) as Promise<
        SubmitDecisionReceiptResult & {
          readonly data: SubmitDecisionReceiptResult["data"] & {
            readonly chapterId: string;
            readonly nextChapterId: string | null;
            readonly endingNotificationId: string | null;
          };
        }
      >;
    },

    async listBusinessCases(init?: {
      readonly locale?: string;
      readonly signal?: AbortSignal;
    }): Promise<BusinessCaseListApiResult> {
      const locale = init?.locale ?? "en-US";
      const query = new URLSearchParams({ locale });
      return authorizedFetch(
        `/api/v1/business-cases?${query.toString()}`,
        init?.signal ? { signal: init.signal } : {},
      ) as Promise<BusinessCaseListApiResult>;
    },

    async getBusinessCase(
      businessCaseId: string,
      init?: {
        readonly locale?: string;
        readonly version?: string;
        readonly signal?: AbortSignal;
      },
    ): Promise<BusinessCaseDetailsApiResult> {
      const params = new URLSearchParams({
        locale: init?.locale ?? "en-US",
      });
      if (init?.version !== undefined) {
        params.set("version", init.version);
      }
      return authorizedFetch(
        `/api/v1/business-cases/${encodeURIComponent(businessCaseId)}?${params.toString()}`,
        init?.signal ? { signal: init.signal } : {},
      ) as Promise<BusinessCaseDetailsApiResult>;
    },

    /**
     * Creates a simulation run from a selectable business case.
     * Request body matches POST /api/v1/simulation-runs (no Idempotency-Key required).
     */
    async createSimulationRun(input: {
      readonly businessCaseId: string;
      readonly experienceLevel: ExperienceLevel;
      readonly commandId?: string;
      readonly correlationId?: string;
      readonly contentPackageVersionId?: string;
      readonly simulationRunId?: string;
    }): Promise<CreateSimulationRunApiResult> {
      void input.commandId;
      return authorizedFetch(`/api/v1/simulation-runs`, {
        method: "POST",
        ...(input.correlationId !== undefined
          ? { correlationId: input.correlationId }
          : {}),
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessCaseId: input.businessCaseId,
          experienceLevel: input.experienceLevel,
          ...(input.simulationRunId !== undefined
            ? { simulationRunId: input.simulationRunId }
            : {}),
          ...(input.contentPackageVersionId !== undefined
            ? { contentPackageVersionId: input.contentPackageVersionId }
            : {}),
        }),
      }) as Promise<CreateSimulationRunApiResult>;
    },
  };
};

export type ApiClient = ReturnType<typeof createApiClient>;
