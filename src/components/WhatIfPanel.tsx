'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Legend
} from 'recharts';
import {
  Sliders,
  Play,
  RotateCcw,
  Sparkles,
  Info,
  TrendingDown,
  TrendingUp,
  AlertCircle,
  Thermometer,
  Gauge,
  Compass,
  ArrowRight,
  Code2,
  CheckCircle2,
  Clock,
  ShieldAlert
} from 'lucide-react';

export type ThrottleProfile = 'conservative' | 'normal' | 'aggressive';

export interface WhatIfRequest {
  altitude_m: number;
  ambient_temp_c: number;
  throttle_profile: ThrottleProfile;
}

export interface TrajectoryPoint {
  cycle: number;
  baselinePhi: number;
  hypotheticalPhi: number;
  hypotheticalLower: number;
  hypotheticalUpper: number;
}

export interface WhatIfResponse {
  t: number;
  predicted_rul_cycles: number;
  baseline_rul_cycles: number;
  health_index: number;
  health_trajectory: Array<{ cycle: number; phi: number }>;
  confidence_note: string;
  failure_threshold_phi: number;
  stress_multiplier: number;
  thermal_margin_c: number;
  estimated_failure_cycle: number;
  baseline_failure_cycle: number;
}

// Preset mission profiles for quick testing
interface MissionPreset {
  id: string;
  name: string;
  description: string;
  altitude: number;
  temp: number;
  throttle: ThrottleProfile;
}

const PRESETS: MissionPreset[] = [
  {
    id: 'standard',
    name: 'Standard Patrol',
    description: 'Nominal mid-altitude loiter in moderate weather',
    altitude: 3000,
    temp: 20,
    throttle: 'normal',
  },
  {
    id: 'hot_and_high',
    name: 'Hot & High Recon',
    description: 'High altitude survey in elevated desert temperatures',
    altitude: 5500,
    temp: 38,
    throttle: 'aggressive',
  },
  {
    id: 'economy_loiter',
    name: 'Economy Loiter',
    description: 'Low-speed fuel-conservation endurance patrol',
    altitude: 2000,
    temp: 15,
    throttle: 'conservative',
  },
  {
    id: 'combat_dash',
    name: 'High-Speed Transit',
    description: 'Maximum continuous power low-level dash',
    altitude: 1200,
    temp: 32,
    throttle: 'aggressive',
  },
];

const BASELINE_RUL = 6.2;
const CURRENT_HEALTH_PHI = 0.58;
const CURRENT_CYCLE = 12;
const FAILURE_THRESHOLD_PHI = 0.35;

/**
 * Mock mission simulator calculation adhering to Section 4.5 and Section 6
 * of the Garud Netra Dashboard Integration Specification.
 */
