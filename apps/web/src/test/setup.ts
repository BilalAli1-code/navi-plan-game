import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// Testing Library does not auto-clean the DOM when Vitest `globals` is disabled.
afterEach(() => {
  cleanup();
});
