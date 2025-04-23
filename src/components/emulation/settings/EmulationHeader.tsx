
import { Button } from "@/components/ui/button";
import { Play } from "lucide-react";

interface EmulationHeaderProps {
  onStart: () => void;
}

export function EmulationHeader({ onStart }: EmulationHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <h1 className="text-2xl font-bold">Adversary Emulation Configuration</h1>
      <Button 
        onClick={onStart}
        className="bg-cyber-primary hover:bg-cyber-primary/90"
      >
        <Play className="mr-2 h-4 w-4" /> Start Emulation
      </Button>
    </div>
  );
}
