# Pulse Canvas — Project Definition

## Status and intent
This is the selected technical baseline for implementation, with explicit feasibility gates. The creative concept and public repository were requested by Regina. Technology choices below are engineering recommendations made for that scope, not evidence of a validated integration.

Current state: a desktop prototype has been implemented and its simulation-to-PNG flow has been checked on macOS Apple Silicon. Real Presage capture has not yet been validated. See [ADR 001](decisions/001-desktop-prototype.md) and the [verification report](testing/FIRST_INCREMENT.md).

**Product:** a desktop creative experience that turns live camera-derived pulse rate into the rhythm of an abstract painting. Optional breathing modulation and sound enrich the same artwork.

**Primary user:** an adult who wants to create an expressive artwork during a short, intentional break.

**Product language:** English throughout the interface, code, documentation, issues and contest submission.

**Repository:** https://github.com/ReginaGalvezCh/pulse-canvas

## Delivery workflow and spending limit

Implementation uses dedicated feature/fix branches and pull requests; see [CONTRIBUTING](../CONTRIBUTING.md). The owner requires USD 0 spend: retain the Presage Free tier, use simulation during development, and cap live captures at two minutes with manual restart. No billing or upgrade flow is implemented.

## 1. MVP scope
A single-person, local desktop session on macOS Apple Silicon is the initial supported target.

The user:
1. Reads a short explanation of camera use and data handling.
2. Selects Live mode or an explicitly labelled Simulation mode.
3. In Live mode, provides their own Presage key for the session, selects a camera, consents and starts the readiness check.
4. Waits for a usable live pulse signal.
5. Chooses one of three curated palettes and watches a single generative composition evolve.
6. Pauses or stops the session at any time.
7. Exports the artwork as a PNG through a native save dialog.

### Required features
- Explicit consent, camera selection, readiness result and actionable errors.
- Real SmartSpectra pulse-rate input that meaningfully affects mark generation.
- Visible input source, signal validity and current session state.
- One polished painting algorithm, three palettes, clear/reset, start/pause/stop and PNG export.
- A simulation source for development and exploration, visibly identified at all times.
- Keyboard access, visible focus, readable status messages and reduced-motion support.
- Camera teardown and in-memory signal cleanup on stop, error and window close.
- Public setup instructions and a reproducible live demonstration.

### Stretch features, in order
1. Breathing trace changes stroke expansion if stable on the target hardware.
2. Opt-in Tone.js sound with volume and mute.
3. A second composition, only after all acceptance checks pass.

### Outside the MVP
- Infant monitoring, sleep analysis, apnea alerts, diagnosis or emotion/stress classification.
- Accounts, cloud gallery, social feeds, payment, multiplayer and background monitoring.
- Mobile apps and verified Windows/Linux distributions.
- Hand tracking, generated images, LLM interpretation and physiological history.
- A browser-only version claiming to provide the same native live SDK experience.
- Medical or therapeutic benefit claims.

## 2. End-to-end technology decisions

| Layer | Selected technology | Responsibility and rationale |
| --- | --- | --- |
| UI | React + TypeScript | Session controls, onboarding, consent, settings, errors and accessibility; a small component-based interface |
| Styling | CSS Modules + CSS custom properties | Scoped styles, palette tokens and reduced motion without a UI framework dependency |
| Desktop runtime | Electron | Native SDK access, desktop lifecycle, permissions and file saving |
| Local application services | Node.js in Electron main + TypeScript | SDK ownership, authentication, session state, validation, cleanup and export; this is the application's local backend |
| Live measurement | @smartspectra/node-sdk | Required Presage integration; request pulse rate explicitly |
| Process boundary | Electron contextBridge + allowlisted IPC | Narrow typed commands and validated events; no raw Node or generic IPC access in the UI |
| Painting | p5.js in instance mode | Own the canvas animation loop and generative composition independently of React rendering |
| Optional sound | Tone.js | Synthesized audio driven by the same accepted signal, enabled only by explicit interaction |
| Runtime validation | Zod | Validate commands and normalized signal payloads across the process boundary |
| State | Explicit TypeScript session state machine + React hooks/context | Keep legal transitions and source separation visible; no global state library initially |
| Development runtime | Node.js 24 LTS + npm | One package manager and lockfile; Electron's embedded Node version must also be checked |
| Build and packaging | Electron Forge + Webpack TypeScript template | One supported desktop build pipeline; preserve native SDK libraries outside the JS bundle |
| Tests | Vitest + React Testing Library; focused Playwright Electron smoke coverage | Signal logic, user behavior and process wiring; real-camera verification remains manual |
| Automation | GitHub Actions | Dependency install, type checking, unit tests and build validation without live credentials |
| Persistence | Session memory; explicit PNG files only | No database or physiological history in the MVP |
| Distribution | Public GitHub source; optional GitHub Release after packaging verification | Source-based setup is the required delivery path; a downloadable binary is optional |
| Project record | Notion + versioned GitHub documents | Notion for project overview/status; GitHub for implementation contracts and code |

