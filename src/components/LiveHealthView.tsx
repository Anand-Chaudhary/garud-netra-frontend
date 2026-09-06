'use client';

import React, { useState, useEffect } from 'react';

// Types based on the specification
interface SensorReading {
  t: number;
  rpm: number;
  cht: number[]; // 4 elements for cylinders 1-4
  egt: number[]; // 4 elements for cylinders 1-4
  oil_pressure: number;
  oil_temp: number;
  fuel_flow: number;
  vibration_amplitude: number;
  battery_voltage: number;
  injection_timing: number;
}

interface HealthData {
  t: number;
  channels: {
    rpm: { residual: number; tau: number; health: number };
    cht_1: { residual: number; tau: number; health: number };
    cht_2: { residual: number; tau: number; health: number };
    cht_3: { residual: number; tau: number; health: number };
    cht_4: { residual: number; tau: number; health: number };
    egt_1: { residual: number; tau: number; health: number };
    egt_2: { residual: number; tau: number; health: number };
    egt_3: { residual: number; tau: number; health: number };
    egt_4: { residual: number; tau: number; health: number };
    oil_pressure: { residual: number; tau: number; health: number };
    oil_temp: { residual: number; tau: number; health: number };
    fuel_flow: { residual: number; tau: number; health: number };
    vibration_amplitude: { residual: number; tau: number; health: number };
    battery_voltage: { residual: number; tau: number; health: number };
    injection_timing: { residual: number; tau: number; health: number };
  };
}

// Helper function to get health color based on value (0-1 scale)
const getHealthColor = (health: number): string => {
  if (health >= 0.9) return 'bg-success';
  if (health >= 0.7) return 'bg-warning';
  return 'bg-danger';
};

// Helper function to get health label based on value
const getHealthLabel = (health: number): string => {
  if (health >= 0.9) return 'Healthy';
  if (health >= 0.7) return 'Warning';
  return 'Critical';
};

const getCylinderHealth = (
  channels: HealthData['channels'],
  sensor: 'cht' | 'egt',
  cylinder: number
): number => {
  const channel = `${sensor}_${cylinder}` as keyof HealthData['channels'];
  return channels[channel].health;
};

