'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, FastForward, Rewind, SkipBack, SkipForward } from 'lucide-react';
import LiveHealthUI, { SensorReading, HealthData } from './LiveHealthUI';

const FLIGHTS = [
  { id: 'FLT-101', name: 'Flight 101', label: 'Healthy Baseline' },
  { id: 'FLT-102', name: 'Flight 102', label: 'Misfire (Cyl 3)' },
  { id: 'FLT-103', name: 'Flight 103', label: 'Sensor Drift (Oil Press)' },
  { id: 'FLT-104', name: 'Flight 104', label: 'Overheating (Cyl 1)' }
];

const FLIGHT_DURATION = 1200; // 20 minutes in seconds

const generateReplayData = (flightId: string, t: number): { sensor: SensorReading, health: HealthData } => {
  // Base healthy values
  const sensor: SensorReading = {
    t,
    rpm: 2400 + Math.sin(t / 10) * 50 + (Math.random() - 0.5) * 20,
    cht: [148, 142, 152, 149].map(v => v + (Math.random() - 0.5) * 2),
    egt: [742, 738, 745, 740].map(v => v + (Math.random() - 0.5) * 5),
    oil_pressure: 75 + (Math.random() - 0.5) * 2,
    oil_temp: 70 + (t / 1200) * 15 + (Math.random() - 0.5) * 1, // Slow warmup
    fuel_flow: 22 + (Math.random() - 0.5) * 1,
    vibration_amplitude: 0.5 + (Math.random() - 0.5) * 0.1,
    battery_voltage: 14.1 + (Math.random() - 0.5) * 0.1,
    injection_timing: 24 + (Math.random() - 0.5) * 0.2
  };

  const health: HealthData = {
    t,
    channels: {
      rpm: { residual: 0, tau: 50, health: 1.0 },
      cht_1: { residual: 0, tau: 5, health: 1.0 },
      cht_2: { residual: 0, tau: 5, health: 1.0 },
      cht_3: { residual: 0, tau: 5, health: 1.0 },
      cht_4: { residual: 0, tau: 5, health: 1.0 },
      egt_1: { residual: 0, tau: 10, health: 1.0 },
      egt_2: { residual: 0, tau: 10, health: 1.0 },
      egt_3: { residual: 0, tau: 10, health: 1.0 },
      egt_4: { residual: 0, tau: 10, health: 1.0 },
      oil_pressure: { residual: 0, tau: 5, health: 1.0 },
      oil_temp: { residual: 0, tau: 5, health: 1.0 },
      fuel_flow: { residual: 0, tau: 2, health: 1.0 },
      vibration_amplitude: { residual: 0, tau: 0.2, health: 1.0 },
      battery_voltage: { residual: 0, tau: 0.5, health: 1.0 },
      injection_timing: { residual: 0, tau: 1, health: 1.0 }
    }
  };

  // Inject faults based on flight ID
  if (t > 300) { // Faults manifest after 5 minutes
    const severity = Math.min(1.0, (t - 300) / 300); // Ramps up over 5 mins
    
    if (flightId === 'FLT-102') { // Misfire (Cyl 3)
      sensor.egt[2] -= 150 * severity; // Drop EGT
      sensor.vibration_amplitude += 1.5 * severity; // Increase vibration
      
      health.channels.egt_3.health = Math.max(0, 1.0 - severity);
      health.channels.vibration_amplitude.health = Math.max(0, 1.0 - (severity * 0.8));
    } else if (flightId === 'FLT-103') { // Sensor Drift (Oil Press)
      sensor.oil_pressure -= 30 * severity; 
      health.channels.oil_pressure.health = Math.max(0, 1.0 - severity);
    } else if (flightId === 'FLT-104') { // Overheating (Cyl 1)
      sensor.cht[0] += 50 * severity;
      health.channels.cht_1.health = Math.max(0, 1.0 - severity);
    }
  }

  return { sensor, health };
};

const formatTime = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

