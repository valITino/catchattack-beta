
import { useEmulation } from '@/hooks/useEmulation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { useState } from 'react';

export function EmulationForm() {
  const { startEmulation, loading, result } = useEmulation();
  const [name, setName] = useState('');
  const [selectedTechniques, setSelectedTechniques] = useState<string[]>([]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    await startEmulation({
      techniques: selectedTechniques,
      schedule: {
        timestamp: new Date().toISOString()
      }
    });
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Input
              placeholder="Operation Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          
          <Button type="submit" disabled={loading || !selectedTechniques.length}>
            {loading ? 'Starting Emulation...' : 'Run Emulation'}
          </Button>

          {result && (
            <pre className="mt-4 p-4 bg-secondary rounded-md overflow-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
