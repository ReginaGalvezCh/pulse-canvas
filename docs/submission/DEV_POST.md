---
title: "Pulse Canvas: Painting with a Live Camera-Derived Pulse"
published: false
tags: devchallenge, presagechallenge
ai_disclosure_level: fully_autonomous
---

*This is a submission for the [Presage SmartSpectra SDK Challenge](https://dev.to/challenges/presage-2026-11-04).*

## What I Built

Pulse Canvas is a desktop creative coding experience that turns a live pulse-rate estimate into the rhythm of an abstract painting.

Choose one of three palettes, consent to camera use, and let a composition of translucent ribbons develop. You can pause, finish the session, clear the canvas, or keep the artwork as a PNG. A clearly labelled Simulation mode lets you explore without using the camera or Presage credits.

I wanted to make a small creative pause with no score, target, or instruction to change how you feel. The artwork is expressive; the app does not assess health or infer emotions.

## Demo

[Watch the real-signal demo on GitHub](https://github.com/ReginaGalvezCh/pulse-canvas/pull/5#issuecomment-7043169446).

<video controls preload="metadata" src="https://github.com/user-attachments/assets/dc39deb3-a064-4685-8372-cd80c253e831"></video>

The 23-second screen recording shows **Live camera** selected, the estimated pulse changing, and new ribbons appearing. It was captured from the packaged macOS Apple Silicon app on November 20, 2026. It uses a real Presage signal. The video has no audio, camera image, or credentials. Screen frames retain their original capture timing.

The camera was stopped after the take. The session generated an artwork that was exported locally as a 1200 × 1200 PNG.

## Code

[Public repository](https://github.com/ReginaGalvezCh/pulse-canvas)

**Exact demo commit:** [e48be38625615d37b779126e4c13e3e96e831469](https://github.com/ReginaGalvezCh/pulse-canvas/tree/e48be38625615d37b779126e4c13e3e96e831469).

Please use this commit to reproduce the video: implementation is being delivered through incremental branches and pull requests, and the default branch has not yet incorporated those changes. The README at the recorded commit predates the successful live test; the [live verification report](https://github.com/ReginaGalvezCh/pulse-canvas/blob/84c93a76cc8982ae67eb335c1d2f5e60fbf90482/docs/testing/LIVE_VERIFICATION.md) records the later result.

### Run the recorded version

You need a Mac with Apple Silicon, a working camera, Git, and Node.js with npm. Local checks used Node **22.22.2**; the project accepts Node >=22.12 and recommends Node 24 LTS. Live mode also requires your own [Presage developer account and API key](https://physiology.presagetech.com/portal/dashboard), with available Free-plan credits.

```sh
git clone https://github.com/ReginaGalvezCh/pulse-canvas.git
cd pulse-canvas
git checkout --detach e48be38625615d37b779126e4c13e3e96e831469
npm ci
npm run check
npm run package
open "out/Pulse Canvas-darwin-arm64/Pulse Canvas.app"
```

For the development window, use `npm start` instead of packaging. The source build is the delivery path; there is no signed or notarized downloadable release.

1. Check your remaining Presage Free credits before starting Live mode.
2. In the app, select **Live camera**. Use **Copy API key** in your Presage dashboard, paste it into the masked field, and choose **Use this key**. This is your API key, not your account password. Never commit or share it.
3. Choose a palette, acknowledge camera use, and select **Begin your painting**. Allow the expected macOS camera permission prompt.
4. Keep your face centred and unobstructed, with even light and minimal movement. Follow any positioning messages while readiness and acquisition complete.
5. Once a stable pulse is available, watch new marks appear. Choose **Finish session** to release the camera and **Keep this painting** to export the artwork.

Without a key, select **Simulation** and acknowledge its separate notice. Generated values are labelled and are never substituted for a failed live session.

Live sessions have a two-minute budget including device preparation, with manual restart only. This is an app usage safeguard, not an account billing guarantee. The demonstrated test stayed on Free; no paid plan is required or activated by the app.

## How It Responds to Human Signals

The stack is Electron and Node.js for local application services, React and TypeScript for the interface, and p5.js for painting. There is no remote application server or database.

The Electron main process owns SmartSpectra SDK 3.5.0, camera access, authentication, device readiness, metric decoding, and cleanup. A narrow preload/IPC bridge sends accepted signal state to the renderer; Zod validates the process contracts.

The SDK requests **CHEST_BREATHING**, **ARTERIAL_PRESSURE_TRACE**, and **PULSE_RATE**. The first two supply the reference workload needed by the pinned SDK's readiness policy. Only pulse-rate estimates drive the artwork; the additional traces are discarded. Breathing modulation and sound are not implemented in this version.

A pulse sample must be stable, meet the confidence threshold, fall within the documented operating range, and have an increasing timestamp. Invalid or stale input pauses signal-driven mark generation. A breathing-only chest-visibility warning does not override an otherwise usable face-derived pulse; face, light, and motion checks remain enforced.

The accepted rate sets a synthesized mark-making cadence. **Each ribbon is not a detected individual heartbeat.** Palette choices are artistic and carry no health or emotion classification.

The live path was verified on one Mac, with local type checking and all 21 automated tests passing. This is not a measurement-accuracy study; other platforms have not been validated, and I am not claiming a green CI run.

## Prize Categories

**Most Creative or Delightful Use.** Pulse Canvas turns a physiological estimate into a material for creative expression: layered colour, changing rhythm, and an artwork you can keep. Its purpose is a playful, personal interaction rather than a dashboard of measurements.

## Consent and Data Handling

- **Consent:** Live mode requires an explicit camera-use checkbox before starting, followed by macOS camera permission. Simulation has its own notice and does not start camera capture.
- **Camera and signals:** the app does not record, save, or upload camera footage. Signal state is held in memory, with no physiological history or cloud gallery. Pause, finish, and window close release measurement resources.
- **Credentials:** the normal masked API-key entry passes the key once to the main process and clears the form. The key remains in memory for that app launch and is not saved. A gitignored environment file is an optional development-only alternative, not part of the demo setup above.
- **Network and SDK telemetry:** Presage authentication and entitlement checks need network access. The SDK is explicitly configured with `enableTelemetry: false` and native logging disabled. Telemetry opt-out does not make authentication anonymous or eliminate Presage's service-side processing and policies. See the [official SDK telemetry and privacy guide](https://smartspectra.presagetech.com/docs/telemetry-and-privacy/).
- **Storage, retention, and deletion:** artwork is saved only when the user chooses a destination in the native save dialog. The PNG contains the painting, without camera imagery or physiological metadata. Users retain and delete those files themselves; the app has no stored session history to delete.
- **Sharing:** this demo is a separately captured screen video voluntarily uploaded for the challenge. It shows an estimated pulse value, but no camera footage or key. GitHub hosts the shared video and DEV hosts this article under their respective policies; those public copies are separate from the app's local session behavior.
- **AI services:** no LLM or optional AI interpretation service receives the camera or signals. I used ChatGPT/Codex to assist with implementation, debugging, tests, documentation, and preparing this post. The app uses Presage's signal estimation, not generated substitute measurements in Live mode.

Pulse Canvas is a creative art project. It does not diagnose, treat, monitor sleep, or support medical decisions.
