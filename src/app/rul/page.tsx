import RULPanel from '@/components/RULPanel';

export default function RULPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-surface p-6">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-center text-foreground">
          Remaining Useful Life
        </h1>
        <p className="text-center text-muted mt-2">
          Predictive maintenance and health trajectory analysis
        </p>
      </header>

      <main>
        <RULPanel />
      </main>
    </div>
  );
}