Exact package versions will be selected and pinned together during the feasibility spike, with a committed package-lock.json. No unverified compatibility claim is made for a package combination. Use current supported stable releases; do not automatically adopt release candidates.

### React vs Angular
Choose React for this single-screen desktop experience and direct integration with an isolated p5 canvas. Angular is viable, but its additional application structure does not solve a current requirement. This is a project-fit decision, not a claim that Angular cannot support the app.

### Python and a remote backend
Python is not needed in the selected MVP: Presage has a documented Node/Electron path, and the application services run locally in Electron. A Python process would introduce another runtime, packaging path and IPC boundary without adding a required capability.

If a future requirement needs custom Python-only signal research, evaluate a separate Python worker with a versioned message contract. If a future product needs accounts, shared galleries or cross-device persistence, compare FastAPI and Node services in a new architecture decision. Neither is scheduled or provisioned now.

### Build choice
Electron Forge's Vite plugin is currently documented as experimental. Choose its Webpack TypeScript template for the initial native-integration path. Native SDK runtime files require explicit packaging verification; the generic native-unpack plugin alone is not proof that all SDK shared libraries are included.

## 3. Architecture and data flow

```text
Consenting adult + camera
            |
            v
Electron main process
  Presage SDK -> metric decoding -> signal validation
       |                              |
       |                              v
       |                       session state machine
       |                              |
       +-------- cleanup              v
                           narrow preload / IPC bridge
                                      |
                                      v
                            React renderer / controls
                                      |
                              accepted signal adapter
                                /               \
                               v                 v
                         p5.js canvas     optional Tone.js
                               |
                         PNG artwork bytes
                               |
                    validated export IPC command
                               |
                   main process native save dialog
                               |
                         user-selected file
```

### Process responsibilities
- Main owns the native SDK, camera lifecycle, API-key lifetime, readiness checks, signal validation and export.
- Preload exposes only documented application methods and subscription cleanup.
- Renderer owns presentation and painting, with a masked write-only key entry field. No filesystem, shell or key read-back access. See ADR 001 for the session-only credential boundary.
- Shared modules define schemas, states and signal-to-art mappings without Electron dependencies.
- Use the SDK's supported native camera input in the first spike. If camera preview or frame feeding requires a different supported path, record an amendment before implementing it. Do not open the camera twice.
- Authentication/subscription validation contacts Presage. The app must not be described as fully offline.

### Proposed application contract
Commands: checkReadiness, startSession, pauseSession, resumeSession, stopSession and saveArtwork.
Events: sessionStateChanged, acceptedSignal and sessionError.

The final API signatures must follow the installed SDK. These are application-level contracts, not claims about SDK method names. Validate sender, payload and session identity for every IPC command. No arbitrary channel names, paths or shell commands may cross the bridge.

A normalized signal contains:
- sessionId and source (live or simulation)
- signal type (pulseRate or breathingTrace)
- numeric value, unit and SDK timestamp
- local monotonic receipt time
- confidence/stability fields when provided
- validity state and rejection reason

Confidence handling follows the actual metric schema. Thresholds and staleness windows are established with the SDK and observed cadence in the spike, documented and covered with boundary tests. A rejected or stale sample cannot keep generating new signal-driven marks.

### Session lifecycle
idle -> consented -> checking -> acquiring -> painting.
Additional states: paused, signalLost, stopping, stopped and error.

Pause releases measurement/camera resources while keeping the artwork. Resume starts a fresh acquisition. Signal loss stops signal-driven mark generation immediately; old data is not replayed or used to catch up. Stop and window close release resources even if the SDK reports an error. Manual restart is required after terminal failures.

## 4. Artistic behavior
- Pulse-rate estimate controls a synthesized cadence of marks.
- Breathing trace, if available and valid, changes expansion or curvature.
- Palette selection is a creative choice, with no assignment of emotions to values.
- Do not use red/green health classifications, scores, goals or instructions to change the user's physiology.
- Pulse rate is not an exact heartbeat event. Label the effect as generated from the latest estimated rate; never claim each dot is a detected heartbeat.
- Cap effect intensity and smooth transitions for comfort. These are artistic limits, not clinical thresholds.
- The first composition should resemble layered ink ribbons or soft particle trails. Tune it only after the live signal path works.
- React updates controls/status; p5 owns frame updates. Do not render React on every animation frame.

