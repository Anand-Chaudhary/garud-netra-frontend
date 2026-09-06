export default function WhatIfPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-surface p-6">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-center text-foreground">
          Mission What-If Panel
        </h1>
        <p className="text-center text-muted mt-2">
          Simulate hypothetical conditions and their effect on RUL
        </p>
      </header>

      <main className="text-center py-20">
        <div className="bg-surface/50 rounded-lg p-8">
          <h2 className="text-xl font-semibold mb-4">Mission What-If Panel</h2>
          <p className="text-muted">
            This phase is currently under development (Phase 5). The what-if panel will allow:
          </p>
          <ul className="text-left text-muted max-w-xl mx-auto mt-4 space-y-2">
            <li>Input altitude, ambient temperature, and throttle profile</li>
            <li>View predicted RUL under hypothetical conditions</li>
            <li>Compare with current RUL prediction</li>
            <li>Display modified health trajectory</li>
          </ul>
        </div>
      </main>
    </div>
  );
}