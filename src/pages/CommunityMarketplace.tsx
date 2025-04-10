
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Filter, Share, Users, Upload, Download, Star, Clock, TrendingUp } from "lucide-react";
import MarketplaceTemplate, { EmulationTemplate } from "@/components/community/MarketplaceTemplate";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

// Sample marketplace data
const sampleTemplates: EmulationTemplate[] = [
  {
    id: "template-001",
    name: "APT29 Full Campaign",
    description: "Complete emulation of APT29 (Cozy Bear) TTPs including initial access, execution, and data exfiltration",
    author: {
      name: "Security Researcher",
      avatarUrl: "https://api.dicebear.com/7.x/personas/svg?seed=John"
    },
    tags: ["APT29", "Cozy Bear", "Russia", "Exfiltration"],
    stars: 156,
    downloads: 1203,
    complexity: "high",
    techniqueCount: 12,
    tactics: ["TA0001", "TA0002", "TA0003", "TA0005", "TA0008", "TA0010"],
    created: "2024-12-10",
    featured: true
  },
  {
    id: "template-002",
    name: "Ransomware Simulation",
    description: "Emulates common ransomware behaviors including file encryption, registry modification, and cleanup",
    author: {
      name: "RansomDefender",
      avatarUrl: "https://api.dicebear.com/7.x/personas/svg?seed=RansomDefender"
    },
    tags: ["Ransomware", "Encryption", "Impact"],
    stars: 89,
    downloads: 756,
    complexity: "medium",
    techniqueCount: 7,
    tactics: ["TA0002", "TA0003", "TA0005", "TA0040"],
    created: "2025-01-22"
  },
  {
    id: "template-003",
    name: "Supply Chain Compromise",
    description: "Emulates supply chain attack techniques including software manipulation and trusted relationship exploitation",
    author: {
      name: "SupplyChainSec",
      avatarUrl: "https://api.dicebear.com/7.x/personas/svg?seed=SupplyChainSec"
    },
    tags: ["Supply Chain", "Trusted Relationship", "Software Compromise"],
    stars: 65,
    downloads: 421,
    complexity: "high",
    techniqueCount: 9,
    tactics: ["TA0001", "TA0003", "TA0004", "TA0005"],
    created: "2025-02-15"
  },
  {
    id: "template-004",
    name: "Data Exfiltration Techniques",
    description: "Comprehensive set of data exfiltration techniques including encrypted channels and steganography",
    author: {
      name: "DataDefense",
      avatarUrl: "https://api.dicebear.com/7.x/personas/svg?seed=DataDefense"
    },
    tags: ["Exfiltration", "Data Theft", "Steganography"],
    stars: 43,
    downloads: 367,
    complexity: "medium",
    techniqueCount: 6,
    tactics: ["TA0009", "TA0010", "TA0011"],
    created: "2025-03-01"
  },
  {
    id: "template-005",
    name: "Nation State APT Emulation",
    description: "Advanced persistent threat techniques modeled after known nation state actors",
    author: {
      name: "ThreatIntel",
      avatarUrl: "https://api.dicebear.com/7.x/personas/svg?seed=ThreatIntel"
    },
    tags: ["APT", "Nation State", "Persistent", "Stealth"],
    stars: 112,
    downloads: 903,
    complexity: "apts",
    techniqueCount: 15,
    tactics: ["TA0001", "TA0002", "TA0003", "TA0004", "TA0005", "TA0007", "TA0008", "TA0009", "TA0010", "TA0011"],
    created: "2025-02-28",
    featured: true
  },
  {
    id: "template-006",
    name: "Basic Recon & Discovery",
    description: "Simple reconnaissance and discovery techniques for testing basic detection capabilities",
    author: {
      name: "SecurityBasics",
      avatarUrl: "https://api.dicebear.com/7.x/personas/svg?seed=SecurityBasics"
    },
    tags: ["Reconnaissance", "Discovery", "Beginner"],
    stars: 27,
    downloads: 412,
    complexity: "low",
    techniqueCount: 4,
    tactics: ["TA0007"],
    created: "2025-03-10"
  }
];

