import { Shield } from "lucide-react";

export function PrivacyPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Privacy</h2>
        <p className="text-muted-foreground">
          Manage data privacy and compliance settings.
        </p>
      </div>

      <div className="flex flex-col items-center justify-center py-12 text-center border rounded-lg">
        <div className="rounded-full bg-muted p-4 mb-4">
          <Shield className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-base font-semibold">Coming Soon</h3>
        <p className="text-muted-foreground max-w-sm mt-2">
          Data sovereignty controls and privacy center will be available in Epic
          8.
        </p>
      </div>
    </div>
  );
}
