import { Plug } from "lucide-react";

export function IntegrationsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Integrations</h2>
        <p className="text-muted-foreground">
          Connect external services to your center.
        </p>
      </div>

      <div className="flex flex-col items-center justify-center py-12 text-center border rounded-lg">
        <div className="rounded-full bg-muted p-4 mb-4">
          <Plug className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-base font-semibold">Coming Soon</h3>
        <p className="text-muted-foreground max-w-sm mt-2">
          Zalo integration and other third-party services will be available in
          Epic 7.
        </p>
      </div>
    </div>
  );
}
