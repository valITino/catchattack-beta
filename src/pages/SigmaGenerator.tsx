
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileCode2, Search } from "lucide-react";
import { useSigmaGenerator } from "@/hooks/useSigmaGenerator";
import RulesTabContent from "@/components/sigma/RulesTabContent";
import VulnerabilitiesTabContent from "@/components/sigma/VulnerabilitiesTabContent";
import { generatedRules } from "@/data/sigmaRules";
import { vulnerabilities } from "@/data/vulnerabilities";

const SigmaGenerator = () => {
  const { 
    activeTab, 
    setActiveTab, 
    handleSelectRule 
  } = useSigmaGenerator();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Sigma Rules Generator</h1>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="rules">
            <FileCode2 className="mr-2 h-4 w-4" />
            Generated Rules
          </TabsTrigger>
          <TabsTrigger value="vulnerabilities">
            <Search className="mr-2 h-4 w-4" />
            Vulnerabilities
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="rules" className="space-y-4">
          <RulesTabContent rules={generatedRules} />
        </TabsContent>
        
        <TabsContent value="vulnerabilities" className="space-y-4">
          <VulnerabilitiesTabContent 
            vulnerabilities={vulnerabilities}
            rules={generatedRules}
            onSelectRule={handleSelectRule}
            setActiveTab={setActiveTab}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SigmaGenerator;
