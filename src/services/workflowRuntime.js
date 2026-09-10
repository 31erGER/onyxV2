// Screen Wake Lock prevents automatic screen sleep while the page is visible.
// It cannot override a user screen lock or Android/Chrome process suspension.
let run;

export function stopWorkflowRuntime() {
  if (!run) return;
  const previous = run;
  run = undefined;
  clearInterval(previous.interval);
  globalThis.document?.removeEventListener("visibilitychange", previous.visible);
  globalThis.document?.removeEventListener("freeze", previous.interrupt);
  globalThis.window?.removeEventListener?.("pagehide", previous.interrupt);
  previous.lock?.release().catch(() => {});
}

export function isWorkflowRuntimeCurrent() {
  if (!run) return false;
  // Application limits: do not replay device operations after a long scheduling
  // gap, or let a loop keep resetting the firmware's auto-off indefinitely.
  if (Date.now() - run.lastTick > 10000 || Date.now() - run.startedAt > 6 * 60 * 60 * 1000) {
    run.interrupt();
    return false;
  }
  return true;
}

export function startWorkflowRuntime(onInterrupted) {
  stopWorkflowRuntime();
  const current = { startedAt: Date.now(), lastTick: Date.now(), lock: null, requesting: false };
  run = current;
  current.interrupt = () => {
    if (run !== current) return;
    stopWorkflowRuntime();
    onInterrupted();
  };
  current.visible = async () => {
    if (run !== current || globalThis.document?.visibilityState !== "visible" ||
        current.requesting || (current.lock && !current.lock.released) || !navigator.wakeLock?.request) return;
    current.requesting = true;
    try {
      const lock = await navigator.wakeLock.request("screen");
      if (run !== current) await lock.release();
      else current.lock = lock;
    } catch {
      // Unsupported, denied, or power saving. Runtime checks remain active.
    } finally { current.requesting = false; }
  };
  current.interval = setInterval(() => {
    if (isWorkflowRuntimeCurrent()) current.lastTick = Date.now();
  }, 1000);
  globalThis.document?.addEventListener("visibilitychange", current.visible);
  globalThis.document?.addEventListener("freeze", current.interrupt);
  globalThis.window?.addEventListener?.("pagehide", current.interrupt);
  current.visible();
}
