# Volcano control audit — 2026-09-10

## Error 03r and scope

S&B lists ERR 03r as operation at an incorrect mains voltage and asks users to check the 115 V / 230 V device version against the supply. ERR 02r is the separately documented temperature/overheating fault. These descriptions do not establish the underlying component failure in a particular unit. This code review cannot establish that Onyx caused, or did not cause, hardware damage; a recurring 03r, including without the app, needs manufacturer diagnosis. No physical device was connected or operated during this work.

Sources:
- [S&B Volcano Hybrid instructions, troubleshooting table](https://storz-bickel.com/en/amfile/file/download/file/40/product/574/)
- [S&B temperature settings: 40–230 °C](https://support.storz-bickel.com/hc/en-us/articles/36238897285393-Temperature-Settings)

## Corrected control defects

- Heater ON could overtake a new target write. Both normal and minimalist controls now use the same ordered, validated command path. A failed target write never schedules ON.
- Pending/debounced temperature changes could survive an OFF or overwrite a newer dial selection. Workflow generations and shared temperature intent IDs invalidate superseded work before sending it.
- Manual temperature takeover could delete a timed pump OFF without stopping the pump. A takeover now stops the old workflow outputs first.
- Workflow cancellation previously stopped only the pump. Cancellation now independently attempts HEAT OFF and AIR OFF, ahead of ordinary work. Failures retain a visible error and block new activation until reconnect.
- Workflow heat monitoring retried ON during startup and restored lowered target temperatures. It now observes fresh status/temperature/target values, never retries ON automatically, and aborts on a device stop, changed target, invalid reading, or failed operation.
- Device status listeners depended on which components were mounted, missing subscriptions after connection and leaking listeners across layouts. Initial reads and subscriptions now belong to the connection and are serialized with all other GATT work. Invalid notifications fault the controls.
- Failed cache discovery exposed a partial connection. The cache is published atomically only after successful discovery; failure clears it and disconnects.
- Clearing the command queue released its worker while old GATT work was still pending. Worker ownership now survives cancellation. Queue failure invalidates old workflows and attempts shutdown. A 15-second stuck-operation timeout reports failure without starting overlapping GATT requests. Cancelled queued connection setup rejects its waiting promise instead of leaving the UI stuck.
- Malformed configuration could start heat, overflow timer delays, or encode invalid numbers as different BLE values. Runtime/import validation rejects invalid targets, nonnumeric stored values, nonfinite/out-of-range durations, and invalid integer encodings. Temperature commands remain Celsius internally; JSON validation does not reinterpret them using the display unit. Automatic-shutoff writes are restricted to the existing UI range of 5–360 minutes.
- Device switches no longer optimistically display OFF before the command succeeds. Blocking workflow dialogs have been replaced with a nonblocking Continue/Stop notice.
- The old automatic-heating-on-connect option has been removed from settings and the legacy loader. Connecting never intentionally activates heat or air.

## Background operation and the Galaxy S25 Ultra

Workflows continue when the page becomes hidden, provided Chrome and Android keep executing it. A screen wake lock is requested while a workflow runs and the page is visible, reacquired after returning, and released when the workflow finishes or is cancelled. No silent-audio or service-worker workaround is used.

A screen wake lock prevents automatic screen sleep; it cannot override the lock button, battery policy, or process suspension. Frozen pages cannot execute ordinary JavaScript timers. PWA installation does not provide a native Android Bluetooth foreground service. Consequently, uninterrupted Bluetooth commands with the S25 Ultra screen locked are **not guaranteed or verified** by this change.

The runtime detects a scheduling gap longer than 10 seconds, freeze/pagehide events, and a six-hour workflow limit. It invalidates remaining commands and requests output shutdown, rather than replaying old commands after waking. Timers may already have been delayed before detection; commands cannot be sent while the browser or Bluetooth stack is suspended. The device's own firmware and automatic shutdown remain necessary safeguards.

The limits above, the 15-minute heat-step timeout, and the six-hour duration cap are application policies, not manufacturer-certified hardware protection thresholds. Workflow completion preserves its explicitly programmed final output state; a workflow ending with HEAT ON can leave heating enabled. Use a HEAT OFF step when shutdown on completion is intended.

A reliable locked-screen implementation requires a native Android component owning the BLE connection and scheduling (for example, a connected-device foreground service), followed by real-device testing. That component is not part of this web application change.

Sources:
- [Chrome page lifecycle: suspension and frozen timers](https://developer.chrome.com/docs/web-platform/page-lifecycle-api)
- [Screen Wake Lock API](https://developer.chrome.com/docs/capabilities/web-apis/wake-lock)
- [Android BLE background communication](https://developer.android.com/develop/connectivity/bluetooth/ble/background)

## Verification and practical limits

### Follow-up: workflow startup and step display

A delayed acknowledgement of the app's startup HEAT OFF could cancel the replacement workflow after its first temperature write. Telemetry retained a private "heater previously on" value even though the completed OFF command had updated Redux. Status transitions now use the shared heater state, so that acknowledgement does not look like a new physical stop. An observed ON followed by device OFF still cancels the workflow. Regression tests exercise the real workflow queue together with telemetry notifications, including the subsequent pump and shutdown steps.

The header now uses one circle: workflow steps while running, automatic-shutoff time otherwise. A DOM integration test checks step updates and restoration on completion; the expanded display's positioning timer is cleared on unmount. Mobile visual checks use simulated state without connecting to a device.

The follow-up verification passed 104 tests in 13 files, including the DOM test using the development-only jsdom dependency.

Regression tests use simulated Bluetooth characteristics, failure injection, delayed promises, and fake clocks. They cover normal completion, cancellation, startup/shutdown races, invalid configuration, connection cleanup, blocked activation, timer suspension, wake-lock release/reacquisition, and queue serialization. No tests heat a physical device.

The application and the error/pause notices were inspected in a 412 × 915 browser viewport. Theme colors are reused, and existing PrideText rendering is preserved. Browser viewport testing is not a physical S25 Ultra test.

`npm test` and `npm run build` are the release checks. Repository-wide ESLint has pre-existing failures; comparing diagnostics in changed files against HEAD showed no additional lint errors. Existing build warnings include a duplicate style prop in WorkflowItemDrag, bundle size, and old Browserslist data.

The initial safety-audit verification passed 101 tests in 12 files and built the production/PWA assets. Full lint reported 240 errors and 88 warnings; the changed-file comparison retained the same 10 pre-existing errors. The GitHub Pages deployment now runs the regression tests before building.

Before relying on locked-screen behavior, reproduce with a BLE simulator or a manufacturer-cleared device under supervision: compare foreground, app switching, and screen locking; inspect actual HEAT/AIR status and the interrupted-workflow notice on return. Do not use a device showing recurring 03r for unattended or stress testing. A successful BLE write acknowledges a command, not physical shutdown, and this review is not a guarantee of bug-free software or device safety.
