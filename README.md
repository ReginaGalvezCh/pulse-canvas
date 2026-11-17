# Pulse Canvas
Paint with the rhythm of your body.

**Status: concept and implementation plan. No runnable application or live SDK integration yet.**

An individual creative coding project by Regina Gálvez for the [Presage SmartSpectra SDK Challenge](https://dev.to/challenges/presage-2026-11-04). AI-assisted development will be disclosed in the submission.

## Experience
Choose a palette, explicitly enable the camera, wait for a usable live signal, and create a short abstract artwork. Save only the artwork as a PNG. Camera access and sound are optional and independently controlled.

- Live pulse rate controls the tempo of paint marks.
- Live breathing trace modulates stroke expansion, when available.
- Palette and composition remain creative choices; no emotion, stress, or health assessment.
- Missing, stale, or low-confidence signals pause signal-driven painting and show a clear explanation.
- A separately labelled simulation mode will allow interface exploration without a camera. It cannot count as the live contest demonstration.

**Timing distinction:** pulse rate is a rate estimate, not an event for each measured heartbeat. A rhythm generated from BPM must be labelled as synthesized from the current estimated rate; do not present it as exact heartbeat synchronization. Only consider beat-level effects after verifying a suitable SDK waveform and timing.

## Proposed integrations
| Component | Purpose | Priority |
| --- | --- | --- |
| Presage SmartSpectra Node SDK | Required live pulse/breathing source | Core |
| Electron + TypeScript | Desktop shell and native SDK bridge | Core |
| p5.js | Generative canvas and PNG export | Core |
| Tone.js | Optional synthesized sound responding to the same signal | After live visual path works |
| MediaPipe Hand Landmarker | Optional hand-directed brush | Research only: movement may reduce pulse signal quality |
| GitHub | Public source, documentation and development history | Repository created |

Start with local artwork export. No accounts, cloud gallery, external generative AI, or uploads are needed for the first version.

## What is needed
- Supported camera and a Mac with Apple Silicon (initial target).
- Node.js >=20; the SDK documentation recommends Node 24 LTS. Electron >=28.
- Presage developer account, API key and sufficient trial allowance.
- A first live readiness and measurement check on the actual computer.
- A consenting adult for the demonstration.
- Public source with reproducible setup instructions, a demo video and a DEV post in English using the official template and `presagechallenge` tag.

SDK access and trial quotas must be checked before committing to delivery. The repository does not contain an API key. Do not paste keys into issues or commits.

## Implementation sequence
1. Verify supported Node, camera readiness, authentication and live pulse output on the actual Mac.
2. Build a normalized signal adapter (value, timestamp, confidence, source and validity). Discard stale/invalid data.
3. Implement a single p5.js composition controlled by the live rate, with start, stop, palette, signal status and PNG export.
4. Add breathing modulation if stable on the target hardware.
5. Add opt-in Tone.js audio, volume and mute only after the visual experience works.
6. Verify consent, camera teardown, signal-loss behavior, export privacy and reproducible setup.
7. Record live demonstration and write the DEV submission.

## Planned privacy behavior — not implemented yet
- Explicit camera consent before capture; stop releases the camera.
- No application recording, upload or persistence of camera frames or physiological history.
- Keep working signal values in memory only.
- Export artwork without face imagery, pulse numbers or raw physiological metadata.
- Configure SmartSpectra with `enableTelemetry: false`; the SDK otherwise enables telemetry by default.
- SDK authentication/subscription checks still require network access. Do not claim the app is fully offline.
- Do not enable optional LLM Insights or other AI services for the initial version.
- Verify actual SDK behavior and update this section before publishing a runnable release.

This is an art experience, not a medical device or a sleep/apnea monitor.

## References
- [SDK overview and supported platforms](https://smartspectra.presagetech.com/docs/nodejs)
- [Metrics and payloads](https://smartspectra.presagetech.com/docs/nodejs/metrics)
- [Telemetry and privacy](https://smartspectra.presagetech.com/docs/telemetry-and-privacy/)
- [p5.js PNG export](https://p5js.org/reference/p5/saveCanvas/)
- [Tone.js](https://tonejs.github.io/)
- [MediaPipe Hand Landmarker](https://developers.google.com/edge/mediapipe/solutions/vision/hand_landmarker?tab=Web)

## En español
Pulse Canvas transforma una señal de pulso en el ritmo de una pintura abstracta y, si la señal lo permite, la respiración en la expansión de los trazos. La primera versión se plantea para escritorio, con exportación local y sin galería pública. Este repositorio contiene por ahora el concepto y el plan; la integración real está pendiente.
