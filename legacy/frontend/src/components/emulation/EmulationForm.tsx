
import { useEmulation } from '@/hooks/useEmulation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Play, AlertTriangle } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

// Common MITRE ATT&CK techniques
const commonTechniques = [
  { id: "T1078", name: "Valid Accounts", tactic: "Initial Access" },
  { id: "T1566", name: "Phishing", tactic: "Initial Access" },
  { id: "T1059", name: "Command and Scripting Interpreter", tactic: "Execution" },
  { id: "T1053", name: "Scheduled Task/Job", tactic: "Execution" },
  { id: "T1027", name: "Obfuscated Files or Information", tactic: "Defense Evasion" },
];

export function EmulationForm() {
  const { startEmulation, loading, result, clearResult } = useEmulation();
  const [name, setName] = useState('');
  const [selectedTechniques, setSelectedTechniques] = useState<string[]>([]);
  const [formSubmitted, setFormSubmitted] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormSubmitted(true);
    
    if (selectedTechniques.length === 0) {
      return; // Form validation will show error
    }
    
    await startEmulation({
      techniques: selectedTechniques,
      schedule: {
        timestamp: new Date().toISOString()
      }
    });
  }
  
  const toggleTechnique = (id: string) => {
    setSelectedTechniques(current => 
      current.includes(id) 
        ? current.filter(t => t !== id) 
        : [...current, id]
    );
  };
  
  // Reset the form
  const handleReset = () => {
    setName('');
    setSelectedTechniques([]);
    setFormSubmitted(false);
    clearResult();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Run Adversary Emulation</CardTitle>
      </CardHeader>
      <CardContent className="pt-2">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="operation-name">Operation Name</Label>
            <Input
              id="operation-name"
              placeholder="Operation Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          
          <div className="space-y-3">
            <Label>Select Techniques</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {commonTechniques.map((technique) => (
                <div key={technique.id} className="flex items-center space-x-2 border p-3 rounded-md">
                  <Checkbox 
                    id={technique.id}
                    checked={selectedTechniques.includes(technique.id)}
                    onCheckedChange={() => toggleTechnique(technique.id)}
                  />
                  <div className="grid gap-1.5 leading-none">
                    <Label htmlFor={technique.id} className="text-sm font-medium cursor-pointer">
                      {technique.id}: {technique.name}
                    </Label>
                    <Badge variant="outline" className="text-xs w-fit">{technique.tactic}</Badge>
                  </div>
                </div>
              ))}
            </div>
            
            {formSubmitted && selectedTechniques.length === 0 && (
              <div className="flex items-center text-red-500 text-sm">
                <AlertTriangle className="h-4 w-4 mr-2" />
                <span>Please select at least one technique</span>
              </div>
            )}
          </div>
          
          <div className="flex gap-3">
            <Button type="submit" disabled={loading}>
              <Play className="h-4 w-4 mr-2" />
              {loading ? 'Starting Emulation...' : 'Run Emulation'}
            </Button>
            
            <Button type="button" variant="outline" onClick={handleReset}>
              Reset
            </Button>
          </div>

          {result && (
            <>
              <Separator className="my-4" />
              <div>
                <h3 className="font-medium mb-2">Emulation Result:</h3>
                <pre className="p-4 bg-secondary text-sm rounded-md overflow-auto max-h-[400px]">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </div>
            </>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
