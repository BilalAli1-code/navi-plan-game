import type { AvailableDecisionOptionView } from "./types";

export interface DecisionOptionGroupProps {
  readonly decisionId: string;
  readonly options: readonly AvailableDecisionOptionView[];
  readonly selectedOptionId: string | null;
  readonly disabled?: boolean;
  readonly onSelect: (optionId: string) => void;
}

export function DecisionOptionGroup({
  decisionId,
  options,
  selectedOptionId,
  disabled = false,
  onSelect,
}: DecisionOptionGroupProps) {
  const name = `decision-options-${decisionId}`;
  return (
    <fieldset className="ps-decision-options" disabled={disabled}>
      <legend>Options</legend>
      <div role="radiogroup" aria-label="Decision options">
        {options.map((option) => {
          const inputId = `${name}-${option.optionId}`;
          return (
            <label
              key={option.optionId}
              htmlFor={inputId}
              className="ps-option"
            >
              <input
                id={inputId}
                type="radio"
                name={name}
                value={option.optionId}
                checked={selectedOptionId === option.optionId}
                disabled={disabled}
                onChange={() => onSelect(option.optionId)}
              />
              <span>{option.label}</span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
