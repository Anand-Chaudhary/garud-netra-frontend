# Garud Netra — Dashboard Integration Spec

**For:** the person building the frontend/dashboard
**Project:** SIH26054 — AI-Enabled Real-Time Digital Twin System for Health Monitoring, Fault Prediction and Mission Reliability Enhancement of Aero Piston Engines used in MALE UAVs (DRDO)

This document describes what the backend produces, what the dashboard needs to display, and the exact data shapes to build against — so the frontend can be built in parallel with the remaining backend work and the two sides can be attached at the end with no surprises.

## 1. What this system actually does, in one paragraph

A physics-based software model ("twin") of a piston aero-engine runs alongside real (or simulated) sensor data and predicts what a healthy engine should be reading right now. The gap between the twin's prediction and the actual reading (the residual) is the core signal: small residual = healthy, growing residual = something's wrong. Everything the dashboard shows is downstream of that one number, computed per sensor channel, over time.

## 2. Backend status — what's built, what's in progress, what's not started

| Phase | What it produces | Status |
|---|---|---|
| 1 — Simulator & fault data | Simulated engine flights, 8 fault types, ground-truth labels | Done |
| 2 — Physics twin + estimator | Live residual stream per sensor channel, corrected state estimate | Done |
| 3 — Fault classification | Which of 8 fault types (or healthy), plus a standalone per-cylinder divergence check | Done |
| 4 — Sensor vs. mechanical | Is a flagged anomaly a real fault or a lying sensor? | Done |
| 5 — RUL (remaining useful life) | Hours/cycles until failure, from a health trajectory | In progress |
| 6 — Explainability (SHAP) | Plain-language "why" text for each alert | Not started |
| 7 — Mission simulator | "What if I fly this mission" what-if panel | Not started |
| 8 — Dashboard | This is what you're building | — |

**Practical implication for you:** build the dashboard's layout and all data-binding now against the JSON shapes in Section 4 below, using mock/static data. Phases 1–4's shapes are final and won't change. Phase 5's shape is drafted below but may shift slightly. Phases 6 and 7 don't exist yet — build those panels with placeholder/disabled states (Section 6 tells you exactly what to stub).

## 3. What the dashboard needs to show

This is the actual DRDO requirement (component F in the problem statement) — one screen with:

1. **Live health view** — per-subsystem status (engine overall, per-cylinder, oil, electrical), colour-coded, updating in real time
2. **Active alerts** — when a fault is flagged: which fault type, which channel(s), a plain-language explanation, and (once Phase 4 output is wired in) whether it's judged mechanical, a sensor problem, or genuinely ambiguous
3. **RUL countdown** — estimated remaining flight-hours/cycles once a degrading trend is detected, with a visual sense of confidence (see Phase 5 notes — estimates are much less reliable far from failure than close to it, the UI should communicate this rather than show a single falsely-precise number)
4. **Mission what-if panel** — a slider/form for hypothetical conditions (altitude, temperature, throttle profile) showing predicted effect on RUL. Not built yet — see Section 6 for how to stub it now.
5. **Replay mode** — feed a stored past flight through the same pipeline and watch the whole system react, for demos and judging. The backend already has 210+ recorded flights sitting as data files that can serve this (Section 5).

## 4. Data contracts — build the UI against these shapes

All timestamps in seconds since flight start unless noted. All residuals/health values are already computed backend-side — the dashboard should never need to compute a derived quantity itself, only display what's sent.

### 4.1 Live sensor reading (one timestep)

```json
{
  "t": 823.4,
  "rpm": 2438.2,
  "cht": [148.3, 141.9, 152.6, 149.1],
  "egt": [742.5, 738.1, 745.9, 740.2],
  "oil_pressure": 76.4,
  "oil_temp": 71.8,
  "fuel_flow": 22.6,
  "vibration_amplitude": 0.51,
  "battery_voltage": 14.02,
  "injection_timing": 24.8
}
```

`cht`/`egt` arrays are always 4 elements, indexed cylinder 1–4 in order.

### 4.2 Per-channel health / residual (one timestep, one panel's worth of data)

