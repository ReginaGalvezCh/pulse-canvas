# ADR 002: Include the reference traces in pulse readiness checks

Branch: fix/pulse-readiness-policy. Based on fix/device-readiness-diagnostics.

## Observed failure
The PR #2 app returned:

> Device check (inconclusive): Policy unavailable. This SDK configuration cannot be assessed by the readiness check. Select supported metrics and retry; no device capacity verdict was established.

This is not a failed camera performance verdict. The configured pulse-only workload could not be assessed.

## Evidence from pinned SDK 3.5.0
The Node wrapper builds the native full-reference policy and filters its metric requirements to the requested metrics. PULSE_RATE (15) is a derived output and is not a required reference output in that policy.

Offline inspection of the native policies, without credentials or capture, returned:

| Policy workload | Required reference outputs |
| --- | --- |
| breathing | CHEST_BREATHING (0) |
| breathing_pulse | CHEST_BREATHING (0), ARTERIAL_PRESSURE_TRACE (16) |
| breathing_pulse_eda | The two above plus EDA_TRACE (10) |
| full | Chest, pulse trace, EDA and face outputs; other metrics add processing load |

Reproduce this inspection on a supported SDK platform with `node scripts/inspect-readiness.cjs`. The diagnostic reads the pinned package's internal policy module; production code uses only the public SDK API. This diagnostic must be reviewed when upgrading the SDK.

## Change
Request CHEST_BREATHING, PULSE_RATE and ARTERIAL_PRESSURE_TRACE. This includes the breathing/pulse reference outputs and preserves the pulse estimate used by the painter. Do not request EDA, expressions, HRV or all metrics as a workaround. Do not bypass a non-ready verdict.

Only stable, valid pulse-rate estimates are sent to the painting. The additional traces are discarded; no physiological history or camera footage is recorded by this change. Telemetry remains disabled.

Preparation time now counts against the two-minute live budget. An exhausted preparation budget does not start capture. There is no automatic restart, billing action or paid-plan upgrade.

## Validation boundary
Regression tests verify inclusion of both required reference outputs, pulse retention, telemetry opt-out and budget behavior. Passing these tests or reading the policy does not prove readiness on a live device. Record the actual next device verdict separately.

## Official references
- https://smartspectra.presagetech.com/docs/device-readiness
- https://smartspectra.presagetech.com/docs/nodejs/metrics
