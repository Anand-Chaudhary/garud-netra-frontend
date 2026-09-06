import LiveHealthView from '@/components/LiveHealthView';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-surface p-6">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-center text-foreground">
          Garud Netra - Engine Health Dashboard
        </h1>
        <p className="text-center text-muted mt-2">
          AI-Enabled Real-Time Digital Twin System for Health Monitoring
        </p>
      </header>

      <main className="space-y-6">
        <LiveHealthView />
      </main>

      <footer className="mt-8 text-center text-xs text-muted border-t border-border-subtle pt-4">
        <p>Phase 1: Foundation & Live Health View • Update Rate: ~2Hz</p>
      </footer>
    </div>
  );
}