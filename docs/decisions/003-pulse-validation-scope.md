# ADR 003: Scope chest visibility to breathing

Branch: fix/pulse-validation-scope. Based on fix/pulse-readiness-policy.

## Observation
The new three-metric configuration passed device readiness on the target Mac and entered a live session. The app then discarded all pulse packets whenever CHEST_NOT_VISIBLE was reported for the additional breathing trace.

## Decision
Treat CHEST_NOT_VISIBLE as a breathing-only warning for this pulse-driven painter. Keep rejecting all other validation warnings. Pulse samples still require the existing stable flag, confidence threshold, documented operating range, timestamp ordering and freshness checks.

This does not fabricate a pulse, bypass readiness, reinterpret a breathing trace as pulse, or classify the user's health. The official measurement-quality guide describes chest visibility as a requirement for breathing/chest metrics and an unobstructed face for pulse.

Reference: https://smartspectra.presagetech.com/docs/measurement-quality

## Regression
A synthetic stable pulse is accepted under CHEST_NOT_VISIBLE. EXCESSIVE_MOTION invalidates it, and an unstable pulse is rejected even under the breathing-only warning. Actual live signal acquisition must be checked separately.