```json
{
  "t": 823.4,
  "channels": {
    "rpm": { "residual": 3.2, "tau": 4.72, "health": 0.91 },
    "cht_1": { "residual": 0.8, "tau": 0.91, "health": 0.97 },
    "cht_2": { "residual": -1.1, "tau": 0.91, "health": 0.83 },
    "cht_3": { "residual": 0.4, "tau": 0.94, "health": 0.98 },
    "cht_4": { "residual": 0.6, "tau": 0.91, "health": 0.95 },
    "egt_1": { "residual": 2.1, "tau": 3.7, "health": 0.89 },
    "egt_2": { "residual": 1.8, "tau": 3.7, "health": 0.91 },
    "egt_3": { "residual": 2.3, "tau": 3.7, "health": 0.88 },
    "egt_4": { "residual": 1.9, "tau": 3.7, "health": 0.90 },
    "oil_pressure": { "residual": 0.3, "tau": 0.56, "health": 0.95 },
    "oil_temp": { "residual": 0.4, "tau": 1.2, "health": 0.94 },
    "fuel_flow": { "residual": 0.2, "tau": 0.9, "health": 0.96 },
    "vibration_amplitude": { "residual": 0.02, "tau": 0.031, "health": 0.90 },
    "battery_voltage": { "residual": 0.01, "tau": 0.037, "health": 0.99 }
  }
}
```

- `residual` is the raw signed number (units match the channel — °C, psi, rpm, etc.)
- `tau` is the calibrated "normal" threshold for that channel (constant per channel, included here for convenience so the UI can draw the band without a second lookup)
- `health` is 0–1, saturating (never goes below 0) — good for a simple gauge/traffic-light, bad for showing "how much worse than normal." Use this for the live health panel.
- **Design note:** `|residual| / tau` gives you the value in "how many τ past normal" units, which is what most of the backend's own diagnostic plots use on the y-axis (see the sample plots your teammate has been reviewing) — consider using this scale for any chart, not just the saturating health number, if you want the dashboard to show magnitude past threshold.

### 4.3 Fault classification (updates whenever the classifier re-evaluates, not every timestep)

```json
{
  "t": 823.4,
  "predicted_class": "misfire",
  "class_probabilities": {
    "healthy": 0.02, "misfire": 0.81, "clogged_injector": 0.09,
    "general_wear": 0.01, "poor_lubrication": 0.00, "sensor_drift": 0.05,
    "rough_combustion": 0.01, "overheating": 0.00, "abnormal_vibration": 0.01
  },
  "trajectory_check": {
    "fired": true,
    "affected_cylinder": 1,
    "peak_sigma": 247.5,
    "sustained_seconds": 794,
    "verdict_text": "cylinder 1 EGT ran cold of its siblings from t=776s (peak 247.5 sigma, sustained 794s)"
  }
}
```

- `class_probabilities` always has all 9 keys (8 fault types + healthy), values sum to ~1
- `trajectory_check` is a separate, independent signal from the classifier (not a classifier input) — it's specifically for per-cylinder divergence and is designed to be human-readable on its own. `verdict_text` is ready-to-display plain English — show it directly, don't try to reconstruct a sentence from the numeric fields.
- When `trajectory_check.fired` is `false`, still show `verdict_text` (it'll say something like "all cylinders track together; no per-cylinder divergence") — this is a positive, useful status, not an absence of data.

### 4.4 Sensor vs. mechanical disambiguation (fires only when a fault is flagged)

```json
{
  "t": 823.4,
  "flagged_channel": "egt_4",
  "verdict": "SENSOR",
  "p_mechanical": 0.00,
  "p_sensor": 1.00,
  "reason": "anomaly is confined to 'egt_4' plus its known coupling into cht_4, egt_1, egt_2, egt_3",
  "affected_channels": ["egt_4", "cht_4", "egt_1", "egt_2", "egt_3"]
}
```

- `verdict` is one of `"MECHANICAL"`, `"SENSOR"`, or `"AMBIGUOUS"` — AMBIGUOUS is a real, intentional, designed output (it means the system has determined the evidence genuinely cannot distinguish the two cases), not a missing-data state. Design the UI to show AMBIGUOUS as its own clear category (e.g. a distinct colour/icon), not as an error or a low-confidence version of the other two.
- `reason` is plain-language, ready to display as-is.
- When `verdict` is AMBIGUOUS, `reason` will explain why (e.g. "'rough_combustion' and a drifting 'vibration_amplitude' sensor predict the same residual pattern; they are not separable from this evidence") — show this text prominently, it's the most important part of an ambiguous alert.

### 4.5 RUL (Phase 5 — in progress, shape may shift slightly)

```json
{
  "t": 823.4,
  "predicted_rul_cycles": 6.2,
  "health_index": 0.58,
  "health_trajectory": [
    { "cycle": 0, "phi": 0.87 },
    { "cycle": 1, "phi": 0.85 },
    { "cycle": 2, "phi": 0.81 }
  ],
  "confidence_note": "far from failure -- estimate is low-confidence",
  "failure_threshold_phi": 0.35
}
```

- `health_index` (called PHI backend-side) is a non-saturating 0–1-ish health number distinct from the per-channel health in §4.2 — this one is specifically for tracking degradation trend over many flights/cycles, not per-timestep anomaly detection. Values below 0 are possible in principle but rare; treat `< 0` as "past failure."
  - **Important:** expect that far-from-failure RUL estimates are much noisier than near-failure ones (this is expected physical behaviour, not a bug) — the UI should visually communicate uncertainty (e.g. a widening confidence band, or muted styling) rather than presenting a single number with false precision when the engine is healthy.
- `failure_threshold_phi` — draw a clear line on any health-vs-cycle chart at this value.
- This schema **may change slightly** once Phase 5 finishes — treat it as a strong draft, not final, and keep the binding for this one panel easy to adjust.

### 4.6 Alert feed item (what actually shows in the "active alerts" list — a synthesis of 4.3 + 4.4)

```json
{
  "id": "alert_00042",
  "t": 823.4,
  "severity": "high",
  "fault_type": "misfire",
  "affected": ["cylinder 1"],
  "verdict": "MECHANICAL",
  "explanation": "cylinder 1 EGT ran cold of its siblings from t=776s (peak 247.5 sigma, sustained 794s)",
  "status": "active"
}
```

This is the shape the alert list should bind to — it's a convenience view combining §4.3's trajectory verdict text and §4.4's disambiguation verdict into one display-ready item. (Phase 6's SHAP explainer will eventually replace/enrich the `explanation` field with a more detailed per-channel breakdown — see Section 6.)

