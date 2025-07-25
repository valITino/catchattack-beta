
import { useState, useEffect } from "react";
import { useCaldera } from "@/hooks/useCaldera";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { PlayCircle, StopCircle, Workflow, Shield, Monitor, Database, Server, RefreshCw } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { CalderaOperation } from "@/types/caldera";

interface CalderaIntegrationProps {
  onVMGenerated?: (vmConfig: any) => void;
  onOperationComplete?: (results: any) => void;
}

const CalderaIntegration = ({ onVMGenerated, onOperationComplete }: CalderaIntegrationProps) => {
  const {
    agents,
    adversaries,
    abilities,
    activeOperations,
    results,
    isLoading,
    error,
    loadCalderaData,
    startOperation,
    stopOperation,
    getOperationResults,
    generateVMFromAgent,
    startBackendVM
  } = useCaldera();
  
  const [activeTab, setActiveTab] = useState<string>("agents");
  const [selectedAdversary, setSelectedAdversary] = useState<string>("");
  const [selectedAgents, setSelectedAgents] = useState<string[]>([]);
  const [operationName, setOperationName] = useState<string>(`Operation-${new Date().toISOString().slice(0, 10)}`);
  const [selectedOperation, setSelectedOperation] = useState<CalderaOperation | null>(null);
  
  // Load data on component mount
  useEffect(() => {
    loadCalderaData();
    // Poll for active operations status every 10 seconds
    const interval = setInterval(() => {
      activeOperations.forEach(op => {
        if (op.state === 'running') {
          getOperationResults(op.id);
        }
      });
    }, 10000);
    
    return () => clearInterval(interval);
  }, [activeOperations]);
  
  const handleStartOperation = async () => {
    if (!selectedAdversary || selectedAgents.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please select an adversary and at least one agent group.",
        variant: "destructive",
      });
      return;
    }
    
    const operation = await startOperation(operationName, selectedAdversary, selectedAgents);
    if (operation) {
      setSelectedOperation(operation);
      setActiveTab("operations");
    }
  };
  
  const handleStopOperation = async (operationId: string) => {
    await stopOperation(operationId);
    // Get final results
    const finalResults = await getOperationResults(operationId);
    
    if (onOperationComplete) {
      onOperationComplete({
        operation: activeOperations.find(op => op.id === operationId),
        results: finalResults
      });
    }
  };
  
  const handleGenerateVM = async (agentId: string) => {
    const vmConfig = await generateVMFromAgent(agentId);
    if (vmConfig && onVMGenerated) {
      onVMGenerated(vmConfig);
    }
    if (vmConfig) {
      await startBackendVM({
        image: 'ubuntu/bionic64',
        version: 'latest',
        cpu: 1,
        ram: 1024,
      });
    }
  };
  
  const toggleAgentSelection = (agentId: string) => {
    if (selectedAgents.includes(agentId)) {
      setSelectedAgents(selectedAgents.filter(id => id !== agentId));
    } else {
      setSelectedAgents([...selectedAgents, agentId]);
    }
  };
  
  // Helper function to find abilities for a given adversary
  const getAdversaryAbilities = (adversaryId: string) => {
    const adversary = adversaries.find(adv => adv.id === adversaryId);
    if (!adversary) return [];
    
    return abilities.filter(ability => adversary.abilities.includes(ability.id));
  };

  return (
    <Card className="cyber-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Workflow className="h-5 w-5 text-cyber-primary" />
          CALDERA Integration
        </CardTitle>
        <CardDescription>
          Adversary emulation platform for automated security testing
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="border-b border-cyber-primary/20 px-6">
            <TabsList className="mb-0">
              <TabsTrigger value="agents">Agents</TabsTrigger>
              <TabsTrigger value="adversaries">Adversaries</TabsTrigger>
              <TabsTrigger value="operations">Operations</TabsTrigger>
              <TabsTrigger value="results">Results</TabsTrigger>
            </TabsList>
          </div>
          
          <div className="px-6 py-4">
            {error && (
              <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-3 rounded-md mb-4">
                <p className="text-sm">{error}</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadCalderaData}
                  className="mt-2"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retry Connection
                </Button>
              </div>
            )}
            
            <TabsContent value="agents" className="mt-0">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Available Agents</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {isLoading ? (
                    <p>Loading agents...</p>
                  ) : agents.length === 0 ? (
                    <p>No agents available. Please deploy CALDERA agents to your infrastructure.</p>
                  ) : (
                    agents.map(agent => (
                      <div 
                        key={agent.id}
                        className="border border-cyber-primary/20 rounded-md p-3 hover:border-cyber-primary/50 transition-colors"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="font-medium">{agent.name || agent.paw}</h4>
                            <p className="text-sm text-gray-400">{agent.host}</p>
                          </div>
                          <Badge className={
                            agent.status === "active" ? "bg-green-500/10 text-green-500 border-green-500" :
                            agent.status === "stale" ? "bg-amber-500/10 text-amber-500 border-amber-500" :
                            "bg-red-500/10 text-red-500 border-red-500"
                          }>
                            {agent.status}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-1 mb-3">
                          <div>
                            <span className="text-xs text-gray-400">Platform:</span>
                            <p className="text-sm">{agent.platform}</p>
                          </div>
                          <div>
                            <span className="text-xs text-gray-400">Group:</span>
                            <p className="text-sm">{agent.group || "default"}</p>
                          </div>
                        </div>
                        <div className="flex justify-between">
                          <div className="flex items-center space-x-2">
                            <Checkbox 
                              id={`agent-${agent.id}`}
                              checked={selectedAgents.includes(agent.id)}
                              onCheckedChange={() => toggleAgentSelection(agent.id)}
                              className="data-[state=checked]:bg-cyber-primary data-[state=checked]:border-cyber-primary"
                            />
                            <Label htmlFor={`agent-${agent.id}`} className="text-sm">Select for operation</Label>
                          </div>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleGenerateVM(agent.id)}
                          >
                            <Server className="h-3 w-3 mr-1" /> Generate VM
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="adversaries" className="mt-0">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Adversary Profiles</h3>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="select-adversary">Select Adversary Profile</Label>
                    <Select 
                      value={selectedAdversary} 
                      onValueChange={setSelectedAdversary}
                    >
                      <SelectTrigger id="select-adversary" className="bg-cyber-darker border-cyber-primary/20 mt-1">
                        <SelectValue placeholder="Select adversary profile" />
                      </SelectTrigger>
                      <SelectContent>
                        {adversaries.map(adversary => (
                          <SelectItem key={adversary.id} value={adversary.id}>
                            {adversary.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {selectedAdversary && (
                    <div className="space-y-4">
                      <div className="border border-cyber-primary/20 rounded-md p-4">
                        <h4 className="font-medium">
                          {adversaries.find(a => a.id === selectedAdversary)?.name || "Selected Adversary"}
                        </h4>
                        <p className="text-sm text-gray-400 mt-1">
                          {adversaries.find(a => a.id === selectedAdversary)?.description || "No description available"}
                        </p>
                        
                        <div className="mt-3">
                          <h5 className="text-sm font-medium">Objective</h5>
                          <p className="text-sm">
                            {adversaries.find(a => a.id === selectedAdversary)?.objective || "No objective specified"}
                          </p>
                        </div>
                        
                        <div className="mt-3">
                          <h5 className="text-sm font-medium">Tags</h5>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {adversaries.find(a => a.id === selectedAdversary)?.tags.map((tag, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            )) || "No tags"}
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-medium mb-3">Abilities ({getAdversaryAbilities(selectedAdversary).length})</h4>
                        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                          {getAdversaryAbilities(selectedAdversary).map(ability => (
                            <div key={ability.id} className="border border-cyber-primary/20 rounded-md p-3">
                              <div className="flex justify-between items-start">
                                <h5 className="font-medium">{ability.name}</h5>
                                <Badge variant="outline" className="text-xs">
                                  {ability.techniqueId}
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-400 mt-1">{ability.description}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <Label htmlFor="operation-name">Operation Name</Label>
                        <Input
                          id="operation-name"
                          value={operationName}
                          onChange={(e) => setOperationName(e.target.value)}
                          className="bg-cyber-darker border-cyber-primary/20 mt-1"
                        />
                      </div>
                      
                      <div className="flex justify-end">
                        <Button 
                          onClick={handleStartOperation} 
                          disabled={isLoading || selectedAgents.length === 0}
                          className="bg-cyber-primary hover:bg-cyber-primary/90"
                        >
                          {isLoading ? (
                            <>Loading...</>
                          ) : (
                            <>
                              <PlayCircle className="mr-2 h-4 w-4" /> Start Operation
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="operations" className="mt-0">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Active Operations</h3>
                
                {isLoading ? (
                  <p>Loading operations...</p>
                ) : activeOperations.length === 0 ? (
                  <p>No active operations. Start a new operation from the Adversaries tab.</p>
                ) : (
                  <div className="space-y-3">
                    {activeOperations.map(operation => (
                      <div key={operation.id} className="border border-cyber-primary/20 rounded-md p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium">{operation.name}</h4>
                            <p className="text-sm text-gray-400">
                              {adversaries.find(a => a.id === operation.adversaryId)?.name || "Unknown adversary"}
                            </p>
                          </div>
                          <Badge className={
                            operation.state === "running" ? "bg-green-500/10 text-green-500 border-green-500" :
                            operation.state === "paused" ? "bg-amber-500/10 text-amber-500 border-amber-500" :
                            "bg-blue-500/10 text-blue-500 border-blue-500"
                          }>
                            {operation.state}
                          </Badge>
                        </div>
                        
                        {operation.state === "running" && (
                          <div className="mt-4 space-y-2">
                            <div className="flex justify-between items-center text-sm">
                              <span>Progress</span>
                              <span>In Progress</span>
                            </div>
                            <Progress value={results[operation.id]?.length ? 75 : 30} className="h-2" />
                          </div>
                        )}
                        
                        <div className="flex justify-end mt-3">
                          {operation.state === "running" ? (
                            <Button 
                              variant="outline"
                              size="sm"
                              onClick={() => handleStopOperation(operation.id)}
                            >
                              <StopCircle className="mr-2 h-3 w-3" /> Stop Operation
                            </Button>
                          ) : (
                            <Button 
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedOperation(operation);
                                setActiveTab("results");
                              }}
                            >
                              <Database className="mr-2 h-3 w-3" /> View Results
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="results" className="mt-0">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Operation Results</h3>
                
                <div>
                  <Label htmlFor="select-operation">Select Operation</Label>
                  <Select
                    value={selectedOperation?.id || ""}
                    onValueChange={(value) => {
                      const operation = activeOperations.find(op => op.id === value);
                      if (operation) {
                        setSelectedOperation(operation);
                        getOperationResults(operation.id);
                      }
                    }}
                  >
                    <SelectTrigger id="select-operation" className="bg-cyber-darker border-cyber-primary/20 mt-1">
                      <SelectValue placeholder="Select operation" />
                    </SelectTrigger>
                    <SelectContent>
                      {activeOperations.map(operation => (
                        <SelectItem key={operation.id} value={operation.id}>
                          {operation.name} ({operation.state})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {selectedOperation && results[selectedOperation.id] ? (
                  <div className="space-y-3 mt-3">
                    <div className="border border-cyber-primary/20 rounded-md p-3">
                      <h4 className="font-medium">Results Summary</h4>
                      <div className="grid grid-cols-2 mt-2 gap-2">
                        <div className="p-2 bg-cyber-primary/10 rounded-md">
                          <p className="text-xs text-gray-400">Total Commands</p>
                          <p className="text-lg font-bold">{results[selectedOperation.id].length}</p>
                        </div>
                        <div className="p-2 bg-cyber-primary/10 rounded-md">
                          <p className="text-xs text-gray-400">Success Rate</p>
                          <p className="text-lg font-bold">
                            {Math.round((results[selectedOperation.id].filter(r => r.status === 0).length / results[selectedOperation.id].length) * 100)}%
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <h4 className="font-medium mt-4">Command Execution Log</h4>
                    <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                      {results[selectedOperation.id].map((result, index) => (
                        <div 
                          key={result.id || index}
                          className={`border rounded-md p-3 ${
                            result.status === 0 
                              ? "border-green-500/20 bg-green-500/5" 
                              : "border-red-500/20 bg-red-500/5"
                          }`}
                        >
                          <div className="flex justify-between items-start mb-1">
                            <h5 className="font-medium text-sm">
                              {abilities.find(a => a.id === result.ability)?.name || "Unknown Ability"}
                            </h5>
                            <Badge variant="outline" className={result.status === 0 ? "text-green-500" : "text-red-500"}>
                              {result.status === 0 ? "Success" : "Failed"}
                            </Badge>
                          </div>
                          <div className="mt-2">
                            <p className="text-xs text-gray-400">Command:</p>
                            <pre className="bg-cyber-darker p-2 rounded text-xs mt-1 overflow-x-auto">
                              {result.command}
                            </pre>
                          </div>
                          {result.output && (
                            <div className="mt-2">
                              <p className="text-xs text-gray-400">Output:</p>
                              <pre className="bg-cyber-darker p-2 rounded text-xs mt-1 overflow-x-auto max-h-[100px]">
                                {result.output}
                              </pre>
                            </div>
                          )}
                          <div className="text-xs text-gray-400 mt-2">
                            Executed at: {new Date(result.timestamp).toLocaleString()}
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="flex justify-end mt-4 pt-2 border-t border-cyber-primary/20">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          if (selectedOperation) {
                            const vmConfig = {
                              environmentName: `${selectedOperation.name} Environment`,
                              description: `Environment generated from ${selectedOperation.name} operation results`,
                              machines: results[selectedOperation.id]
                                .filter(r => r.status === 0)
                                .map(r => ({
                                  name: `VM-${r.agentId.substring(0, 8)}`,
                                  os: agents.find(a => a.id === r.agentId)?.platform || "Unknown",
                                  services: [],
                                  vulnerabilities: 0
                                }))
                            };
                            
                            if (onVMGenerated) {
                              onVMGenerated(vmConfig);
                            }
                          }
                        }}
                      >
                        <Server className="mr-2 h-4 w-4" /> Generate Environment
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="mt-3">No results available. Select an operation from the dropdown.</p>
                )}
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </CardContent>
      <CardFooter className="flex flex-col items-start border-t border-cyber-primary/20 pt-4">
        <div className="text-xs text-gray-400">
          <p>CALDERA is a cybersecurity framework for adversary emulation developed by MITRE.</p>
          <p className="mt-1">Use this integration to run emulated threats on your infrastructure and generate realistic virtual environments.</p>
        </div>
      </CardFooter>
    </Card>
  );
};

export default CalderaIntegration;
