import { beforeEach, afterEach, expect, it, vi } from "vitest";
import { startWorkflowRuntime, stopWorkflowRuntime, isWorkflowRuntimeCurrent } from "./workflowRuntime";

let listeners;
beforeEach(() => {
  vi.useFakeTimers();
  listeners = new Map();
  vi.stubGlobal("document", { visibilityState: "visible", addEventListener: (name, fn) => listeners.set(name, fn), removeEventListener: (name) => listeners.delete(name) });
});
afterEach(() => { stopWorkflowRuntime(); vi.useRealTimers(); vi.unstubAllGlobals(); });
it("keeps a running workflow alive when the document is hidden", async () => {
  const interrupted = vi.fn();
  startWorkflowRuntime(interrupted);
  document.visibilityState = "hidden";
  listeners.get("visibilitychange")?.();
  await vi.advanceTimersByTimeAsync(5000);
  expect(isWorkflowRuntimeCurrent()).toBe(true);
  expect(interrupted).not.toHaveBeenCalled();
});
it("rejects stale work after the browser suspends execution", () => {
  const interrupted = vi.fn();
  startWorkflowRuntime(interrupted);
  vi.setSystemTime(Date.now() + 60000);
  expect(isWorkflowRuntimeCurrent()).toBe(false);
  expect(interrupted).toHaveBeenCalledOnce();
});
it("releases a wake lock granted after the workflow was already stopped", async () => {
  let grant;
  const release = vi.fn(async () => {});
  vi.stubGlobal("navigator", { wakeLock: { request: () => new Promise((resolve) => { grant = resolve; }) } });
  startWorkflowRuntime(() => {});
  stopWorkflowRuntime();
  grant({ release });
  await vi.advanceTimersByTimeAsync(0);
  expect(release).toHaveBeenCalledOnce();
});
it("reacquires the screen lock on returning to a visible document", async () => {
  const request = vi.fn(async () => ({ released: false, release: async () => {} }));
  vi.stubGlobal("navigator", { wakeLock: { request } });
  startWorkflowRuntime(() => {});
  await vi.advanceTimersByTimeAsync(0);
  // The browser releases its lock when hidden. Simulate that sentinel state.
  (await request.mock.results[0].value).released = true;
  document.visibilityState = "visible";
  listeners.get("visibilitychange")();
  await vi.advanceTimersByTimeAsync(0);
  expect(request).toHaveBeenCalledTimes(2);
});
