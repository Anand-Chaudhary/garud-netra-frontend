import ActiveAlerts from '@/components/ActiveAlerts';

export default function AlertsPage() {
  return (
    <div className="min-h-screen bg-linear-to-br from-background to-surface p-6">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-center text-foreground">
          Active Alerts System
        </h1>
        <p className="text-center text-muted mt-2">
          Fault detection and alert management
        </p>
      </header>

      <main>
        <ActiveAlerts />
      </main>
    </div>
  );
}