const LiveHealthView: React.FC = () => {
  const [sensorData, setSensorData] = useState<SensorReading | null>(null);
  const [healthData, setHealthData] = useState<HealthData | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);

  // Simulate data fetching - in real implementation, this would connect to backend
  useEffect(() => {
    // For now, we'll simulate fetching data every 500ms (2Hz as recommended in spec)
    const interval = setInterval(() => {
      // Simulate receiving data from backend
      // In reality, this would be replaced with actual API calls
      const mockSensorData: SensorReading = {
        t: Date.now() / 1000, // seconds since start
        rpm: 2400 + Math.random() * 100,
        cht: [
          148 + Math.random() * 10,
          142 + Math.random() * 10,
          152 + Math.random() * 10,
          149 + Math.random() * 10
        ],
        egt: [
          742 + Math.random() * 20,
          738 + Math.random() * 20,
          745 + Math.random() * 20,
          740 + Math.random() * 20
        ],
        oil_pressure: 75 + Math.random() * 10,
        oil_temp: 70 + Math.random() * 15,
        fuel_flow: 22 + Math.random() * 5,
        vibration_amplitude: 0.5 + Math.random() * 0.2,
        battery_voltage: 14 + Math.random() * 0.5,
        injection_timing: 24 + Math.random() * 2
      };

      setSensorData(mockSensorData);

      // Generate corresponding health data (simplified for now)
      const mockHealthData: HealthData = {
        t: mockSensorData.t,
        channels: {
          rpm: { residual: (mockSensorData.rpm - 2400) * 0.1, tau: 50, health: Math.max(0, 1 - Math.abs(mockSensorData.rpm - 2400) / 200) },
          cht_1: { residual: mockSensorData.cht[0] - 148, tau: 5, health: Math.max(0, 1 - Math.abs(mockSensorData.cht[0] - 148) / 20) },
          cht_2: { residual: mockSensorData.cht[1] - 142, tau: 5, health: Math.max(0, 1 - Math.abs(mockSensorData.cht[1] - 142) / 20) },
          cht_3: { residual: mockSensorData.cht[2] - 152, tau: 5, health: Math.max(0, 1 - Math.abs(mockSensorData.cht[2] - 152) / 20) },
          cht_4: { residual: mockSensorData.cht[3] - 149, tau: 5, health: Math.max(0, 1 - Math.abs(mockSensorData.cht[3] - 149) / 20) },
          egt_1: { residual: mockSensorData.egt[0] - 742, tau: 10, health: Math.max(0, 1 - Math.abs(mockSensorData.egt[0] - 742) / 100) },
          egt_2: { residual: mockSensorData.egt[1] - 738, tau: 10, health: Math.max(0, 1 - Math.abs(mockSensorData.egt[1] - 738) / 100) },
          egt_3: { residual: mockSensorData.egt[2] - 745, tau: 10, health: Math.max(0, 1 - Math.abs(mockSensorData.egt[2] - 745) / 100) },
          egt_4: { residual: mockSensorData.egt[3] - 740, tau: 10, health: Math.max(0, 1 - Math.abs(mockSensorData.egt[3] - 740) / 100) },
          oil_pressure: { residual: mockSensorData.oil_pressure - 75, tau: 5, health: Math.max(0, 1 - Math.abs(mockSensorData.oil_pressure - 75) / 30) },
          oil_temp: { residual: mockSensorData.oil_temp - 70, tau: 5, health: Math.max(0, 1 - Math.abs(mockSensorData.oil_temp - 70) / 30) },
          fuel_flow: { residual: mockSensorData.fuel_flow - 22, tau: 2, health: Math.max(0, 1 - Math.abs(mockSensorData.fuel_flow - 22) / 10) },
          vibration_amplitude: { residual: mockSensorData.vibration_amplitude - 0.5, tau: 0.2, health: Math.max(0, 1 - Math.abs(mockSensorData.vibration_amplitude - 0.5) / 0.5) },
          battery_voltage: { residual: mockSensorData.battery_voltage - 14, tau: 0.5, health: Math.max(0, 1 - Math.abs(mockSensorData.battery_voltage - 14) / 2) },
          injection_timing: { residual: mockSensorData.injection_timing - 24, tau: 1, health: Math.max(0, 1 - Math.abs(mockSensorData.injection_timing - 24) / 2) }
        }
      };

      setHealthData(mockHealthData);
      setIsConnected(true);
    }, 500); // 2Hz update rate as recommended in spec

    return () => clearInterval(interval);
  }, []);

  if (!isConnected) {
    return (
      <div className="p-6 text-center">
        <div className="animate-spin rounded-full border-4 border-primary border-t-transparent h-12 w-12 mx-auto mb-4"></div>
        <p className="text-muted">Connecting to engine data stream...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Engine Overall Status */}
      <div className="bg-surface border border-border-subtle rounded-lg p-4 shadow-sm">
        <h2 className="text-lg font-semibold mb-4 flex items-center justify-between">
          Engine Overall Status
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${(healthData?.channels?.rpm?.health || 0) >= 0.9 ? 'bg-success-soft text-success' :
                           (healthData?.channels?.rpm?.health || 0) >= 0.7 ? 'bg-warning-soft text-warning' :
                           'bg-danger-soft text-danger'}`}>
            {(healthData?.channels?.rpm?.health || 0) >= 0.9 ? 'Normal' :
             (healthData?.channels?.rpm?.health || 0) >= 0.7 ? 'Caution' : 'Alert'}
          </span>
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted">RPM</p>
            <p className="text-2xl font-mono">{sensorData?.rpm.toFixed(1)}</p>
          </div>
          <div>
            <p className="text-sm text-muted">Health</p>
            <div className="w-full bg-border-subtle rounded-full h-2.5">
              <div className={`h-full rounded-full transition-all duration-300 ${getHealthColor(healthData?.channels?.rpm?.health || 0)}`}
                   style={{ width: `${(healthData?.channels?.rpm?.health || 0) * 100}%` }}></div>
            </div>
            <p className="text-xs text-muted mt-1">{getHealthLabel(healthData?.channels?.rpm?.health || 0)}</p>
          </div>
        </div>
      </div>

      {/* Per-Cylinder Monitoring */}
      <div className="bg-surface border border-border-subtle rounded-lg p-4 shadow-sm">
        <h2 className="text-lg font-semibold mb-4">Per-Cylinder Monitoring</h2>
        <div className="grid grid-cols-2 gap-4">
          {/* CHT Temperatures */}
          <div>
            <h3 className="text-md font-medium mb-2">CHT (°C)</h3>
            <div className="space-y-2">
              {healthData?.channels.cht_1 && healthData?.channels.cht_2 && healthData?.channels.cht_3 && healthData?.channels.cht_4 &&
                [
                  { label: 'Cyl 1', index: 1 },
                  { label: 'Cyl 2', index: 2 },
                  { label: 'Cyl 3', index: 3 },
                  { label: 'Cyl 4', index: 4 }
                ].map((cyl, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <span className="text-sm">{cyl.label}</span>
                    <div className="flex-1 mx-3">
                      <div className="w-full bg-border-subtle rounded-full h-2">
                        <div className={`h-full rounded-full transition-all duration-300 ${getHealthColor(healthData ? getCylinderHealth(healthData.channels, 'cht', cyl.index) : 0)}`}
                             style={{ width: `${(healthData ? getCylinderHealth(healthData.channels, 'cht', cyl.index) : 0) * 100}%` }}></div>
                      </div>
                    </div>
                    <span className="text-xs font-mono">{sensorData?.cht[cyl.index - 1].toFixed(1)}°C</span>
                  </div>
                ))}
            </div>
          </div>

          {/* EGT Temperatures */}
          <div>
            <h3 className="text-md font-medium mb-2">EGT (°C)</h3>
            <div className="space-y-2">
              {healthData?.channels.egt_1 && healthData?.channels.egt_2 && healthData?.channels.egt_3 && healthData?.channels.egt_4 &&
                [
                  { label: 'Cyl 1', index: 1 },
                  { label: 'Cyl 2', index: 2 },
                  { label: 'Cyl 3', index: 3 },
                  { label: 'Cyl 4', index: 4 }
                ].map((cyl, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <span className="text-sm">{cyl.label}</span>
                    <div className="flex-1 mx-3">
                      <div className="w-full bg-border-subtle rounded-full h-2">
                        <div className={`h-full rounded-full transition-all duration-300 ${getHealthColor(healthData ? getCylinderHealth(healthData.channels, 'egt', cyl.index) : 0)}`}
                             style={{ width: `${(healthData ? getCylinderHealth(healthData.channels, 'egt', cyl.index) : 0) * 100}%` }}></div>
                      </div>
                    </div>
                    <span className="text-xs font-mono">{sensorData?.egt[cyl.index - 1].toFixed(1)}°C</span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>

      {/* System Monitoring */}
      <div className="bg-surface border border-border-subtle rounded-lg p-4 shadow-sm">
        <h2 className="text-lg font-semibold mb-4 flex items-center justify-between">
          System Monitoring
          <span className="text-xs text-muted">Last updated: {new Date((sensorData?.t || 0) * 1000).toLocaleTimeString()}</span>
        </h2>
        <div className="grid grid-cols-3 gap-4">
          {/* Fluids & Pressure */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Oil Pressure</span>
              <span className="text-xs font-mono">{sensorData?.oil_pressure?.toFixed(1)} psi</span>
            </div>
            <div className="w-full bg-border-subtle rounded-full h-2">
              <div className={`h-full rounded-full transition-all duration-300 ${getHealthColor(healthData?.channels?.oil_pressure?.health || 0)}`}
                   style={{ width: `${(healthData?.channels?.oil_pressure?.health || 0) * 100}%` }}></div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm">Oil Temp</span>
              <span className="text-xs font-mono">{sensorData?.oil_temp?.toFixed(1)}°C</span>
            </div>
            <div className="w-full bg-border-subtle rounded-full h-2">
              <div className={`h-full rounded-full transition-all duration-300 ${getHealthColor(healthData?.channels?.oil_temp?.health || 0)}`}
                   style={{ width: `${(healthData?.channels?.oil_temp?.health || 0) * 100}%` }}></div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm">Fuel Flow</span>
              <span className="text-xs font-mono">{sensorData?.fuel_flow?.toFixed(1)} GPH</span>
            </div>
            <div className="w-full bg-border-subtle rounded-full h-2">
              <div className={`h-full rounded-full transition-all duration-300 ${getHealthColor(healthData?.channels?.fuel_flow?.health || 0)}`}
                   style={{ width: `${(healthData?.channels?.fuel_flow?.health || 0) * 100}%` }}></div>
            </div>
          </div>

          {/* Electrical & Vibration */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Battery Voltage</span>
              <span className="text-xs font-mono">{sensorData?.battery_voltage?.toFixed(2)} V</span>
            </div>
            <div className="w-full bg-border-subtle rounded-full h-2">
              <div className={`h-full rounded-full transition-all duration-300 ${getHealthColor(healthData?.channels?.battery_voltage?.health || 0)}`}
                   style={{ width: `${(healthData?.channels?.battery_voltage?.health || 0) * 100}%` }}></div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm">Vibration</span>
              <span className="text-xs font-mono">{sensorData?.vibration_amplitude?.toFixed(3)} in/s</span>
            </div>
            <div className="w-full bg-border-subtle rounded-full h-2">
              <div className={`h-full rounded-full transition-all duration-300 ${getHealthColor(healthData?.channels?.vibration_amplitude?.health || 0)}`}
                   style={{ width: `${(healthData?.channels?.vibration_amplitude?.health || 0) * 100}%` }}></div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm">Injection Timing</span>
              <span className="text-xs font-mono">{sensorData?.injection_timing?.toFixed(1)}° BTDC</span>
            </div>
            <div className="w-full bg-border-subtle rounded-full h-2">
              <div className={`h-full rounded-full transition-all duration-300 ${getHealthColor(healthData?.channels?.injection_timing?.health || 0)}`}
                   style={{ width: `${(healthData?.channels?.injection_timing?.health || 0) * 100}%` }}></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveHealthView;