# Pulse Canvas
Paint with the rhythm of your body.

**Status:** project definition complete; implementation and live hardware validation have not started.

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

Initial target: macOS Apple Silicon. No remote server, database, Python runtime or cloud gallery is required for the MVP. Exact dependency versions will be pinned after the live SDK and packaging feasibility spike.

## Prerequisites
- A supported camera and Mac with Apple Silicon.
- Node.js 24 LTS and npm for development; Electron's embedded Node compatibility must also be checked.
- A Presage developer account, personal API key and sufficient trial allowance.
- A consenting adult for the live demonstration.

There are no application setup commands yet because a runnable application has not been implemented. Never publish API keys or personal recordings in this repository.

## Delivery gates
1. Verify live pulse acquisition and packaged native SDK loading.
2. Build consent, session controls, one painting, three palettes and PNG export.
3. Verify stale-signal handling, camera cleanup, accessibility and privacy.
4. Add optional breathing and sound if the core path is reliable.
5. Record a real live demonstration and publish an English DEV submission.

A clearly labelled simulation mode will support development and exploration. It cannot replace the required live contest demonstration.

## Planned data handling
The app will keep signals in memory, avoid recording/uploading camera footage, disable SDK telemetry, and export artwork without images of the user or physiological metadata. Presage authentication still requires network access. These behaviors must be verified before release.

This is a creative art experience. It does not assess health, diagnose conditions or monitor sleep.

## Official resources
- [Presage SDK](https://smartspectra.presagetech.com/docs/nodejs)
- [Device readiness](https://smartspectra.presagetech.com/docs/nodejs/device-readiness)
- [SDK telemetry and privacy](https://smartspectra.presagetech.com/docs/telemetry-and-privacy/)
- [Contest requirements](https://dev.to/challenges/presage-2026-11-04)