## 5. Replay mode — data already available for it

The backend already has a substantial library of recorded flights that can drive replay mode without needing any live simulator running:

- **210 flights** from Phase 1: 50 healthy + 20 each of 8 fault types, with full sensor traces and ground-truth fault labels
- **20+ degradation trajectories** from Phase 5: multi-cycle sequences per simulated engine showing gradual failure progression (useful specifically for demoing the RUL panel)

For replay mode, the dashboard should accept a flight ID and receive back the full time-series of Sections 4.1–4.4 (and 4.5 where applicable) for that flight, played back at a speed the UI controls (e.g. 1×, 4×, or "jump to timestamp"). Ask your teammate for a `GET /flights` (or equivalent) endpoint listing available flight IDs with their ground-truth label, so replay mode has something to populate a picker with.

## 6. What's NOT built yet — build these with mock data now

### Phase 6 — Explainability (SHAP)

Not built. For now, the `explanation` field in §4.6 is the trajectory-check's plain-English verdict text — this is already fairly explainable and fine to ship with. Build the UI to show a text explanation per alert (as in §4.6) so that when Phase 6 lands, it's a drop-in replacement of that one field's content (possibly richer — e.g. a ranked list of contributing channels) with no UI restructuring needed.

### Phase 7 — Mission simulator ("what-if" panel)

Not built. Build this panel now as a disabled/coming-soon state, or wire it to a mock function that takes the same shape of input (altitude, temperature, throttle profile) and returns a canned/randomized version of the RUL shape (§4.5) so the panel's layout and interactivity can be fully built and tested before the real backend exists. Structure the mock's request/response shape as:

```json
// request
{ "altitude_m": 3800, "ambient_temp_c": 32, "throttle_profile": "aggressive" }

// response -- same shape as 4.5's health_trajectory
{ "predicted_rul_cycles": 4.1, "health_trajectory": [ /* same shape as 4.5 */ ] }
```

## 7. A few non-functional things worth knowing

- **Update rate:** the underlying sensor simulation runs around 10 Hz, but the physics twin + estimator pipeline (which computes everything in §4.2–4.4) runs at roughly 16× real time when processing a full flight — meaning for a live dashboard there's comfortable headroom, but there's no reason to render every single 10 Hz sample. Recommend the dashboard poll or receive updates at 1–2 Hz — smooth enough to feel live, and it avoids needlessly re-rendering charts 10 times a second.
- **Historical vs. live:** replay mode (Section 5) and live mode should ideally share the exact same data-binding code paths in the frontend — the backend can send identical JSON shapes for both, just from a stored file vs. a running pipeline. Worth confirming this with your teammate so you don't have to build two separate rendering paths.
- **AMBIGUOUS is not an error state.** This is worth repeating because it's easy to design around by accident — §4.4's AMBIGUOUS verdict is a deliberate, honest output of the system in cases where the evidence genuinely doesn't support a confident answer. It should look intentional in the UI (a clear third state, its own colour), not like a fallback or a loading spinner.

## 8. Open questions to settle with your teammate before/while building

- Confirm the actual transport: REST polling, WebSocket push, or Server-Sent Events for live data — this spec describes payload shapes, not transport, since that hasn't been decided yet.
- Confirm the Phase 5 RUL schema (§4.5) once that phase finishes — flag it as the one section of this doc most likely to need a small revision.
- Get the flight-listing endpoint (Section 5) added early, since replay mode is probably the easiest way to demo the whole system to judges before live sensor integration exists.
