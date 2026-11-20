# Live pulse verification — 2026-11-20

## Reproducible source

Demo commit: `e48be38625615d37b779126e4c13e3e96e831469`.

Platform: macOS Apple Silicon, packaged Electron desktop app, SmartSpectra Node SDK 3.5.0. This is a successful check on one Mac, not an accuracy study or verification on other devices.

The fixes are stacked: [PR #3](https://github.com/ReginaGalvezCh/pulse-canvas/pull/3) includes the reference traces required by device readiness; [PR #4](https://github.com/ReginaGalvezCh/pulse-canvas/pull/4) scopes chest visibility to breathing. Both depend on the earlier desktop and diagnostic increments. Nothing has been merged to main.

## Observed sequence

1. Verified the Presage dashboard showed Free and 98/100 credits.
2. Copied the hidden API key into the app's masked, session-only input. The key was not displayed or recorded.
3. Selected Live camera and explicitly consented to camera use.
4. Device readiness passed. Initially, the SDK requested that the face remain visible.
5. After framing was adjusted, stable pulse estimates passed the existing validation gate and generated new painting marks. The mark counter reached 56 before manual stop.
6. Captured approximately 23.44 seconds of the actual application screen, preserving the capture timestamps. The local MP4 contains 245 screen frames at variable intervals, encoded as H.264 at 1600 × 1044 with no audio. It shows the painting evolving and the estimated pulse changing. It does not contain camera footage or credentials.
7. Finished the session and verified the UI reported camera off. Exported the artwork through the native PNG save dialog.
8. Refreshed the dashboard: Free, 95/100 credits. No billing details, upgrade, purchase or automatic restart were used.

The application retains its two-minute budget including preparation. Stopping this attempt manually conserved the remaining allowance. The displayed quota is an observation, not an account-level billing guarantee.

## Evidence and limits

The [demo video is now attached publicly to PR #5](https://github.com/ReginaGalvezCh/pulse-canvas/pull/5#issuecomment-7043169446). Its canonical asset URL is https://github.com/user-attachments/assets/dc39deb3-a064-4685-8372-cd80c253e831. The artwork remains local. Do not include credentials, raw camera images or physiological history in this repository. The screen video visibly contains a current pulse estimate and was explicitly authorized for upload.

Signed-out verification: the GitHub comment and player loaded in a separate unauthenticated browser; the video decoded with a 23.441667-second duration and playback advanced. The exact demo commit's public file tree and setup instructions loaded with the Sign in link visible. The embedded video also loaded in the DEV preview. DEV post 4289116 is saved as an unpublished English draft with devchallenge and presagechallenge tags, AI disclosure, the exact commit and reproduction steps. The native DEV video uploader did not produce a confirmed result; the working hosted copy is the GitHub attachment. No contest post has been published.

Video SHA-256: `f98e1677b87aa85ba0acb64d25a8971e85a1ee0d98162988d4179153593da39f`.

Artwork PNG SHA-256: `73992301080c526bfe3cd13f47d4607dd8475560fbe1eb1cb37f66ebc64c898e`.

The MP4 was decoded locally; frames near seconds 1 and 20 were visually inspected and show different stages of the live painting. Local type checking and all 21 automated tests pass. CI has not been established as green. Tests use synthetic fixtures; live acquisition above was checked separately.

The painting cadence is synthesized from an accepted pulse-rate estimate. It does not track individual heartbeats and makes no medical assessment. Breathing modulation and audio remain deferred.

## Publication status

- Complete: public demo video and signed-out playback check.
- Complete: exact demo commit and setup instructions in the English draft.
- Complete: consent, storage, sharing, retention/deletion, telemetry and AI disclosure in the draft.
- Complete: signed-out access to the exact source commit.
- Pending: review and publish the saved DEV draft. The versioned article text is in [DEV_POST.md](../submission/DEV_POST.md).

### Final review and publication — 2026-11-20

The final review checked the saved article against the recorded implementation, the exact commit, reproduction commands, challenge tags, consent/data-handling disclosure and AI disclosure. The embedded demo loaded with readyState 4 and duration 23.441667 seconds. No article-body changes were required.

Published with the user's explicit instruction: [Pulse Canvas: Painting with a Live Camera-Derived Pulse](https://dev.to/reginagalvezch/pulse-canvas-painting-with-a-live-camera-derived-pulse-358). This publication supersedes the pending draft status above.

A separate unauthenticated browser loaded the canonical article URL without a preview token. It showed the published date, devchallenge and presagechallenge tags, exact demo commit and run instructions. The embedded video again decoded with readyState 4 and full duration. No new camera session, provider-credit use, payment or merge to main was needed. The demo source commit remains unchanged.
