'use client';

import React, { useState, useEffect } from 'react';
import LiveHealthUI, { SensorReading, HealthData } from './LiveHealthUI';

const LiveHealthView: React.FC = () => {
  const [sensorData, setSensorData] = useState<SensorReading | null>(null);
  const [healthData, setHealthData] = useState<HealthData | null>(null);

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
    }, 500); // 2Hz update rate as recommended in spec

    return () => clearInterval(interval);
  }, []);

  return <LiveHealthUI sensorData={sensorData} healthData={healthData} />;
};

export default LiveHealthView;