export function simulateMissionWhatIf(params: WhatIfRequest): WhatIfResponse {
  const { altitude_m, ambient_temp_c, throttle_profile } = params;

  // Physical heuristics for piston aero engine:
  // 1. Altitude factor: Thinner air above 3000m reduces cooling airflow and requires higher turbo pressure
  const altitudeFactor = 1.0 + Math.max(0, (altitude_m - 2500) / 7500) * 0.45;

  // 2. Temperature factor: Ambient temps above 25°C reduce oil cooler and cylinder heat dissipation
  const tempFactor = 1.0 + Math.max(0, (ambient_temp_c - 20) / 30) * 0.4;

  // 3. Throttle factor: Aggressive continuous throttle increases mean effective pressure and piston ring wear
  const throttleFactor =
    throttle_profile === 'aggressive'
      ? 1.55
      : throttle_profile === 'conservative'
      ? 0.78
      : 1.0;

  // Combined stress multiplier
  const stressMultiplier = Number((altitudeFactor * tempFactor * throttleFactor).toFixed(2));

  // Predicted RUL cycles under simulated conditions (inversely proportional to stress)
  const simulatedRulCycles = Number(
    Math.max(0.8, BASELINE_RUL / stressMultiplier).toFixed(1)
  );

  // Remaining thermal margin to CHT limit (redline ~235°C, normal ~150°C)
  const thermalMargin = Math.max(12, Math.round(85 - (altitude_m / 100) * 0.6 - ambient_temp_c * 0.9));

  // Confidence note logic based on proximity to failure and extreme inputs
  let confidenceNote = 'Moderate confidence: nominal mission envelope';
  if (simulatedRulCycles < 3.0) {
    confidenceNote = 'High confidence: engine is in accelerating degradation phase close to failure threshold';
  } else if (altitude_m > 5000 || ambient_temp_c > 40) {
    confidenceNote = 'Far from failure under extreme operating envelope -- estimate has widened uncertainty band';
  } else {
    confidenceNote = 'Standard operational prediction: steady wear progression model';
  }

  // Trajectory points starting from current cycle
  const trajectory: Array<{ cycle: number; phi: number }> = [];
  const maxCycles = 16;

  for (let c = 0; c <= maxCycles; c++) {
    const cycleNum = CURRENT_CYCLE + c;
    // Degradation curve
    const degradation = Math.pow(c / simulatedRulCycles, 1.4) * (CURRENT_HEALTH_PHI - FAILURE_THRESHOLD_PHI);
    const phi = Math.max(0.1, Number((CURRENT_HEALTH_PHI - degradation).toFixed(3)));
    trajectory.push({ cycle: cycleNum, phi });
  }

  return {
    t: 823.4,
    predicted_rul_cycles: simulatedRulCycles,
    baseline_rul_cycles: BASELINE_RUL,
    health_index: CURRENT_HEALTH_PHI,
    health_trajectory: trajectory,
    confidence_note: confidenceNote,
    failure_threshold_phi: FAILURE_THRESHOLD_PHI,
    stress_multiplier: stressMultiplier,
    thermal_margin_c: thermalMargin,
    estimated_failure_cycle: CURRENT_CYCLE + Math.round(simulatedRulCycles),
    baseline_failure_cycle: CURRENT_CYCLE + Math.round(BASELINE_RUL),
  };
}

