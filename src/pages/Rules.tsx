
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { FileCode2, Search, RefreshCw, GitFork, BookMarked, Lightbulb } from "lucide-react";
import { getAllRules } from "@/utils/mitreAttackUtils";
import LibraryTabContent from "@/components/rules/LibraryTabContent";
import CommunityTabContent from "@/components/rules/CommunityTabContent";
import AutoRuleGenerator from "@/components/rules/AutoRuleGenerator";

const Rules = () => {
  const [isLoading, setIsLoading] = useState(false);
  
  // Get all rules from the mock store
  const allRules = getAllRules();
  
  const handleRefresh = () => {
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Detection Rules</h1>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>
      
      <Tabs defaultValue="library">
        <TabsList>
          <TabsTrigger value="library">
            <BookMarked className="h-4 w-4 mr-2" />
            Rule Library
          </TabsTrigger>
          <TabsTrigger value="generator">
            <Lightbulb className="h-4 w-4 mr-2" />
            Auto-Generator
          </TabsTrigger>
          <TabsTrigger value="community">
            <GitFork className="h-4 w-4 mr-2" />
            Community Rules
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="library" className="space-y-4">
          <LibraryTabContent rules={allRules} isLoading={isLoading} />
        </TabsContent>
        
        <TabsContent value="generator" className="space-y-4">
          <AutoRuleGenerator />
        </TabsContent>
        
        <TabsContent value="community" className="space-y-4">
          <CommunityTabContent />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Rules;
