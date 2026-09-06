# Garud Netra Dashboard Development Roadmap

## Overview
This roadmap outlines the implementation plan for the Garud Netra dashboard based on the specification in `garud_netra_dashboard_spec.md`. The dashboard is the frontend component for the AI-Enabled Real-Time Digital Twin System for Health Monitoring of Aero Piston Engines.

## Phase 1: Foundation & Live Health View
**Objective:** Set up the basic dashboard structure and implement the live health monitoring view.

### Subtasks:
1. Initialize project structure with appropriate frontend framework (React/Vue/etc. to be determined)
2. Set up development environment and dependencies
3. Implement data connection mechanism (REST polling/WebSocket/SSE - to be confirmed with backend team)
4. Create live health view component:
   - Engine overall status indicator
   - Per-cylinder monitoring (CHT and EGT for cylinders 1-4)
   - System monitoring (oil pressure, oil temp, fuel flow, vibration amplitude, battery voltage, injection timing)
   - Color-coded status indicators based on health values (0-1 scale from §4.2)
   - Real-time updating display (target 1-2 Hz update rate per §7)
5. Implement health value visualization (gauges, traffic lights, or similar UI elements)
6. Create reusable components for displaying sensor readings with health indicators

## Phase 2: Alerts System
**Objective:** Implement the active alerts panel that displays fault detection results.

### Subtasks:
1. Design alert item component based on §4.6 shape
2. Implement alerts list container that can display multiple active alerts
3. Create fault type display with appropriate labeling
4. Implement affected components display (e.g., "cylinder 1")
5. Add plain-text explanation field display (verdict_text from trajectory_check)
6. Implement verdict display (MECHANICAL/SENSOR/AMBIGUOUS) with distinct styling:
   - MECHANICAL: One color/icon
   - SENSOR: Another color/icon
   - AMBIGUOUS: Third distinct color/icon (not treated as error per §7.2)
7. Add reason/plain-language explanation display
8. Implement alert status indicators (active/resolved)
9. Handle trajectory_check.fired=false case (show "all cylinders track together" message)

## Phase 3: RUL Panel
**Objective:** Implement the Remaining Useful Life countdown and health trajectory visualization.

### Subtasks:
1. Create RUL display component showing predicted_rul_cycles
2. Implement health trajectory chart:
   - Plot health_index (PHI) over cycles
   - Show failure_threshold_phi line (0.35 from §4.5)
   - Display health_trajectory array data points
3. Add confidence visualization:
   - Implement visual indication of confidence (widening bands, muted styling for low confidence)
   - Display confidence_note text
4. Handle edge cases:
   - Values below 0 (past failure)
   - Far-from-failure uncertainty communication
5. Create interactive elements for exploring health trajectory
6. Ensure chart shares data-binding patterns with other components for consistency

## Phase 4: Replay Mode
**Objective:** Enable playback of historical flight data for demonstration and analysis.

### Subtasks:
1. Implement flight selection interface:
   - Connect to GET /flights endpoint (to be provided by backend)
   - Display flight ID with ground-truth label (healthy/fault type)
   - Allow selection of flight for replay
2. Develop playback controls:
   - Speed selection (1x, 4x, variable)
   - Jump to timestamp functionality
   - Play/pause controls
   - Progress indicator
3. Implement data feeding mechanism:
   - Accept flight ID and receive time-series data matching Sections 4.1-4.4 (and 4.5 where applicable)
   - Reuse exact same data-binding code paths as live mode (per §7.1)
   - Process data at controlled playback speed
4. Add replay-specific UI elements:
   - Indicator showing replay mode vs live mode
   - Flight information display
   - Option to compare with ground-truth labels
5. Test with available flight data:
   - 210 flights from Phase 1 (50 healthy + 20 each of 8 fault types)
   - 20+ degradation trajectories from Phase 5

## Phase 5: Mission What-If Panel (Stubbed) [Completed]
**Objective:** Create the mission simulator panel interface with mocked functionality.

### Subtasks:
1. [x] Design panel layout for hypothetical conditions input:
   - Altitude input (meters)
   - Ambient temperature input (°C)
   - Throttle profile selection (aggressive/normal/conservative/etc.)
2. [x] Implement mock backend communication:
   - Accept request shape: { "altitude_m": number, "ambient_temp_c": number, "throttle_profile": string }
   - Return mock response shape: { "predicted_rul_cycles": number, "health_trajectory": array }
   - Generate reasonable mock values based on inputs
3. [x] Create visualization of what-if results:
   - Show predicted RUL under hypothetical conditions
   - Display modified health trajectory
   - Compare with current RUL prediction
4. [x] Implement panel as disabled/coming-soon state OR fully functional mock:
   - Clearly indicate this is Phase 7 functionality (not yet built)
   - Allow interaction and layout testing
   - Ensure easy replacement when real backend is available
5. [x] Add explanatory text about what-if capabilities

## Phase 6: Polish & Integration
**Objective:** Refine the dashboard, ensure consistency, and prepare for backend integration.

### Subtasks:
1. Optimize update rate:
   - Implement 1-2 Hz polling/receiving (despite 10Hz sensor simulation)
   - Ensure smooth visual updates without unnecessary re-renders
2. Validate AMBIGUOUS state handling:
   - Confirm distinct visual treatment (not error/loading state)
   - Test with ambiguous scenarios
3. Ensure data-binding consistency:
   - Verify live mode and replay mode share identical code paths
   - Test switching between modes
4. Implement error handling and loading states:
   - Handle connection issues gracefully
   - Show appropriate indicators during data loading
5. Add tooltips and detailed information on hover/click:
   - Explain residuals, tau, health values
   - Provide context for alert details
6. Perform cross-browser/testing:
   - Ensure responsive design
   - Validate accessibility considerations
7. Prepare documentation for handoff to backend team:
   - Define exact endpoints and data shapes needed
   - Document any remaining open questions from §8

## Milestones Summary

**Milestone 1: Foundation Complete** (End of Phase 1)
- Basic dashboard structure live
- Live health view displaying all sensor streams with health indicators
- Basic data connection established

**Milestone 2: Core Functionality** (End of Phase 3)
- Live health view + alerts system + RUL panel all functional
- Dashboard displays all required real-time information
- Basic interactivity implemented

**Milestone 3: Demo Ready** (End of Phase 4)
- Replay mode fully functional with historical flight data
- Ability to demonstrate system with pre-recorded flights
- Mission what-if panel mocked and testable

**Milestone 4: Complete System** (End of Phase 6)
- All components polished and integrated
- Consistent user experience across live and replay modes
- Ready for final backend integration and validation

## Open Questions to Resolve with Backend Team
Per §8 in the specification, these need confirmation during development:
1. Actual transport mechanism: REST polling, WebSocket, or Server-Sent Events for live data
2. Final Phase 5 RUL schema once that phase completes (may shift slightly)
3. Flight-listing endpoint for replay mode population