const ReplayDashboard: React.FC = () => {
  const [selectedFlight, setSelectedFlight] = useState(FLIGHTS[0].id);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [currentTime, setCurrentTime] = useState(0); // in seconds
  
  const [sensorData, setSensorData] = useState<SensorReading | null>(null);
  const [healthData, setHealthData] = useState<HealthData | null>(null);

  const requestRef = useRef<number | undefined>(undefined);
  const lastUpdateRef = useRef<number | undefined>(undefined);

  // Update data based on current time
  useEffect(() => {
    const { sensor, health } = generateReplayData(selectedFlight, currentTime);
    setSensorData(sensor);
    setHealthData(health);
  }, [currentTime, selectedFlight]);

  // Handle Playback loop
  useEffect(() => {
    if (!isPlaying) {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      return;
    }

    const animate = (time: number) => {
      if (!lastUpdateRef.current) lastUpdateRef.current = time;
      
      const deltaTime = (time - lastUpdateRef.current) / 1000; // in seconds
      lastUpdateRef.current = time;

      setCurrentTime(prevTime => {
        const nextTime = prevTime + deltaTime * playbackSpeed;
        if (nextTime >= FLIGHT_DURATION) {
          setIsPlaying(false);
          return FLIGHT_DURATION;
        }
        return nextTime;
      });

      requestRef.current = requestAnimationFrame(animate);
    };

    lastUpdateRef.current = performance.now();
    requestRef.current = requestAnimationFrame(animate);

    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isPlaying, playbackSpeed]);

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentTime(Number(e.target.value));
  };

  const handleFlightChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedFlight(e.target.value);
    setCurrentTime(0);
    setIsPlaying(false);
  };

  return (
    <div className="space-y-6">
      
      {/* Replay Controls Panel */}
      <div className="bg-surface border border-border-subtle rounded-xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          
          <div className="flex-1">
            <label className="block text-sm font-medium text-muted mb-1">Select Historical Flight</label>
            <select 
              value={selectedFlight}
              onChange={handleFlightChange}
              className="bg-background border border-border-subtle text-foreground rounded-lg p-2.5 w-full max-w-xs focus:ring-primary focus:border-primary"
            >
              {FLIGHTS.map(f => (
                <option key={f.id} value={f.id}>{f.name} - {f.label}</option>
              ))}
            </select>
          </div>
          
          <div className="flex items-center gap-4 bg-background p-2 rounded-xl border border-border-subtle">
            <button 
              onClick={() => setCurrentTime(0)}
              className="p-2 text-muted hover:text-foreground hover:bg-surface rounded-lg transition-colors"
              title="Restart"
            >
              <SkipBack className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setCurrentTime(Math.max(0, currentTime - 10))}
              className="p-2 text-muted hover:text-foreground hover:bg-surface rounded-lg transition-colors"
              title="Rewind 10s"
            >
              <Rewind className="w-5 h-5" />
            </button>
            
            <button 
              onClick={() => setIsPlaying(!isPlaying)}
              className="p-3 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-colors shadow-sm mx-2"
            >
              {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-0.5" />}
            </button>
            
            <button 
              onClick={() => setCurrentTime(Math.min(FLIGHT_DURATION, currentTime + 10))}
              className="p-2 text-muted hover:text-foreground hover:bg-surface rounded-lg transition-colors"
              title="Forward 10s"
            >
              <FastForward className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setCurrentTime(FLIGHT_DURATION)}
              className="p-2 text-muted hover:text-foreground hover:bg-surface rounded-lg transition-colors"
              title="Skip to End"
            >
              <SkipForward className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-muted">Speed:</label>
            <select 
              value={playbackSpeed}
              onChange={(e) => setPlaybackSpeed(Number(e.target.value))}
              className="bg-background border border-border-subtle text-foreground rounded-lg p-1.5 focus:ring-primary focus:border-primary"
            >
              <option value={0.5}>0.5x</option>
              <option value={1}>1.0x</option>
              <option value={2}>2.0x</option>
              <option value={4}>4.0x</option>
              <option value={10}>10.0x</option>
            </select>
          </div>
        </div>

        {/* Timeline Slider */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm font-medium text-foreground">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(FLIGHT_DURATION)}</span>
          </div>
          <input 
            type="range" 
            min={0} 
            max={FLIGHT_DURATION} 
            step={0.1}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-2 bg-border-subtle rounded-lg appearance-none cursor-pointer accent-primary"
          />
        </div>
      </div>

      {/* Shared Health Visualization */}
      <div className="opacity-90">
        <LiveHealthUI sensorData={sensorData} healthData={healthData} />
      </div>
      
    </div>
  );
};

export default ReplayDashboard;
