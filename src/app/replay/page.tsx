import ReplayDashboard from '@/components/ReplayDashboard';

export default function ReplayPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-surface p-6">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-center text-foreground">
          Replay Mode
        </h1>
        <p className="text-center text-muted mt-2">
          Playback of historical flight data for demonstration and analysis
        </p>
      </header>

      <main>
        <ReplayDashboard />
      </main>
    </div>
  );
}