const WhatIfPanel: React.FC = () => {
  // Input parameters
  const [altitudeM, setAltitudeM] = useState<number>(3800);
  const [ambientTempC, setAmbientTempC] = useState<number>(32);
  const [throttleProfile, setThrottleProfile] = useState<ThrottleProfile>('aggressive');
  const [selectedPreset, setSelectedPreset] = useState<string>('custom');

  // Simulation state
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'simulator' | 'api-contract'>('simulator');
  const [lastSimulatedTime, setLastSimulatedTime] = useState<string>('Just now');

  // Current computed result
  const simulationResult = useMemo(() => {
    return simulateMissionWhatIf({
      altitude_m: altitudeM,
      ambient_temp_c: ambientTempC,
      throttle_profile: throttleProfile,
    });
  }, [altitudeM, ambientTempC, throttleProfile]);

  // Combined chart trajectory including baseline vs simulated
  const chartData = useMemo<TrajectoryPoint[]>(() => {
    const points: TrajectoryPoint[] = [];
    const maxCycles = 14;

    for (let c = 0; c <= maxCycles; c++) {
      const cycleNum = CURRENT_CYCLE + c;

      // Baseline PHI
      const baseDeg = Math.pow(c / BASELINE_RUL, 1.4) * (CURRENT_HEALTH_PHI - FAILURE_THRESHOLD_PHI);
      const baselinePhi = Math.max(0.12, Number((CURRENT_HEALTH_PHI - baseDeg).toFixed(3)));

      // Hypothetical PHI
      const hypDeg =
        Math.pow(c / simulationResult.predicted_rul_cycles, 1.4) *
        (CURRENT_HEALTH_PHI - FAILURE_THRESHOLD_PHI);
      const hypotheticalPhi = Math.max(0.1, Number((CURRENT_HEALTH_PHI - hypDeg).toFixed(3)));

      // Uncertainty envelope grows with cycle distance
      const uncertainty = 0.015 + (c / maxCycles) * 0.08 * (simulationResult.stress_multiplier > 1.2 ? 1.3 : 1.0);
      const lower = Math.max(0.05, Number((hypotheticalPhi - uncertainty).toFixed(3)));
      const upper = Math.min(1.0, Number((hypotheticalPhi + uncertainty).toFixed(3)));

      points.push({
        cycle: cycleNum,
        baselinePhi,
        hypotheticalPhi,
        hypotheticalLower: lower,
        hypotheticalUpper: upper,
      });
    }

    return points;
  }, [simulationResult]);

  // Apply a preset
  const handleApplyPreset = (preset: MissionPreset) => {
    setSelectedPreset(preset.id);
    setIsSimulating(true);
    setTimeout(() => {
      setAltitudeM(preset.altitude);
      setAmbientTempC(preset.temp);
      setThrottleProfile(preset.throttle);
      setIsSimulating(false);
      setLastSimulatedTime(new Date().toLocaleTimeString());
    }, 250);
  };

  // Reset to default
  const handleReset = () => {
    setSelectedPreset('custom');
    setAltitudeM(3000);
    setAmbientTempC(25);
    setThrottleProfile('normal');
    setLastSimulatedTime(new Date().toLocaleTimeString());
  };

  // Run simulation trigger
  const handleRunSimulation = () => {
    setIsSimulating(true);
    setTimeout(() => {
      setIsSimulating(false);
      setLastSimulatedTime(new Date().toLocaleTimeString());
    }, 300);
  };

  const deltaCycles = Number(
    (simulationResult.predicted_rul_cycles - simulationResult.baseline_rul_cycles).toFixed(1)
  );
  const deltaPercent = Math.round(
    ((simulationResult.predicted_rul_cycles - simulationResult.baseline_rul_cycles) /
      simulationResult.baseline_rul_cycles) *
      100
  );

  return (
    <div className="space-y-6">
      {/* Backend Integration & Phase Notice Banner */}
      <div className="bg-surface border border-primary/30 rounded-xl p-4 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-primary-soft text-primary mt-0.5">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-foreground text-sm">
                Mission Simulator (Phase 7 Specification)
              </span>
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-primary-soft text-primary border border-primary/20">
                Functional Interactive Mock
              </span>
              <span className="text-xs text-muted font-mono">
                Contract: §4.5 & §6
              </span>
            </div>
            <p className="text-xs text-muted mt-1">
              Simulates hypothetical flight parameters and evaluates physical degradation impact against baseline digital twin trajectory. Ready for production backend wiring via POST/GET /mission/simulate.
            </p>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center gap-1 bg-background p-1 rounded-lg border border-border-subtle self-stretch md:self-auto justify-center">
          <button
            onClick={() => setActiveTab('simulator')}
            className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${
              activeTab === 'simulator'
                ? 'bg-primary text-white shadow-sm'
                : 'text-muted hover:text-foreground'
            }`}
          >
            Simulator
          </button>
          <button
            onClick={() => setActiveTab('api-contract')}
            className={`px-3 py-1.5 rounded text-xs font-medium flex items-center gap-1.5 transition-all ${
              activeTab === 'api-contract'
                ? 'bg-primary text-white shadow-sm'
                : 'text-muted hover:text-foreground'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            JSON Contract
          </button>
        </div>
      </div>

      {/* Preset Quick Actions */}
      <div className="bg-surface border border-border-subtle rounded-xl p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Mission Profile Presets</h3>
          </div>
          <span className="text-xs text-muted">Select a template or customize inputs</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {PRESETS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => handleApplyPreset(preset)}
              className={`text-left p-3 rounded-lg border transition-all ${
                selectedPreset === preset.id
                  ? 'border-primary bg-primary-soft/30 ring-1 ring-primary'
                  : 'border-border-subtle bg-background/50 hover:bg-background hover:border-border'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-foreground">{preset.name}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded uppercase font-bold tracking-wider bg-surface border border-border-subtle text-muted">
                  {preset.throttle}
                </span>
              </div>
              <p className="text-xs text-muted mt-1 line-clamp-1">{preset.description}</p>
              <div className="flex items-center gap-3 mt-2 text-[11px] font-mono text-muted">
                <span>{preset.altitude}m</span>
                <span>•</span>
                <span>{preset.temp}°C</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Input Controls & Results */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Hypothetical Conditions Input Form */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-surface border border-border-subtle rounded-xl p-5 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-border-subtle pb-3">
              <div className="flex items-center gap-2">
                <Sliders className="w-5 h-5 text-primary" />
                <h2 className="text-base font-semibold text-foreground">Hypothetical Conditions</h2>
              </div>
              <button
                onClick={handleReset}
                title="Reset to defaults"
                className="text-xs text-muted hover:text-foreground flex items-center gap-1 p-1 hover:bg-background rounded"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset
              </button>
            </div>

            {/* Input 1: Altitude (meters) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-foreground flex items-center gap-1.5">
                  <Gauge className="w-4 h-4 text-primary" />
                  Flight Altitude
                </label>
                <span className="text-xs font-mono font-bold px-2 py-0.5 bg-background rounded border border-border-subtle text-foreground">
                  {altitudeM} m ({Math.round(altitudeM * 3.28084)} ft)
                </span>
              </div>
              <input
                type="range"
                min={500}
                max={7000}
                step={100}
                value={altitudeM}
                onChange={(e) => {
                  setAltitudeM(Number(e.target.value));
                  setSelectedPreset('custom');
                }}
                className="w-full accent-primary h-1.5 bg-border-subtle rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-muted font-mono">
                <span>500m (Low AGL)</span>
                <span>3,500m (Loiter)</span>
                <span>7,000m (Service Ceiling)</span>
              </div>
            </div>

            {/* Input 2: Ambient Temperature (°C) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-foreground flex items-center gap-1.5">
                  <Thermometer className="w-4 h-4 text-primary" />
                  Ambient Temperature (OAT)
                </label>
                <span
                  className={`text-xs font-mono font-bold px-2 py-0.5 bg-background rounded border border-border-subtle ${
                    ambientTempC > 35 ? 'text-danger' : ambientTempC < 0 ? 'text-primary' : 'text-foreground'
                  }`}
                >
                  {ambientTempC > 0 ? `+${ambientTempC}` : ambientTempC}°C
                </span>
              </div>
              <input
                type="range"
                min={-20}
                max={50}
                step={1}
                value={ambientTempC}
                onChange={(e) => {
                  setAmbientTempC(Number(e.target.value));
                  setSelectedPreset('custom');
                }}
                className="w-full accent-primary h-1.5 bg-border-subtle rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-muted font-mono">
                <span>-20°C (Winter High)</span>
                <span>+15°C (ISA Std)</span>
                <span>+50°C (Desert Hot)</span>
              </div>
            </div>

            {/* Input 3: Throttle Profile Selection */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-foreground flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-primary" />
                Throttle Profile Profile
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['conservative', 'normal', 'aggressive'] as ThrottleProfile[]).map((prof) => (
                  <button
                    key={prof}
                    onClick={() => {
                      setThrottleProfile(prof);
                      setSelectedPreset('custom');
                    }}
                    className={`py-2 px-1 rounded-lg text-xs font-medium capitalize border transition-all text-center ${
                      throttleProfile === prof
                        ? 'bg-primary text-white border-primary shadow-sm'
                        : 'bg-background text-muted border-border-subtle hover:text-foreground hover:bg-surface'
                    }`}
                  >
                    {prof}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-muted">
                {throttleProfile === 'conservative' && 'Conservative: Cruise loiter, 55-65% MAP, extends piston longevity.'}
                {throttleProfile === 'normal' && 'Normal: Standard operational patrol, 70-75% MAP nominal climb/cruise.'}
                {throttleProfile === 'aggressive' && 'Aggressive: Maximum continuous power, rapid climb & dash maneuvers.'}
              </p>
            </div>

            {/* Simulation Trigger Button */}
            <div className="pt-2">
              <button
                onClick={handleRunSimulation}
                disabled={isSimulating}
                className="w-full py-2.5 px-4 rounded-lg bg-primary hover:bg-primary/90 text-white font-medium text-xs flex items-center justify-center gap-2 transition-all shadow-sm active:scale-[0.99] disabled:opacity-75"
              >
                {isSimulating ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Evaluating Physical Model...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Re-evaluate Mission Impact</span>
                  </>
                )}
              </button>
              <div className="flex items-center justify-between text-[10px] text-muted mt-2">
                <span>Calculated via DRDO Twin Engine Model</span>
                <span>Updated: {lastSimulatedTime}</span>
              </div>
            </div>
          </div>

          {/* Model Explanatory Physics Note */}
          <div className="bg-surface border border-border-subtle rounded-xl p-4 shadow-sm space-y-2">
            <div className="flex items-center gap-2 text-foreground font-semibold text-xs">
              <Info className="w-4 h-4 text-primary" />
              <span>What-If Physical Principles</span>
            </div>
            <p className="text-xs text-muted leading-relaxed">
              In MALE UAV piston powerplants, altitude directly impacts induction manifold air density, while high ambient temperatures reduce CHT margin and oil viscosity. The digital twin propagates these stresses through cylinder degradation trajectories.
            </p>
          </div>
        </div>

        {/* Right Column: Visualization & Comparative RUL Metrics */}
        <div className="lg:col-span-8 space-y-4">
          {activeTab === 'simulator' ? (
            <>
              {/* Comparative Summary Metrics Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Predicted Simulated RUL Card */}
                <div className="bg-surface border border-border-subtle rounded-xl p-4 shadow-sm flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted">Simulated RUL</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${
                        simulationResult.predicted_rul_cycles >= 5.0
                          ? 'bg-success-soft text-success'
                          : simulationResult.predicted_rul_cycles >= 3.0
                          ? 'bg-warning-soft text-warning'
                          : 'bg-danger-soft text-danger'
                      }`}
                    >
                      {simulationResult.predicted_rul_cycles >= 5.0 ? 'Acceptable' : 'Degraded'}
                    </span>
                  </div>
                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="text-3xl font-bold font-mono text-foreground">
                      {simulationResult.predicted_rul_cycles}
                    </span>
                    <span className="text-xs text-muted font-medium">cycles</span>
                  </div>
                  <div className="mt-2 pt-2 border-t border-border-subtle flex items-center justify-between text-xs">
                    <span className="text-muted">Baseline:</span>
                    <span className="font-mono text-foreground">{simulationResult.baseline_rul_cycles} cycles</span>
                  </div>
                </div>

                {/* Delta / Impact Card */}
                <div className="bg-surface border border-border-subtle rounded-xl p-4 shadow-sm flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted">Condition Impact</span>
                    {deltaCycles < 0 ? (
                      <TrendingDown className="w-4 h-4 text-danger" />
                    ) : deltaCycles > 0 ? (
                      <TrendingUp className="w-4 h-4 text-success" />
                    ) : (
                      <span className="text-xs text-muted font-mono">0%</span>
                    )}
                  </div>
                  <div className="mt-3 flex items-baseline gap-2">
                    <span
                      className={`text-3xl font-bold font-mono ${
                        deltaCycles < 0 ? 'text-danger' : deltaCycles > 0 ? 'text-success' : 'text-muted'
                      }`}
                    >
                      {deltaCycles > 0 ? `+${deltaCycles}` : deltaCycles}
                    </span>
                    <span className="text-xs text-muted font-medium">cycles</span>
                  </div>
                  <div className="mt-2 pt-2 border-t border-border-subtle flex items-center justify-between text-xs">
                    <span className="text-muted">Relative change:</span>
                    <span
                      className={`font-semibold ${
                        deltaCycles < 0 ? 'text-danger' : deltaCycles > 0 ? 'text-success' : 'text-muted'
                      }`}
                    >
                      {deltaPercent > 0 ? `+${deltaPercent}%` : `${deltaPercent}%`}
                    </span>
                  </div>
                </div>

                {/* Stress Index & Thermal Margin */}
                <div className="bg-surface border border-border-subtle rounded-xl p-4 shadow-sm flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted">Engine Stress Factor</span>
                    <ShieldAlert
                      className={`w-4 h-4 ${
                        simulationResult.stress_multiplier > 1.3 ? 'text-danger' : 'text-primary'
                      }`}
                    />
                  </div>
                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="text-3xl font-bold font-mono text-foreground">
                      {simulationResult.stress_multiplier}×
                    </span>
                    <span className="text-xs text-muted font-medium">wear rate</span>
                  </div>
                  <div className="mt-2 pt-2 border-t border-border-subtle flex items-center justify-between text-xs">
                    <span className="text-muted">CHT Margin:</span>
                    <span
                      className={`font-mono font-medium ${
                        simulationResult.thermal_margin_c < 25 ? 'text-danger' : 'text-foreground'
                      }`}
                    >
                      ~{simulationResult.thermal_margin_c}°C to limit
                    </span>
                  </div>
                </div>
              </div>

              {/* Comparative Health Trajectory Chart */}
              <div className="bg-surface border border-border-subtle rounded-xl p-5 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="text-base font-semibold text-foreground">
                      Comparative Health Trajectory (PHI)
                    </h3>
                    <p className="text-xs text-muted">
                      Hypothetical mission degradation curve vs baseline digital twin prediction
                    </p>
                  </div>

                  {/* Chart Legend Summary */}
                  <div className="flex flex-wrap items-center gap-3 text-xs bg-background px-3 py-1.5 rounded-lg border border-border-subtle">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-primary" />
                      <span className="text-muted">Simulated</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                      <span className="text-muted">Baseline</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-0.5 bg-danger" />
                      <span className="text-muted">Failure Threshold (0.35)</span>
                    </div>
                  </div>
                </div>

                {/* Recharts Chart Container */}
                <div className="h-[360px] w-full pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart
                      data={chartData}
                      margin={{ top: 10, right: 25, left: -10, bottom: 20 }}
                    >
                      <defs>
                        <linearGradient id="hypotheticalGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#52738e" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="#52738e" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>

                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="#cbd5e1"
                        opacity={0.4}
                        vertical={false}
                      />

                      <XAxis
                        dataKey="cycle"
                        stroke="#64748b"
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                        label={{
                          value: 'Operating Cycles',
                          position: 'insideBottom',
                          offset: -10,
                          fill: '#64748b',
                          fontSize: 11,
                        }}
                      />

                      <YAxis
                        domain={[0, 1.0]}
                        stroke="#64748b"
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(val) => val.toFixed(1)}
                      />

                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#f8fafc',
                          borderColor: '#cbd5e1',
                          borderRadius: '0.5rem',
                          fontSize: '12px',
                          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                        }}
                        labelFormatter={(cycle) => `Cycle #${cycle}`}
                        formatter={(val: any, name: any) => {
                          if (name === 'hypotheticalPhi') return [val, 'Simulated PHI'];
                          if (name === 'baselinePhi') return [val, 'Baseline PHI'];
                          if (name === 'hypotheticalUpper') return [val, 'Uncertainty Upper'];
                          if (name === 'hypotheticalLower') return [val, 'Uncertainty Lower'];
                          return [val, name];
                        }}
                      />

                      {/* Current Cycle Marker */}
                      <ReferenceLine
                        x={CURRENT_CYCLE}
                        stroke="#64748b"
                        strokeDasharray="3 3"
                        label={{
                          value: 'Current Cycle',
                          position: 'top',
                          fill: '#64748b',
                          fontSize: 11,
                        }}
                      />

                      {/* Failure Threshold Reference Line (§4.5: 0.35) */}
                      <ReferenceLine
                        y={FAILURE_THRESHOLD_PHI}
                        stroke="#a86b73"
                        strokeDasharray="4 4"
                        strokeWidth={1.8}
                        label={{
                          value: 'Failure Threshold (PHI = 0.35)',
                          position: 'insideTopLeft',
                          fill: '#a86b73',
                          fontSize: 11,
                        }}
                      />

                      {/* Uncertainty Area Envelope */}
                      <Area
                        type="monotone"
                        dataKey="hypotheticalUpper"
                        stroke="none"
                        fill="url(#hypotheticalGrad)"
                        isAnimationActive={false}
                      />
                      <Area
                        type="monotone"
                        dataKey="hypotheticalLower"
                        stroke="none"
                        fill="#f8fafc"
                        isAnimationActive={false}
                      />

                      {/* Baseline Trajectory Line */}
                      <Line
                        type="monotone"
                        dataKey="baselinePhi"
                        stroke="#94a3b8"
                        strokeWidth={2}
                        strokeDasharray="4 4"
                        dot={false}
                        name="Baseline PHI"
                        isAnimationActive={false}
                      />

                      {/* Hypothetical Simulated Line */}
                      <Line
                        type="monotone"
                        dataKey="hypotheticalPhi"
                        stroke="#52738e"
                        strokeWidth={2.5}
                        dot={{ r: 3, fill: '#52738e' }}
                        activeDot={{ r: 5 }}
                        name="Simulated PHI"
                        isAnimationActive={false}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>

                {/* Dynamic Confidence & Mission Recommendation Box */}
                <div className="bg-background rounded-lg p-3 border border-border-subtle flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                  <div className="text-xs space-y-1">
                    <p className="font-semibold text-foreground">
                      Confidence & Operational Verdict
                    </p>
                    <p className="text-muted">
                      {simulationResult.confidence_note}
                    </p>
                    <p className="text-muted pt-1">
                      <span className="font-medium text-foreground">Mission Feasibility:</span>{' '}
                      {simulationResult.predicted_rul_cycles > 3.0 ? (
                        <span className="text-success font-medium">
                          GO for 1-2 standard sorties without exceeding maintenance threshold.
                        </span>
                      ) : (
                        <span className="text-danger font-medium">
                          CAUTION: Projected failure within {simulationResult.predicted_rul_cycles} cycles. Recommend pre-flight cylinder inspection.
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* Backend API Contract View (§4.5 and §6) */
            <div className="bg-surface border border-border-subtle rounded-xl p-5 shadow-sm space-y-5">
              <div className="flex items-center justify-between border-b border-border-subtle pb-3">
                <div className="flex items-center gap-2">
                  <Code2 className="w-5 h-5 text-primary" />
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">
                      Backend Integration Contract (§4.5 & §6)
                    </h3>
                    <p className="text-xs text-muted">
                      Exact JSON payloads for seamless Phase 7 backend attachment
                    </p>
                  </div>
                </div>
                <span className="text-xs px-2 py-0.5 rounded bg-success-soft text-success font-mono font-medium flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Spec Ready
                </span>
              </div>

              {/* Request Payload */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-foreground font-mono">
                    POST /api/mission/what-if (Request)
                  </span>
                  <span className="text-[11px] text-muted">Active Input Payload</span>
                </div>
                <pre className="p-3 rounded-lg bg-foreground text-background font-mono text-xs overflow-x-auto">
{JSON.stringify(
  {
    altitude_m: altitudeM,
    ambient_temp_c: ambientTempC,
    throttle_profile: throttleProfile,
  },
  null,
  2
)}
                </pre>
              </div>

              {/* Response Payload */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-foreground font-mono">
                    200 OK (Response Payload matching §4.5)
                  </span>
                  <span className="text-[11px] text-muted">Live Simulated Output</span>
                </div>
                <pre className="p-3 rounded-lg bg-foreground text-background font-mono text-xs overflow-x-auto max-h-[220px]">
{JSON.stringify(
  {
    t: simulationResult.t,
    predicted_rul_cycles: simulationResult.predicted_rul_cycles,
    health_index: simulationResult.health_index,
    health_trajectory: simulationResult.health_trajectory.slice(0, 5),
    confidence_note: simulationResult.confidence_note,
    failure_threshold_phi: simulationResult.failure_threshold_phi,
  },
  null,
  2
)}
                </pre>
              </div>

              <div className="p-3 rounded-lg bg-background border border-border-subtle text-xs text-muted space-y-1">
                <span className="font-semibold text-foreground">Integration Instruction:</span>
                <p>
                  When backend Phase 7 deploys, replace the internal{' '}
                  <code className="px-1 py-0.5 rounded bg-surface border border-border-subtle font-mono text-foreground">
                    simulateMissionWhatIf
                  </code>{' '}
                  call with a fetch request to the designated microservice. The state management, chart render paths, and contract shapes are identical.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WhatIfPanel;