## 5. Data, credentials and security
- No app recording or storage of video, face images or physiological history.
- Keep the Presage API key only in main-process memory for the current session. Development may use a gitignored environment variable; never compile a key into a bundle or expose it in frontend environment variables.
- Each evaluator uses their own key. Do not publish a shared working credential.
- Configure enableTelemetry: false. Presage authentication still uses network access.
- Logs contain coarse operational states and redacted errors, not keys, video or signal values.
- No analytics, cloud uploads or optional LLM Insights in the MVP.
- PNG export includes artwork only, without a camera image, measurements or physiological metadata.
- Export accepts a bounded, validated PNG buffer and uses a native destination dialog; the renderer cannot supply an arbitrary filesystem path.
- Use context isolation, disabled Node integration, a sandboxed renderer where compatible with the narrow preload, a restrictive CSP and bundled local assets.
- Block unexpected navigation/windows and deny unrequested permissions.
- Disclose dependencies and actual data behavior in the final consent section; verify rather than assuming the implementation meets this plan.

## 6. Suggested repository layout

```text
src/
  main/          SDK service, credentials, session lifecycle, export, IPC
  preload/       narrow renderer bridge
  renderer/      React UI, CSS, p5 canvas, optional audio
  shared/        schemas, signal types and pure mapping logic
tests/
  unit/          signal validation, state transitions, mapping
  ui/            consent, states, keyboard behavior
  smoke/         desktop startup and export with simulation
docs/
  PROJECT_DEFINITION.md
  decisions/     amendments when the baseline changes
  testing/       hardware and packaging evidence
```

One repository and one npm package initially. No monorepo tooling or separate deployment service.

## 7. Acceptance and verification
- Before consent: no camera capture or measurement starts.
- A real camera session produces a usable live pulse-rate sample and changes the painting.
- Simulation is clearly labelled and never silently replaces live data.
- Low confidence, stale data, disconnects and SDK errors stop signal-driven painting and explain the state.
- Pause/stop/close release the camera; resume reacquires it.
- Export creates a valid PNG containing only the artwork.
- The app can be operated with a keyboard; motion and audio controls are respected.
- A clean setup and a packaged macOS launch can find and load the required native libraries.
- The key is absent from the Git history, build, UI output, test artifacts and logs.
- Automated checks pass; a manual live-camera report documents hardware, versions, steps and limitations.

CI uses synthetic fixtures, not personal camera recordings or a live Presage key. Treat Playwright's Electron API as experimental; keep tests narrow and retain a manual smoke checklist. If browser QA tooling is unavailable, record that limit rather than claiming it was exercised.

## 8. Milestones and exit gates

| Milestone | Work | Exit evidence | Current status |
| --- | --- | --- | --- |
| M0: Definition | Scope, architecture, technology baseline | This document and Notion record | Documented |
| M1: Feasibility | Key, camera, SDK, live pulse, native packaging | Real sample received; packaged SDK loads; versions recorded | Not started |
| M2: Core experience | Consent, session lifecycle, canvas, palettes, export | Complete live start-to-export flow | Not started |
| M3: Reliability | Invalid/stale data, teardown, keyboard, tests | Acceptance checklist and hardware report | Not started |
| M4: Optional enrichment | Breathing and then sound, only if time permits | Adds value without degrading live acquisition | Optional |
| M5: Submission | Public setup, video, English DEV post | Required links and visible live integration | Not started |

If M1 fails, report the exact hardware, account or SDK blocker. Do not replace the required live integration with a simulation and describe the project as contest-ready.

## 9. Open items
- Obtain or connect a Presage developer account and session key; verify trial allowance.
- Verify camera readiness and actual pulse-rate cadence on the target Mac.
- Confirm native runtime redistribution terms before publishing a bundled binary.
- Decide whether a downloadable release needs signing/notarization; do not instruct users to bypass security warnings.
- Pin compatible dependencies after the spike.
- Select final visual identity once live feasibility is established.

## 10. Documentation ownership
GitHub is the authoritative source for versioned architecture, interfaces, setup and implementation evidence. Notion holds the project overview, status, decisions and links. Synchronization is manual; changes to scope or stack must update both, with a short rationale. No automatic cross-service sync has been installed.

## Official references
- [Presage Node/Electron SDK](https://smartspectra.presagetech.com/docs/nodejs)
- [Presage metrics](https://smartspectra.presagetech.com/docs/nodejs/metrics)
- [Device readiness](https://smartspectra.presagetech.com/docs/nodejs/device-readiness)
- [Telemetry and privacy](https://smartspectra.presagetech.com/docs/telemetry-and-privacy/)
- [Electron security](https://www.electronjs.org/docs/latest/tutorial/security)
- [Electron IPC](https://www.electronjs.org/docs/latest/tutorial/ipc)
- [React](https://react.dev/learn)
- [p5.js export](https://p5js.org/reference/p5/saveCanvas/)
- [Tone.js](https://tonejs.github.io/)
- [Forge Webpack TypeScript template](https://www.electronforge.io/templates/typescript-+-webpack-template)
- [Forge Vite plugin status](https://www.electronforge.io/config/plugins/vite)
- [Vitest](https://vitest.dev/guide/)
- [Playwright Electron support](https://playwright.dev/docs/api/class-electron)
- [Contest requirements](https://dev.to/challenges/presage-2026-11-04)
