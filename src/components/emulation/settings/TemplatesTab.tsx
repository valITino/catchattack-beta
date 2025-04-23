
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Template {
  id: string;
  name: string;
  description: string;
  techniques: string[];
  complexity: string;
}

interface TemplatesTabProps {
  templates: Template[];
  selectedTemplate: string;
  onTemplateSelect: (templateId: string) => void;
}

export function TemplatesTab({ templates, selectedTemplate, onTemplateSelect }: TemplatesTabProps) {
  return (
    <Card className="cyber-card">
      <CardHeader>
        <CardTitle>Adversary Templates</CardTitle>
        <CardDescription>Start with a pre-configured emulation template</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {templates.map(template => (
          <div 
            key={template.id}
            className={`p-4 border rounded-md cursor-pointer transition-colors ${
              selectedTemplate === template.id 
                ? 'border-cyber-primary bg-cyber-primary/10' 
                : 'border-cyber-primary/20 hover:border-cyber-primary/40'
            }`}
            onClick={() => onTemplateSelect(template.id)}
          >
            <div className="flex justify-between items-center">
              <h3 className="font-medium">{template.name}</h3>
              <Badge variant="outline">{template.complexity}</Badge>
            </div>
            <p className="text-sm text-gray-400 mt-2">{template.description}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {template.techniques.map(techId => (
                <Badge key={techId} variant="secondary" className="text-xs">
                  {techId}
                </Badge>
              ))}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
