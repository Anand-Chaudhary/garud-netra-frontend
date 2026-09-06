'use client';

import React, { useState, useEffect } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Line,
  ComposedChart
} from 'recharts';
import { Activity, AlertTriangle, Info, Timer } from 'lucide-react';

interface TrajectoryPoint {
  cycle: number;
  phi: number;
  lowerBound: number;
  upperBound: number;
}

const RULPanel: React.FC = () => {
  const [currentCycle, setCurrentCycle] = useState(100);
  const [predictedRulCycles, setPredictedRulCycles] = useState(450);
  const [trajectory, setTrajectory] = useState<TrajectoryPoint[]>([]);

  // Generate initial trajectory
  useEffect(() => {
    const generateTrajectory = (startCycle: number, rul: number) => {
      const points: TrajectoryPoint[] = [];
      const endCycle = startCycle + rul + 100; // Plot slightly past failure
      
      for (let i = Math.max(0, startCycle - 50); i <= endCycle; i += 10) {
        // Simple degradation curve model
        const progress = Math.max(0, (i - startCycle) / rul);
        let basePhi = 1.0;
        
        if (i < startCycle) {
            // Past: steady decline
            basePhi = 0.9 - (startCycle - i) * 0.001;
        } else {
            // Future prediction
            basePhi = 0.9 - Math.pow(progress, 1.5) * 0.55; // Reaches ~0.35 at progress=1.0
        }

        // Add some noise
        const noise = (Math.random() - 0.5) * 0.02;
        const phi = Math.max(0, Math.min(1, basePhi + noise));
        
        // Uncertainty grows over time in the future
        const uncertainty = i > startCycle ? 0.02 + (progress * 0.15) : 0.01;
        
        points.push({
          cycle: i,
          phi: Number(phi.toFixed(3)),
          lowerBound: Number(Math.max(0, phi - uncertainty).toFixed(3)),
          upperBound: Number(Math.min(1, phi + uncertainty).toFixed(3))
        });
      }
      return points;
    };

    setTrajectory(generateTrajectory(currentCycle, predictedRulCycles));
  }, []); // Run once on mount to establish the base shape

  // Simulate time progressing
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentCycle(prev => {
        const nextCycle = prev + 1;
        
        // Update RUL
        setPredictedRulCycles(rul => Math.max(0, rul - 1));
        
        return nextCycle;
      });
    }, 2000); // 1 cycle every 2 seconds for demonstration

    return () => clearInterval(interval);
  }, []);

  const getRulColor = (rul: number) => {
    if (rul > 200) return 'text-success';
    if (rul > 50) return 'text-warning';
    return 'text-danger';
  };

  const getRulBgColor = (rul: number) => {
    if (rul > 200) return 'bg-success-soft';
    if (rul > 50) return 'bg-warning-soft';
    return 'bg-danger-soft';
  };

  return (
    <div className="space-y-6">
      {/* Top Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* RUL Card */}
        <div className={`md:col-span-2 border border-border-subtle rounded-xl p-6 shadow-sm flex items-center justify-between transition-colors duration-500 bg-surface`}>
          <div>
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2 mb-1">
              <Timer className="w-5 h-5" />
              Remaining Useful Life
            </h2>
            <p className="text-sm text-muted">Predicted operational cycles before failure</p>
          </div>
          <div className={`flex flex-col items-end`}>
            <div className="flex items-baseline gap-2">
              <span className={`text-6xl font-bold font-mono tracking-tighter ${getRulColor(predictedRulCycles)}`}>
                {predictedRulCycles}
              </span>
              <span className="text-xl font-medium text-muted">cycles</span>
            </div>
            {predictedRulCycles <= 50 && (
              <div className="flex items-center gap-1 mt-2 text-danger text-sm font-medium animate-pulse">
                <AlertTriangle className="w-4 h-4" />
                Critical Maintenance Required Soon
              </div>
            )}
          </div>
        </div>

        {/* Current State Info */}
        <div className="bg-surface border border-border-subtle rounded-xl p-6 shadow-sm flex flex-col justify-center">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-medium text-muted">Current Cycle</h3>
            <span className="text-lg font-mono font-semibold">{currentCycle}</span>
          </div>
          <div className="w-full h-px bg-border-subtle mb-4"></div>
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-medium text-muted">Confidence</h3>
            <span className="text-sm font-medium px-2 py-1 bg-surface-highlight rounded-md border border-border flex items-center gap-1">
              <Activity className="w-3 h-3" />
              {predictedRulCycles > 200 ? 'High' : predictedRulCycles > 50 ? 'Moderate' : 'Low'}
            </span>
          </div>
        </div>
      </div>

      {/* Trajectory Chart */}
      <div className="bg-surface border border-border-subtle rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-foreground">Health Trajectory (PHI)</h2>
            <p className="text-sm text-muted mt-1">
              Projected Performance Health Index over operating cycles
            </p>
          </div>
          
          <div className="flex items-center gap-4 text-xs font-medium bg-background px-3 py-2 rounded-lg border border-border-subtle">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-primary"></div>
              <span>Predicted PHI</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-primary/20"></div>
              <span>Confidence Band</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-[2px] bg-danger border-t border-dashed border-danger"></div>
              <span>Failure Threshold (0.35)</span>
            </div>
          </div>
        </div>

        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={trajectory} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
              <defs>
                <linearGradient id="colorPhi" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorConfidence" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.15}/>
                  <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0.05}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border-subtle))" vertical={false} />
              
              <XAxis 
                dataKey="cycle" 
                tick={{ fill: 'hsl(var(--muted))' }}
                tickLine={false}
                axisLine={false}
                label={{ value: 'Engine Cycles', position: 'insideBottom', offset: -10, fill: 'hsl(var(--muted))', fontSize: 12 }}
              />
              <YAxis 
                domain={[0, 1]} 
                tick={{ fill: 'hsl(var(--muted))' }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(val) => val.toFixed(1)}
              />
              
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--surface))',
                  borderColor: 'hsl(var(--border-subtle))',
                  borderRadius: '0.5rem',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)'
                }}
                itemStyle={{ color: 'hsl(var(--foreground))' }}
                labelStyle={{ color: 'hsl(var(--muted))', marginBottom: '0.25rem' }}
                formatter={(value: any, name: any) => {
                  if (name === 'lowerBound' || name === 'upperBound') return [value, 'Confidence Limit'];
                  if (name === 'phi') return [value, 'Health Index (PHI)'];
                  return [value, name];
                }}
                labelFormatter={(label) => `Cycle ${label}`}
              />

              {/* Current time indicator */}
              <ReferenceLine 
                x={currentCycle} 
                stroke="hsl(var(--muted))" 
                strokeDasharray="3 3"
                label={{ position: 'top', value: 'Current', fill: 'hsl(var(--muted))', fontSize: 12 }} 
              />
              
              {/* Failure Threshold */}
              <ReferenceLine 
                y={0.35} 
                stroke="hsl(var(--danger))" 
                strokeDasharray="4 4" 
                strokeWidth={2}
                label={{ position: 'insideTopLeft', value: 'Failure Threshold', fill: 'hsl(var(--danger))', fontSize: 12 }} 
              />

              {/* Confidence Band (Area between upper and lower bound) */}
              <Area 
                type="monotone" 
                dataKey="upperBound" 
                stroke="none" 
                fill="url(#colorConfidence)" 
                isAnimationActive={false}
              />
              <Area 
                type="monotone" 
                dataKey="lowerBound" 
                stroke="none" 
                fill="hsl(var(--surface))" 
                isAnimationActive={false}
              />
              
              {/* Main PHI Line */}
              <Line 
                type="monotone" 
                dataKey="phi" 
                stroke="#0ea5e9" 
                strokeWidth={3} 
                dot={false}
                activeDot={{ r: 6, fill: '#0ea5e9', stroke: 'hsl(var(--surface))', strokeWidth: 2 }}
                isAnimationActive={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        
        {/* Confidence Note */}
        <div className="mt-4 flex items-start gap-3 p-4 bg-background rounded-lg border border-border-subtle">
          <Info className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
          <p className="text-sm text-muted">
            <strong className="text-foreground font-medium">Confidence Note: </strong>
            Prediction confidence decreases as the projection extends further into the future. 
            The shaded area represents the 95% confidence interval for the predicted health trajectory based on current operational profiles.
            {predictedRulCycles < 100 ? " Due to the proximity to the failure threshold, uncertainty has increased." : ""}
          </p>
        </div>
      </div>
    </div>
  );
};

export default RULPanel;
