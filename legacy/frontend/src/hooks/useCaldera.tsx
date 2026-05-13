
import { useState, useEffect } from "react";
import { calderaService } from "@/services/calderaService";
import { backendService, VMConfig } from "@/services/backendService";
import { toast } from "@/components/ui/use-toast";
import { CalderaAgent, CalderaAdversary, CalderaOperation, CalderaAbility, CalderaResult } from "@/types/caldera";

export const useCaldera = () => {
  const [agents, setAgents] = useState<CalderaAgent[]>([]);
  const [abilities, setAbilities] = useState<CalderaAbility[]>([]);
  const [adversaries, setAdversaries] = useState<CalderaAdversary[]>([]);
  const [activeOperations, setActiveOperations] = useState<CalderaOperation[]>([]);
  const [results, setResults] = useState<Record<string, CalderaResult[]>>({});
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Load initial data
  const loadCalderaData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const [agentsData, abilitiesData, adversariesData] = await Promise.all([
        calderaService.getAgents(),
        calderaService.getAbilities(),
        calderaService.getAdversaries()
      ]);
      
      setAgents(agentsData);
      setAbilities(abilitiesData);
      setAdversaries(adversariesData);
    } catch (err) {
      console.error("Error loading CALDERA data:", err);
      setError((err as Error).message || "Failed to load CALDERA data");
      
      toast({
        title: "Error",
        description: "Failed to connect to CALDERA. Please check your connection and credentials.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Start a new operation
  const startOperation = async (name: string, adversaryId: string, agentGroups: string[]) => {
    setIsLoading(true);
    
    try {
      const operation = await calderaService.startOperation(name, adversaryId, agentGroups);
      setActiveOperations(prev => [...prev, operation]);
      
      toast({
        title: "Operation Started",
        description: `Operation ${name} has been started successfully.`,
      });
      
      return operation;
    } catch (err) {
      console.error("Error starting operation:", err);
      
      toast({
        title: "Operation Failed",
        description: (err as Error).message || "Failed to start operation",
        variant: "destructive",
      });
      
      return null;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Stop an operation
  const stopOperation = async (operationId: string) => {
    setIsLoading(true);
    
    try {
      await calderaService.stopOperation(operationId);
      setActiveOperations(prev => 
        prev.map(op => op.id === operationId ? {...op, state: 'complete'} : op)
      );
      
      toast({
        title: "Operation Stopped",
        description: "The operation has been stopped successfully.",
      });
    } catch (err) {
      console.error("Error stopping operation:", err);
      
      toast({
        title: "Error",
        description: (err as Error).message || "Failed to stop operation",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Get results for an operation
  const getOperationResults = async (operationId: string) => {
    try {
      const operationResults = await calderaService.getOperationResults(operationId);
      setResults(prev => ({
        ...prev,
        [operationId]: operationResults,
      }));
      return operationResults;
    } catch (err) {
      console.error("Error fetching operation results:", err);
      return [];
    }
  };
  
  // Generate VM from agent data
  const generateVMFromAgent = async (agentId: string) => {
    setIsLoading(true);
    
    try {
      const vmConfig = await calderaService.generateVMFromAgent(agentId);
      
      toast({
        title: "VM Generation Complete",
        description: "Virtual environment has been generated from agent data.",
      });
      
      return vmConfig;
    } catch (err) {
      console.error("Error generating VM:", err);
      
      toast({
        title: "VM Generation Failed",
        description: (err as Error).message || "Failed to generate virtual environment",
        variant: "destructive",
      });
      
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const startBackendVM = async (config: VMConfig) => {
    try {
      const result = await backendService.startVM(config);
      if (result.console_cmd) {
        toast({
          title: 'VM Started',
          description: `SSH using: ${result.console_cmd}`
        });
      } else if (result.error) {
        toast({ title: 'VM Error', description: result.error, variant: 'destructive' });
      }
      return result;
    } catch (err) {
      toast({ title: 'VM Error', description: (err as Error).message, variant: 'destructive' });
      return null;
    }
  };
  
  return {
    agents,
    abilities,
    adversaries,
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
  };
};
