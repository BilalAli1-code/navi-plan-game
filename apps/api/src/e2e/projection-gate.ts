/**
 * Opt-in E2E projection gate (PS-ROADMAP-008).
 * Enabled only when PROJECTSIM_ENABLE_E2E_SEAMS=1 and NODE_ENV !== production.
 * Preserves production semantics: hold delays real get/rebuild; fail_rebuild
 * returns retained cache with freshness rebuild_failed.
 */

export type ProjectionGateMode = "open" | "hold" | "fail_rebuild";

export interface ProjectionGateState {
  mode: ProjectionGateMode;
}

const state: ProjectionGateState = { mode: "open" };

const waiters: Array<() => void> = [];

export const getProjectionGate = (): ProjectionGateState => ({ ...state });

export const setProjectionGate = (mode: ProjectionGateMode): void => {
  state.mode = mode;
  if (mode === "open") {
    const pending = waiters.splice(0, waiters.length);
    for (const resolve of pending) {
      resolve();
    }
  }
};

export const resetProjectionGate = (): void => {
  setProjectionGate("open");
};

/** Block until the gate is open (used by hold mode). */
export const waitForProjectionGateOpen = async (
  timeoutMs: number,
): Promise<void> => {
  if (state.mode === "open") {
    return;
  }
  await new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => {
      const index = waiters.indexOf(onOpen);
      if (index >= 0) {
        waiters.splice(index, 1);
      }
      reject(
        new Error(
          `Projection gate remained in mode '${state.mode}' for ${timeoutMs}ms`,
        ),
      );
    }, timeoutMs);
    const onOpen = () => {
      clearTimeout(timer);
      resolve();
    };
    waiters.push(onOpen);
  });
};

export const e2eSeamsEnabled = (
  env: NodeJS.ProcessEnv = process.env,
): boolean =>
  (env.NODE_ENV ?? "development") !== "production" &&
  env.PROJECTSIM_ENABLE_E2E_SEAMS === "1";
