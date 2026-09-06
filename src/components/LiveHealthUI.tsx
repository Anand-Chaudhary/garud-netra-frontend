import React from 'react';

export interface SensorReading {
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

export interface HealthData {
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

export const getHealthColor = (health: number): string => {
  if (health >= 0.9) return 'bg-success';
  if (health >= 0.7) return 'bg-warning';
  return 'bg-danger';
};

export const getHealthLabel = (health: number): string => {
  if (health >= 0.9) return 'Healthy';
  if (health >= 0.7) return 'Warning';
  return 'Critical';
};

export const getCylinderHealth = (
  channels: HealthData['channels'],
  sensor: 'cht' | 'egt',
  cylinder: number
): number => {
  const channel = `${sensor}_${cylinder}` as keyof HealthData['channels'];
  return channels[channel].health;
};

interface LiveHealthUIProps {
  sensorData: SensorReading | null;
  healthData: HealthData | null;
}

const LiveHealthUI: React.FC<LiveHealthUIProps> = ({ sensorData, healthData }) => {
  if (!sensorData || !healthData) {
    return (
      <div className="p-6 text-center">
        <div className="animate-spin rounded-full border-4 border-primary border-t-transparent h-12 w-12 mx-auto mb-4"></div>
        <p className="text-muted">Loading engine data...</p>
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
          <span className="text-xs text-muted">Time: {sensorData?.t.toFixed(1)}s</span>
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

export default LiveHealthUI;
