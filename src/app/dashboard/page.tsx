'use client';

import Link from 'next/link';

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-foreground">
          Garud Netra Dashboard
        </h1>
        <p className="text-muted mt-2">
          AI-Enabled Real-Time Digital Twin System for Health Monitoring
        </p>
      </div>

      <nav className="space-y-4">
        <Link href="/live-health" className="group">
          <div className="bg-surface/50 rounded-lg p-6 hover:bg-surface/75 transition-colors group-hover:bg-surface/75">
            <h2 className="text-xl font-semibold mb-2">Live Health View</h2>
            <p className="text-muted">
              Real-time engine health monitoring with per-subsystem status indicators
            </p>
          </div>
        </Link>

        <Link href="/alerts" className="group">
          <div className="bg-surface/50 rounded-lg p-6 hover:bg-surface/75 transition-colors group-hover:bg-surface/75">
            <h2 className="text-xl font-semibold mb-2">Active Alerts System</h2>
            <p className="text-muted">
              Fault detection, alert management, and source analysis
            </p>
          </div>
        </Link>

        <Link href="/rul" className="group">
          <div className="bg-surface/50 rounded-lg p-6 hover:bg-surface/75 transition-colors group-hover:bg-surface/75">
            <h2 className="text-xl font-semibold mb-2">RUL Panel</h2>
            <p className="text-muted">
              Remaining useful life prediction and health trajectory visualization
            </p>
          </div>
        </Link>

        <Link href="/replay" className="group">
          <div className="bg-surface/50 rounded-lg p-6 hover:bg-surface/75 transition-colors group-hover:bg-surface/75">
            <h2 className="text-xl font-semibold mb-2">Replay Mode</h2>
            <p className="text-muted">
              Playback of historical flight data for demonstration and analysis
            </p>
          </div>
        </Link>

        <Link href="/what-if" className="group">
          <div className="bg-surface/50 rounded-lg p-6 hover:bg-surface/75 transition-colors group-hover:bg-surface/75">
            <h2 className="text-xl font-semibold mb-2">Mission What-If Panel</h2>
            <p className="text-muted">
              Simulate hypothetical conditions and their effect on engine health
            </p>
          </div>
        </Link>
      </nav>
    </div>
  );
}