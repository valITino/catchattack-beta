
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Star, Download, ThumbsUp, Eye } from "lucide-react";
import { useState } from "react";
import { toast } from "@/components/ui/use-toast";

export interface EmulationTemplate {
  id: string;
  name: string;
  description: string;
  author: {
    name: string;
    avatarUrl?: string;
  };
  tags: string[];
  stars: number;
  downloads: number;
  complexity: "low" | "medium" | "high" | "apts";
  techniqueCount: number;
  tactics: string[];
  created: string;
  featured?: boolean;
}

interface MarketplaceTemplateProps {
  template: EmulationTemplate;
  onUse: (template: EmulationTemplate) => void;
}

const MarketplaceTemplate = ({ template, onUse }: MarketplaceTemplateProps) => {
  const [starred, setStarred] = useState(false);
  
  const handleToggleStar = (e: React.MouseEvent) => {
    e.stopPropagation();
    setStarred(!starred);
    toast({
      title: starred ? "Removed from favorites" : "Added to favorites",
      description: starred 
        ? `${template.name} has been removed from your favorites` 
        : `${template.name} has been added to your favorites`
    });
  };
  
  const handleUse = () => {
    onUse(template);
  };
  
  // Get complexity color
  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case "apts": return "bg-cyber-danger text-white";
      case "high": return "bg-cyber-danger/80 text-white";
      case "medium": return "bg-cyber-warning text-black";
      case "low": return "bg-cyber-accent/70 text-black";
      default: return "bg-cyber-primary text-white";
    }
  };
  
  return (
    <Card className={`cyber-card h-full flex flex-col ${template.featured ? 'border-cyber-primary' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg">{template.name}</CardTitle>
          <Badge className={getComplexityColor(template.complexity)}>
            {template.complexity.toUpperCase()}
          </Badge>
        </div>
        <CardDescription className="flex items-center">
          <Avatar className="h-6 w-6 mr-2">
            {template.author.avatarUrl ? (
              <AvatarImage src={template.author.avatarUrl} />
            ) : (
              <AvatarFallback>{template.author.name.charAt(0)}</AvatarFallback>
            )}
          </Avatar>
          By {template.author.name}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        <div className="space-y-3">
          <p className="text-sm">{template.description}</p>
          
          <div className="flex flex-wrap gap-1">
            {template.tags.map((tag) => (
              <Badge key={tag} variant="outline" className="bg-cyber-darker">
                {tag}
              </Badge>
            ))}
          </div>
          
          <div className="grid grid-cols-2 gap-2 text-xs text-gray-400">
            <div className="flex items-center">
              <Eye className="h-3.5 w-3.5 mr-1" />
              {template.techniqueCount} Techniques
            </div>
            <div className="flex items-center">
              <ThumbsUp className="h-3.5 w-3.5 mr-1" />
              {template.tactics.length} Tactics
            </div>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="flex justify-between pt-4 border-t border-cyber-primary/20">
        <div className="flex items-center text-sm text-gray-400">
          <div className="flex items-center mr-3">
            <Star className="h-3.5 w-3.5 mr-1" />
            {template.stars + (starred ? 1 : 0)}
          </div>
          <div className="flex items-center">
            <Download className="h-3.5 w-3.5 mr-1" />
            {template.downloads}
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            className={starred ? "text-cyber-warning" : ""}
            onClick={handleToggleStar}
          >
            <Star className="h-4 w-4" fill={starred ? "currentColor" : "none"} />
          </Button>
          
          <Button 
            size="sm"
            onClick={handleUse}
          >
            Use Template
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default MarketplaceTemplate;
