# ADR 001: First desktop prototype and session-only access

Status: implemented baseline; live acquisition pending validation.

## Decisions
- React 19, p5.js 2, Electron 45 and Presage Node SDK 3.5.0 are pinned in package-lock.json.
- TypeScript 6 is selected because the installed ts-loader uses the legacy compiler API; TypeScript 7 does not expose that API through its normal entry point. This incompatibility was observed during packaging.
- Forge 8 emits `.webpack/main/index.cjs`; package.json points to that exact entry.
- SDK packages remain external to the main bundle and outside ASAR. The build whitelist excludes local secrets, recordings and source files. No bundled binary has been published.
- The first native adapter uses the documented main-process camera path. A browser-owned camera preview is not implemented. Actual live readiness and capture must be validated on the target Mac.
- To support a nontechnical setup flow, the renderer provides a masked, session-only API-key input. The key crosses a write-only validated IPC method once, is removed from form state, and is then held by the main service. JavaScript strings cannot be guaranteed to be physically erased from memory. There is no read-back API or persistent key storage.
- A gitignored `.env` is supported only for development. Packaged apps use the session-only field.
- Pause maps to stopping and destroying the source while retaining the canvas. Resume creates a fresh session. There is no background capture during pause.
- The pulse gate uses the SDK's documented stable flag, confidence >=40 on its 0–100 scale, and documented 40–110 BPM operating range. It does not classify the user's health.
- A five-second receipt-age limit is provisional until live cadence is measured. Duplicate or out-of-order sample timestamps do not refresh it; wall-clock rollback invalidates freshness.
- Marks are synthesized from a rate estimate, never presented as individual detected beats.
- Optional breathing, audio and hand tracking are deferred.

## Zero-cost constraint
The owner requires USD 0 spend. No upgrade or payment workflow is part of the app. Each live capture stops after two minutes, including acquisition time, with no automatic retry. The limit is local usage control, not a guarantee of provider billing. Check the actual account allowance before testing; do not assume the account or remaining credits can be inferred from possession of a key.

## Consequences
The local UI and export can be reviewed without consuming measurement credits. A valid personal key, consent and a ready device are all required for a real measurement. A successful simulation or SDK module load is not proof of a live integration.
