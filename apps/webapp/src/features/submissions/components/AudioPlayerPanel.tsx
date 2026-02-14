import { Headphones } from "lucide-react";

interface AudioPlayerPanelProps {
  audioUrl: string;
}

export function AudioPlayerPanel({ audioUrl }: AudioPlayerPanelProps) {
  return (
    <div className="sticky top-14 z-30 border-b bg-background/95 backdrop-blur px-4 py-2">
      <div className="flex items-center gap-2 max-w-3xl mx-auto">
        <Headphones className="size-4 text-muted-foreground shrink-0" />
        <audio src={audioUrl} controls className="w-full h-10" />
      </div>
    </div>
  );
}
