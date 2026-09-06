'use client';

import React, { useState, useEffect } from 'react';

// Types based on the specification
interface FaultClassification {
  t: number;
  predicted_class: string;
  class_probabilities: {
    healthy: number;
    misfire: number;
    clogged_injector: number;
    general_wear: number;
    poor_lubrication: number;
    sensor_drift: number;
    rough_combustion: number;
    overheating: number;
    abnormal_vibration: number;
  };
  trajectory_check: {
    fired: boolean;
    affected_cylinder?: number;
    peak_sigma?: number;
    sustained_seconds?: number;
    verdict_text: string;
  };
}

interface SensorVsMechanical {
  t: number;
  flagged_channel?: string;
  verdict: 'MECHANICAL' | 'SENSOR' | 'AMBIGUOUS';
  p_mechanical?: number;
  p_sensor?: number;
  reason: string;
  affected_channels?: string[];
}

interface AlertFeedItem {
  id: string;
  t: number;
  severity: 'low' | 'medium' | 'high';
  fault_type: string;
  affected: string[];
  verdict: 'MECHANICAL' | 'SENSOR' | 'AMBIGUOUS';
  explanation: string;
  status: 'active' | 'resolved';
}

// Helper function to get verdict color
const getVerdictColor = (verdict: 'MECHANICAL' | 'SENSOR' | 'AMBIGUOUS'): string => {
  switch (verdict) {
    case 'MECHANICAL':
      return 'bg-red-100 text-red-800';
    case 'SENSOR':
      return 'bg-blue-100 text-blue-800';
    case 'AMBIGUOUS':
      return 'bg-yellow-100 text-yellow-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

// Helper function to get severity color
const getSeverityColor = (severity: 'low' | 'medium' | 'high'): string => {
  switch (severity) {
    case 'low':
      return 'border-l-4 border-yellow-400 bg-yellow-50';
    case 'medium':
      return 'border-l-4 border-orange-400 bg-orange-50';
    case 'high':
      return 'border-l-4 border-red-400 bg-red-50';
    default:
      return 'border-l-4 border-gray-400 bg-gray-50';
  }
};

const ActiveAlerts: React.FC = () => {
  const [alerts, setAlerts] = useState<AlertFeedItem[]>([]);
  const [faultClassification, setFaultClassification] = useState<FaultClassification | null>(null);
  const [sensorVsMechanical, setSensorVsMechanical] = useState<SensorVsMechanical | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);

  // Simulate data fetching - in real implementation, this would connect to backend
  useEffect(() => {
    // For now, we'll simulate receiving data every 2 seconds
    const interval = setInterval(() => {
      // Simulate receiving fault classification data
      const faultTypes: Array<keyof FaultClassification['class_probabilities']> = ['healthy', 'misfire', 'clogged_injector', 'general_wear', 'poor_lubrication', 'sensor_drift', 'rough_combustion', 'overheating', 'abnormal_vibration'];
      const randomFault = faultTypes[Math.floor(Math.random() * faultTypes.length)];

      // Generate class probabilities that sum to ~1
      const probs: FaultClassification['class_probabilities'] = {
        healthy: 0,
        misfire: 0,
        clogged_injector: 0,
        general_wear: 0,
        poor_lubrication: 0,
        sensor_drift: 0,
        rough_combustion: 0,
        overheating: 0,
        abnormal_vibration: 0
      };
      let remaining = 1;
      faultTypes.forEach((type, index) => {
        if (index === faultTypes.length - 1) {
          probs[type] = parseFloat(remaining.toFixed(2));
        } else {
          const random = Math.random() * remaining;
          probs[type] = parseFloat(random.toFixed(2));
          remaining -= random;
        }
      });

      // Adjust to make sure they sum to 1
      let sum: number = Object.values(probs).reduce<number>((a: number, b: number) => a + b, 0);
      faultTypes.forEach(key => {
        probs[key] = parseFloat((probs[key] / sum).toFixed(2));
      });

      // Boost the predicted class probability
      probs[randomFault] = Math.min(0.95, probs[randomFault] + 0.3);
      // Renormalize
      sum = Object.values(probs).reduce<number>((a: number, b: number) => a + b, 0);
      faultTypes.forEach(key => {
        probs[key] = parseFloat((probs[key] / sum).toFixed(2));
      });

      const mockFaultClassification: FaultClassification = {
        t: Date.now() / 1000,
        predicted_class: randomFault,
        class_probabilities: probs,
        trajectory_check: {
          fired: Math.random() > 0.7, // 30% chance of no trajectory check firing
          affected_cylinder: Math.random() > 0.7 ? Math.floor(Math.random() * 4) + 1 : undefined,
          peak_sigma: Math.random() > 0.7 ? Math.floor(Math.random() * 300) : undefined,
          sustained_seconds: Math.random() > 0.7 ? Math.floor(Math.random() * 1000) : undefined,
          verdict_text: Math.random() > 0.7
            ? `cylinder ${Math.floor(Math.random() * 4) + 1} EGT ran cold of its siblings from t=${Math.floor(Math.random() * 800)}s (peak ${Math.floor(Math.random() * 300)} sigma, sustained ${Math.floor(Math.random() * 1000)}s)`
            : 'all cylinders track together; no per-cylinder divergence'
        }
      };

      setFaultClassification(mockFaultClassification);

      // Simulate receiving sensor vs mechanical data
      const verdictOptions: ('MECHANICAL' | 'SENSOR' | 'AMBIGUOUS')[] = ['MECHANICAL', 'SENSOR', 'AMBIGUOUS'];
      const randomVerdict = verdictOptions[Math.floor(Math.random() * verdictOptions.length)];

      let affectedChannels: string[] = [];
      let flaggedChannel: string | undefined;
      let reason: string;

      if (randomVerdict === 'MECHANICAL') {
        flaggedChannel = ['egt_1', 'egt_2', 'egt_3', 'egt_4'][Math.floor(Math.random() * 4)];
        affectedChannels = [flaggedChannel, `cht_${flaggedChannel.charAt(3)}`];
        reason = `anomaly is confined to '${flaggedChannel}' plus its known coupling into ${affectedChannels.slice(1).join(', ')}`;
      } else if (randomVerdict === 'SENSOR') {
        flaggedChannel = ['vibration_amplitude', 'oil_pressure', 'battery_voltage'][Math.floor(Math.random() * 3)];
        affectedChannels = [flaggedChannel];
        reason = `anomaly is isolated to '${flaggedChannel}' with no cross-coupling to other channels`;
      } else { // AMBIGUOUS
        flaggedChannel = ['egt_2', 'vibration_amplitude'][Math.floor(Math.random() * 2)];
        affectedChannels = [flaggedChannel, 'oil_temp', 'rpm'];
        reason = `'rough_combustion' and a drifting '${flaggedChannel}' sensor predict the same residual pattern; they are not separable from this evidence`;
      }

      const mockSensorVsMechanical: SensorVsMechanical = {
        t: Date.now() / 1000,
        flagged_channel: flaggedChannel,
        verdict: randomVerdict,
        p_mechanical: randomVerdict === 'MECHANICAL' ? 0.8 + Math.random() * 0.2 :
                   randomVerdict === 'SENSOR' ? 0.1 + Math.random() * 0.2 :
                   0.3 + Math.random() * 0.4,
        p_sensor: randomVerdict === 'SENSOR' ? 0.8 + Math.random() * 0.2 :
                  randomVerdict === 'MECHANICAL' ? 0.1 + Math.random() * 0.2 :
                  0.3 + Math.random() * 0.4,
        reason: reason,
        affected_channels: affectedChannels
      };

      setSensorVsMechanical(mockSensorVsMechanical);

      // Generate alert if there's a fault or if we want to show the "all clear" status
      if (randomFault !== 'healthy' || Math.random() > 0.8) { // Sometimes show healthy state
        const alertId = `alert_${Math.floor(Math.random() * 100000)}`;
        const severity: 'low' | 'medium' | 'high' =
          randomFault === 'misfire' || randomFault === 'rough_combustion' ? 'high' :
          randomFault === 'clogged_injector' || randomFault === 'poor_lubrication' || randomFault === 'sensor_drift' ? 'medium' :
          'low';

        const newAlert: AlertFeedItem = {
          id: alertId,
          t: Date.now() / 1000,
          severity: severity,
          fault_type: randomFault,
          affected: randomFault === 'healthy' ? [] : [`cylinder ${Math.floor(Math.random() * 4) + 1}`],
          verdict: randomVerdict,
          explanation: mockFaultClassification.trajectory_check.verdict_text,
          status: 'active'
        };

        // Add new alert to the beginning of the list
        setAlerts(prev => [newAlert, ...prev.slice(0, 4)]); // Keep max 5 alerts
      }

      setIsConnected(true);
    }, 2000); // Update every 2 seconds

    return () => clearInterval(interval);
  }, []);

  if (!isConnected) {
    return (
      <div className="p-6 text-center">
        <div className="animate-spin rounded-full border-4 border-blue-500 border-t-transparent h-12 w-12 mx-auto mb-4"></div>
        <p className="text-gray-600">Connecting to alert system...</p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg p-4 shadow-sm">
      <h2 className="text-lg font-semibold mb-4 flex items-center justify-between">
        Active Alerts
        <span className="text-xs text-gray-500">Last updated: {new Date((faultClassification?.t || 0) * 1000).toLocaleTimeString()}</span>
      </h2>

      {/* Fault Classification Summary */}
      {faultClassification && (
        <div className="mb-4 p-3 bg-gray-50 rounded">
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium">System Status:</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${faultClassification.predicted_class === 'healthy' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {faultClassification.predicted_class === 'healthy' ? 'Healthy' : 'Fault Detected'}
            </span>
          </div>
          <div className="space-x-3 text-sm">
            {Object.entries(faultClassification.class_probabilities).map(([fault, prob]) => (
              <div key={fault} className="flex items-center">
                <span className="w-20">{fault.replace('_', ' ')}:</span>
                <span className="w-16 text-right">{(prob * 100).toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Trajectory Check Details */}
      {faultClassification && faultClassification.trajectory_check && (
        <div className="mb-4 p-3 border-l-4 border-blue-500 bg-blue-50">
          <h3 className="text-md font-medium mb-2">Per-Cylinder Divergence Check</h3>
          <p className="mb-1"><strong>Status:</strong> {faultClassification.trajectory_check.fired ? 'Divergence Detected' : 'All Cylinders Tracking Together'}</p>
          {faultClassification.trajectory_check.fired && faultClassification.trajectory_check.affected_cylinder && (
            <div className="mb-1"><strong>Affected Cylinder:</strong> {faultClassification.trajectory_check.affected_cylinder}</div>
          )}
          {faultClassification.trajectory_check.fired && faultClassification.trajectory_check.peak_sigma && (
            <div className="mb-1"><strong>Peak Sigma:</strong> {faultClassification.trajectory_check.peak_sigma}</div>
          )}
          {faultClassification.trajectory_check.fired && faultClassification.trajectory_check.sustained_seconds && (
            <div className="mb-1"><strong>Sustained Duration:</strong> {faultClassification.trajectory_check.sustained_seconds}s</div>
          )}
          <p className="mt-1 text-sm"><strong>Explanation:</strong> {faultClassification.trajectory_check.verdict_text}</p>
        </div>
      )}

      {/* Sensor vs Mechanical Disambiguation */}
      {sensorVsMechanical && (
        <div className="mb-4 p-3">
          <h3 className="text-md font-medium mb-2">Fault Source Analysis</h3>
          <div className="flex items-center justify-between mb-1">
            <span className="font-medium">Verdict:</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getVerdictColor(sensorVsMechanical.verdict)}`}>
              {sensorVsMechanical.verdict}
            </span>
          </div>
          {sensorVsMechanical.flagged_channel && (
            <div className="mb-1"><strong>Flagged Channel:</strong> {sensorVsMechanical.flagged_channel}</div>
          )}
          {sensorVsMechanical.affected_channels && sensorVsMechanical.affected_channels.length > 0 && (
            <div className="mb-1"><strong>Affected Channels:</strong> {sensorVsMechanical.affected_channels.join(', ')}</div>
          )}
          <div className="mb-1">
            <strong>Probabilities:</strong><br/>
            <span className="text-xs">Mechanical: {(sensorVsMechanical.p_mechanical || 0) * 100}%</span><br/>
            <span className="text-xs">Sensor: {(sensorVsMechanical.p_sensor || 0) * 100}%</span>
          </div>
          <p className="mt-1 text-sm"><strong>Reason:</strong> {sensorVsMechanical.reason}</p>
        </div>
      )}

      {/* Alerts List */}
      <div className="mt-4">
        <h3 className="text-md font-medium mb-2">Active Alerts Feed</h3>
        {alerts.length === 0 ? (
          <p className="text-center text-gray-500 py-4">No active alerts</p>
        ) : (
          <div className="space-y-3">
            {alerts.map((alert) => (
              <div key={alert.id} className={getSeverityColor(alert.severity) + ' p-3 rounded'}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-start">
                      <div className={`flex-shrink-0 h-2.5 w-2.5 rounded-full ${getVerdictColor(alert.verdict)}`}></div>
                      <div className="ml-3">
                        <h4 className="font-medium text-sm">{alert.fault_type.replace('_', ' ').toUpperCase()}</h4>
                        <p className="text-xs text-gray-500">{alert.affected.length > 0 ? alert.affected.join(', ') : 'System-wide'}</p>
                      </div>
                    </div>
                    <p className="mt-1 text-sm">{alert.explanation}</p>
                    <div className="mt-2 flex items-center justify-between text-xs">
                      <span>Severity: {alert.severity}</span>
                      <span>Status: {alert.status}</span>
                      <span className={`px-1.5 py-0 rounded text-xs ${getVerdictColor(alert.verdict)}`}>
                        {alert.verdict}
                      </span>
                    </div>
                  </div>
                  <div className="text-right text-xs ml-4">
                    {new Date(alert.t * 1000).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ActiveAlerts;