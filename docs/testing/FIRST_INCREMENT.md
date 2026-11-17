# First increment verification

## Automated checks
- TypeScript type checking.
- Stable-signal and confidence validation, invalid sample rejection, operating-range boundaries.
- Duplicate/out-of-order timestamp handling, stale values, invalidation and source identity.
- Simulation lifecycle and teardown; cancellation while startup is pending.
- Missing credentials do not fall back to simulation.
- Limited device readiness does not start capture.
- Two-minute live budget with an injected SDK; no automatic restart.
- API-key changes are rejected during a running session.
- Consent UI, missing-key blocking and clearing the session-only key field.
- PNG payload and dimension validation before native decoding.

## Manual desktop evidence
Platform: macOS Apple Silicon. Development commands ran with Node 22.22.2; Node 24 remains the recommended development runtime and the CI target. Electron provides its own embedded runtime.

Observed in the packaged app:
- The window renders the English interface and three palettes.
- Start is disabled before simulation acknowledgement.
- Simulation produces generated BPM values and accumulated ribbon marks.
- Pause stops mark generation and retains the artwork.
- Native save dialog exports a 1200 x 1200 PNG.
- The exported PNG contains IHDR, IDAT and IEND chunks only; no text metadata or camera image is included.

The Presage 3.5.0 module loads on darwin-arm64. Camera enumeration and live measurement require separate validation in the packaged app.

## Dependency review
The runtime-only npm audit reported zero vulnerabilities. The complete audit reported 25 findings propagated through development tooling, rooted in picomatch and uuid advisories. The currently published picomatch latest version is still within the reported affected range. Do not use a forced downgrade as a substitute for compatibility review; track remediation in a separate maintenance increment.

## Pending
- Real Presage authentication, device readiness, live signal cadence and camera teardown.
- Final session-only access field and budget behavior against an actual live session.
- Full keyboard traversal, reduced-motion behavior and additional window sizes.
- Clean-machine setup and signing/notarization if downloadable releases are added.
- CI completion after publication.

## Manual regression checklist
- [ ] Launch the packaged app and confirm it shows no camera capture in simulation.
- [ ] Acknowledge simulation and create marks; pause and verify the mark counter stops.
- [ ] Export a PNG and open it; cancel an export without changing the artwork.
- [ ] Clear the canvas and select a different palette.
- [ ] Select Live without a configured key; confirm Start stays disabled.
- [ ] Paste a personal API key in the masked field; confirm the field is cleared and no key appears in UI status.
- [ ] With explicit consent, start one short live test, record the readiness outcome and stop.
- [ ] Confirm Stop, Pause and window close release the camera.
- [ ] Confirm the two-minute limit ends capture and does not restart it.

No personal recordings, keys or physiological logs belong in this report.
