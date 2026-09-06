import WhatIfPanel from '@/components/WhatIfPanel';

export default function WhatIfPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-surface p-6">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-center text-foreground">
          Mission What-If Panel
        </h1>
        <p className="text-center text-muted mt-2">
          Simulate hypothetical conditions (altitude, ambient temperature, throttle profile) and evaluate projected RUL impact
        </p>
      </header>

      <main>
        <WhatIfPanel />
      </main>
    </div>
  );
}