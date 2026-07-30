/**
 * Localized learner-facing text (BC-003).
 */

import type { ExperienceLevel } from "./enums";
import type { LocaleCode } from "./ids";

export interface LocalizedText {
  readonly values: Readonly<Record<string, string>>;
}

export interface ExperienceVariant<T> {
  readonly default: T;
  readonly explorer?: T;
  readonly practitioner?: T;
  readonly leader?: T;
}

export const localizedText = (
  enUs: string,
  extra: Readonly<Record<string, string>> = {},
): LocalizedText => ({
  values: { "en-US": enUs, ...extra },
});

export const resolveLocalizedText = (
  text: LocalizedText,
  locale: LocaleCode | string,
  fallbackLocale = "en-US",
): string | null => {
  const direct = text.values[locale];
  if (typeof direct === "string" && direct.trim().length > 0) {
    return direct;
  }
  const fallback = text.values[fallbackLocale];
  if (typeof fallback === "string" && fallback.trim().length > 0) {
    return fallback;
  }
  return null;
};

export const resolveExperienceVariant = <T>(
  variant: ExperienceVariant<T>,
  level: ExperienceLevel,
): T => {
  if (level === "explorer" && variant.explorer !== undefined) {
    return variant.explorer;
  }
  if (level === "practitioner" && variant.practitioner !== undefined) {
    return variant.practitioner;
  }
  if (level === "leader" && variant.leader !== undefined) {
    return variant.leader;
  }
  return variant.default;
};
