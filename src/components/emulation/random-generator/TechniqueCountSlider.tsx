
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";

interface TechniqueCountSliderProps {
  techniqueCount: number;
  onTechniqueCountChange: (value: number) => void;
}

const TechniqueCountSlider = ({ techniqueCount, onTechniqueCountChange }: TechniqueCountSliderProps) => {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <Label htmlFor="technique-count">Number of Techniques</Label>
          <span className="text-sm font-medium">{techniqueCount}</span>
        </div>
        <Slider 
          id="technique-count"
          min={1} 
          max={15} 
          step={1} 
          value={[techniqueCount]} 
          onValueChange={(value) => onTechniqueCountChange(value[0])}
          className="data-[state=checked]:bg-cyber-primary"
        />
      </div>
    </div>
  );
};

export default TechniqueCountSlider;
