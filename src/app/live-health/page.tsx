import LiveHealthView from '@/components/LiveHealthView';

export default function LiveHealthPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-surface p-6">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-center text-foreground">
          Live Health View
        </h1>
        <p className="text-center text-muted mt-2">
          Real-time engine health monitoring
        </p>
      </header>

      <main>
        <LiveHealthView />
      </main>
    </div>
  );
}