const CommunityMarketplace = () => {
  const [activeTab, setActiveTab] = useState<string>("browse");
  const [searchTerm, setSearchTerm] = useState("");
  const [complexity, setComplexity] = useState<string>("all");
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<EmulationTemplate | null>(null);
  
  const filteredTemplates = sampleTemplates.filter(template => {
    const matchesSearch = 
      template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.author.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
      
    const matchesComplexity = complexity === "all" || template.complexity === complexity;
    
    return matchesSearch && matchesComplexity;
  });
  
  const handleUseTemplate = (template: EmulationTemplate) => {
    setSelectedTemplate(template);
    toast({
      title: "Template Selected",
      description: `${template.name} has been selected for use`,
    });
  };
  
  const handleImportTemplate = () => {
    toast({
      title: "Template Uploaded",
      description: "Your template has been uploaded to the marketplace",
    });
    setUploadDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Community Marketplace</h1>
        <Button 
          onClick={() => setUploadDialogOpen(true)} 
          className="bg-cyber-primary hover:bg-cyber-primary/90"
        >
          <Upload className="mr-2 h-4 w-4" /> Share Template
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <div className="flex justify-between items-center">
          <TabsList className="grid grid-cols-3 w-auto">
            <TabsTrigger value="browse">
              <Search className="mr-2 h-4 w-4" /> Browse
            </TabsTrigger>
            <TabsTrigger value="favorites">
              <Star className="mr-2 h-4 w-4" /> My Favorites
            </TabsTrigger>
            <TabsTrigger value="published">
              <Share className="mr-2 h-4 w-4" /> My Published
            </TabsTrigger>
          </TabsList>
          
          <div className="flex gap-2">
            <div className="relative w-64">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <Input 
                placeholder="Search templates..." 
                className="pl-9 bg-cyber-darker border-cyber-primary/20"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <Select value={complexity} onValueChange={setComplexity}>
              <SelectTrigger className="w-40 bg-cyber-darker border-cyber-primary/20">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Complexity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Complexity</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="apts">APT Level</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <TabsContent value="browse" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTemplates.length > 0 ? (
              filteredTemplates.map((template) => (
                <MarketplaceTemplate
                  key={template.id}
                  template={template}
                  onUse={handleUseTemplate}
                />
              ))
            ) : (
              <div className="col-span-3 text-center py-10 text-gray-400">
                No templates found matching your search criteria.
              </div>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="favorites">
          <Card className="cyber-card">
            <CardHeader>
              <CardTitle>My Favorite Templates</CardTitle>
              <CardDescription>Templates you've marked as favorites</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-10 text-gray-400">
                You haven't starred any templates yet. Browse the marketplace to find templates you like.
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="published">
          <Card className="cyber-card">
            <CardHeader>
              <CardTitle>My Published Templates</CardTitle>
              <CardDescription>Templates you've shared with the community</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-10 text-gray-400">
                You haven't published any templates yet. Create and share your own adversary emulation templates.
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      <Card className="cyber-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-cyber-primary" />
            Marketplace Trends
          </CardTitle>
          <CardDescription>Popular templates and recent activity</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="grid grid-cols-1 md:grid-cols-3">
            <div className="p-6 border-r border-b md:border-b-0 border-cyber-primary/20">
              <h3 className="text-sm font-medium mb-4">Most Downloaded</h3>
              <ScrollArea className="h-48">
                <div className="space-y-3">
                  {sampleTemplates
                    .sort((a, b) => b.downloads - a.downloads)
                    .slice(0, 5)
                    .map((template) => (
                      <div key={template.id} className="flex items-center justify-between">
                        <div className="truncate mr-2">
                          <div className="font-medium truncate">{template.name}</div>
                          <div className="text-xs text-gray-400">{template.author.name}</div>
                        </div>
                        <Badge variant="outline" className="whitespace-nowrap">
                          <Download className="h-3 w-3 mr-1" /> {template.downloads}
                        </Badge>
                      </div>
                    ))}
                </div>
              </ScrollArea>
            </div>
            
            <div className="p-6 border-r border-b md:border-b-0 border-cyber-primary/20">
              <h3 className="text-sm font-medium mb-4">Highest Rated</h3>
              <ScrollArea className="h-48">
                <div className="space-y-3">
                  {sampleTemplates
                    .sort((a, b) => b.stars - a.stars)
                    .slice(0, 5)
                    .map((template) => (
                      <div key={template.id} className="flex items-center justify-between">
                        <div className="truncate mr-2">
                          <div className="font-medium truncate">{template.name}</div>
                          <div className="text-xs text-gray-400">{template.author.name}</div>
                        </div>
                        <Badge variant="outline" className="whitespace-nowrap">
                          <Star className="h-3 w-3 mr-1" fill="currentColor" /> {template.stars}
                        </Badge>
                      </div>
                    ))}
                </div>
              </ScrollArea>
            </div>
            
            <div className="p-6">
              <h3 className="text-sm font-medium mb-4">Recently Added</h3>
              <ScrollArea className="h-48">
                <div className="space-y-3">
                  {sampleTemplates
                    .sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime())
                    .slice(0, 5)
                    .map((template) => (
                      <div key={template.id} className="flex items-center justify-between">
                        <div className="truncate mr-2">
                          <div className="font-medium truncate">{template.name}</div>
                          <div className="text-xs text-gray-400">{template.author.name}</div>
                        </div>
                        <Badge variant="outline" className="whitespace-nowrap">
                          <Clock className="h-3 w-3 mr-1" /> {template.created}
                        </Badge>
                      </div>
                    ))}
                </div>
              </ScrollArea>
            </div>
          </div>
          
          <div className="p-4 border-t border-cyber-primary/20 flex justify-between items-center">
            <div className="text-sm text-gray-400">
              <Users className="inline-block h-4 w-4 mr-1" /> {sampleTemplates.length} templates from community members
            </div>
            <Button variant="outline" size="sm">
              View All Statistics
            </Button>
          </div>
        </CardContent>
      </Card>
      
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Share Your Template</DialogTitle>
            <DialogDescription>
              Share your adversary emulation template with the community
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="template-name">Template Name</Label>
              <Input
                id="template-name"
                placeholder="E.g., APT29 Emulation Sequence"
                className="bg-cyber-darker border-cyber-primary/20"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="template-desc">Description</Label>
              <Input
                id="template-desc"
                placeholder="Describe your template..."
                className="bg-cyber-darker border-cyber-primary/20"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="template-tags">Tags (comma separated)</Label>
              <Input
                id="template-tags"
                placeholder="E.g., APT29, Russia, Exfiltration"
                className="bg-cyber-darker border-cyber-primary/20"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="template-complexity">Complexity</Label>
              <Select defaultValue="medium">
                <SelectTrigger id="template-complexity" className="bg-cyber-darker border-cyber-primary/20">
                  <SelectValue placeholder="Select complexity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low - Basic TTPs</SelectItem>
                  <SelectItem value="medium">Medium - Standard TTPs</SelectItem>
                  <SelectItem value="high">High - Advanced TTPs</SelectItem>
                  <SelectItem value="apts">APT - Nation State Level</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setUploadDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleImportTemplate}>
              <Upload className="mr-2 h-4 w-4" /> Share Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CommunityMarketplace;
