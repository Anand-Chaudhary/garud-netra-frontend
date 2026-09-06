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

      <main className="text-center py-20">
        <div className="bg-surface/50 rounded-lg p-8">
          <h2 className="text-xl font-semibold mb-4">Replay Mode</h2>
          <p className="text-muted">
            This phase is currently under development. Replay mode will allow:
          </p>
          <ul className="text-left text-muted max-w-xl mx-auto mt-4 space-y-2">
            <li>Selection of historical flight data</li>
            <li>Playback controls (play, pause, speed)</li>
            <li>Comparison with ground-truth labels</li>
            <li>Progress indicator and timestamp jumping</li>
          </ul>
        </div>
      </main>
    </div>
  );
}