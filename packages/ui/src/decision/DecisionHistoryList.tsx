import type { DecisionHistoryView } from "./types";

export interface DecisionHistoryListProps {
  readonly items: readonly DecisionHistoryView[];
}

export function DecisionHistoryList({ items }: DecisionHistoryListProps) {
  if (items.length === 0) {
    return (
      <p className="ps-empty" role="status">
        No decisions submitted yet.
      </p>
    );
  }
  return (
    <ol className="ps-decision-history">
      {items.map((item) => (
        <li key={item.decisionRecordId}>
          <article>
            <h3>Decision {item.decisionDefinitionId}</h3>
            <p>
              Status: <strong>{item.status}</strong>
            </p>
            <p>Selected: {item.selectedOptionLabel ?? item.selectedOptionId}</p>
            <p>Submitted: {item.submittedAt}</p>
            {item.resolvedAt ? <p>Resolved: {item.resolvedAt}</p> : null}
            {item.qualityClassification === null ? (
              <p>Quality classification: none</p>
            ) : (
              <p>Quality classification: {item.qualityClassification}</p>
            )}
            {item.publicResultSummary ? (
              <p>{item.publicResultSummary}</p>
            ) : null}
          </article>
        </li>
      ))}
    </ol>
  );
}
