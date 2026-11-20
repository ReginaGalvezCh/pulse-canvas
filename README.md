# Pulse Canvas
Paint with the rhythm of your body.

**Status:** the packaged macOS Apple Silicon app has generated a painting from real Presage pulse estimates. Live readiness, signal-driven marks, camera teardown and PNG export were checked on November 20, 2026. Local type checking and 21 tests pass; other platforms have not been validated.

[Watch the live demo](https://github.com/ReginaGalvezCh/pulse-canvas/pull/5#issuecomment-7043169446) · [Verification report](docs/testing/LIVE_VERIFICATION.md) · [Published DEV submission](https://dev.to/reginagalvezch/pulse-canvas-painting-with-a-live-camera-derived-pulse-358)

Development is incremental on feature branches and PRs. See [CONTRIBUTING](CONTRIBUTING.md).

An individual creative coding project by Regina Gálvez for the [Presage SmartSpectra SDK Challenge](https://dev.to/challenges/presage-2026-11-04). AI-assisted development will be disclosed in the submission.

## Experience
Choose a palette, explicitly enable the camera, wait for a usable live pulse signal, and create an abstract painting. Export only the artwork as a PNG.

Pulse-rate estimates control a synthesized cadence of marks. This is not exact heartbeat synchronization. Breathing modulation and opt-in sound are stretch features.

## Scope and architecture
Read the [full project definition](docs/PROJECT_DEFINITION.md) for scope, architecture, process boundaries, technology rationale, privacy requirements, acceptance checks and milestones.

| Layer | Baseline |
| --- | --- |
| Interface | React, TypeScript, CSS Modules |
| Desktop and local services | Electron, Node.js, TypeScript |
| Live measurement | Presage SmartSpectra Node SDK |
| Painting | p5.js |
| Process contracts | Electron preload/IPC, Zod |
| Optional sound | Tone.js |
| Build and packaging | Electron Forge, Webpack TypeScript template |
| Verification | Vitest, React Testing Library, focused Playwright smoke tests |
| Automation | GitHub Actions |
| Storage | Session memory and explicit local PNG exports |

Initial target: macOS Apple Silicon. No remote server, database, Python runtime or cloud gallery is required for the MVP. Dependency versions are pinned in package-lock.json; the installed SDK is 3.5.0.

## Prerequisites
- A supported camera and Mac with Apple Silicon.
- Node.js 24 LTS and npm for development; Electron's embedded Node compatibility must also be checked.
- A Presage developer account, personal API key and sufficient trial allowance.
- A consenting adult for the live demonstration.

## Run locally

To reproduce the recorded version, start with the exact public demo commit. The default branch has not yet incorporated the stacked implementation PRs:

```sh
git clone https://github.com/ReginaGalvezCh/pulse-canvas.git
cd pulse-canvas
git checkout --detach e48be38625615d37b779126e4c13e3e96e831469
```

Then install and run the project:

```sh
npm ci
npm start
```

Use Node 24 LTS (recommended; see .nvmrc) or a supported Node >=22.12. Local verification used Node 22.22.2.

For Live mode, open **Live camera**, paste your personal **API key** from the Presage dashboard into the masked field and choose **Use this key**. Do not enter your account password. The key stays in memory for this app launch and is not saved. Then acknowledge camera use and start a short test. A key being configured does not mean it has authenticated successfully.

For development only, an alternative is copying .env.example to a gitignored .env and setting PRESAGE_API_KEY there before npm start. Never publish API keys or personal recordings.

```sh
npm run check
npm run package
```

The macOS package is created under out/. Open the package on the supported Mac:

```sh
open "out/Pulse Canvas-darwin-arm64/Pulse Canvas.app"
```

No signing/notarization or downloadable release is provided yet. The README at the immutable demo commit predates the successful live test; this branch and the verification report record that later result.

## Free-plan usage

The owner requires **USD 0 spend**. Stay on the Presage Free tier. Simulation never starts measurement. Live capture stops after two minutes and requires a manual restart; check remaining provider credits before live testing. This software limit is not an account-level billing guarantee. No upgrade or payment flow is implemented.

## Verification

Read the [live verification report](docs/testing/LIVE_VERIFICATION.md) for the exact demo source, successful live check and remaining publication steps. The [first increment report](docs/testing/FIRST_INCREMENT.md) preserves earlier simulation and packaging evidence.

## Delivery gates
1. Verify live pulse acquisition and packaged native SDK loading.
2. Build consent, session controls, one painting, three palettes and PNG export.
3. Verify stale-signal handling, camera cleanup, accessibility and privacy.
4. Add optional breathing and sound if the core path is reliable.
5. Record a real live demonstration and publish an English DEV submission.

A clearly labelled simulation mode will support development and exploration. It cannot replace the required live contest demonstration.

## Data handling
The implementation keeps signals in memory, does not record/upload camera footage, configures SDK telemetry off, and re-encodes exported PNG artwork without personal metadata. Presage authentication requires network access. The separately captured demo screen video was voluntarily shared for the challenge and visibly includes a current pulse estimate; it contains no camera image or key. The app does not create or upload that recording automatically.

This is a creative art experience. It does not assess health, diagnose conditions or monitor sleep.

## Official resources
- [Presage SDK](https://smartspectra.presagetech.com/docs/nodejs)
- [Device readiness](https://smartspectra.presagetech.com/docs/nodejs/device-readiness)
- [SDK telemetry and privacy](https://smartspectra.presagetech.com/docs/telemetry-and-privacy/)
- [Contest requirements](https://dev.to/challenges/presage-2026-11-04)
