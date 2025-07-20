'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Palette, 
  Layout, 
  Type,
  Monitor,
  Smartphone,
  Check
} from 'lucide-react';

import { useUnifiedResumeStore } from '@/lib/stores/unifiedResumeStore';

export const TemplateSelector: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  
  const { templates, applyTemplate } = useUnifiedResumeStore();

  // Mock templates - in a real app, these would come from the store
  const mockTemplates = [
    {
      id: 'modern-professional',
      name: 'Modern Professional',
      category: 'professional',
      preview: '/templates/modern-professional.png',
      description: 'Clean, modern design perfect for tech and business roles',
      features: ['ATS-Optimized', 'Single Column', 'Modern Typography'],
      structure: {
        columns: 1,
        headerStyle: 'modern',
        sectionStyle: 'clean',
        colorScheme: {
          primary: '#2563eb',
          accent: '#3b82f6',
          text: '#1f2937',
          background: '#ffffff',
        },
      },
    },
    {
      id: 'executive-classic',
      name: 'Executive Classic',
      category: 'professional',
      preview: '/templates/executive-classic.png',
      description: 'Traditional, elegant design for senior positions',
      features: ['Executive Style', 'Two Column', 'Classic Typography'],
      structure: {
        columns: 2,
        headerStyle: 'classic',
        sectionStyle: 'bordered',
        colorScheme: {
          primary: '#1f2937',
          accent: '#4b5563',
          text: '#111827',
          background: '#ffffff',
        },
      },
    },
    {
      id: 'creative-modern',
      name: 'Creative Modern',
      category: 'creative',
      preview: '/templates/creative-modern.png',
      description: 'Bold, creative design for design and marketing roles',
      features: ['Creative Layout', 'Color Accents', 'Modern Design'],
      structure: {
        columns: 2,
        headerStyle: 'bold',
        sectionStyle: 'cards',
        colorScheme: {
          primary: '#7c3aed',
          accent: '#a855f7',
          text: '#1f2937',
          background: '#ffffff',
        },
      },
    },
    {
      id: 'minimal-clean',
      name: 'Minimal Clean',
      category: 'simple',
      preview: '/templates/minimal-clean.png',
      description: 'Ultra-clean, minimal design focusing on content',
      features: ['Minimal Design', 'Maximum ATS', 'Clean Layout'],
      structure: {
        columns: 1,
        headerStyle: 'minimal',
        sectionStyle: 'clean',
        colorScheme: {
          primary: '#374151',
          accent: '#6b7280',
          text: '#111827',
          background: '#ffffff',
        },
      },
    },
    {
      id: 'tech-focused',
      name: 'Tech Focused',
      category: 'technical',
      preview: '/templates/tech-focused.png',
      description: 'Technical design optimized for software engineering roles',
      features: ['Tech Optimized', 'Code Friendly', 'Skills Focused'],
      structure: {
        columns: 1,
        headerStyle: 'modern',
        sectionStyle: 'timeline',
        colorScheme: {
          primary: '#059669',
          accent: '#10b981',
          text: '#1f2937',
          background: '#ffffff',
        },
      },
    },
    {
      id: 'designer-portfolio',
      name: 'Designer Portfolio',
      category: 'creative',
      preview: '/templates/designer-portfolio.png',
      description: 'Portfolio-style layout for designers and creatives',
      features: ['Portfolio Style', 'Visual Focus', 'Creative Layout'],
      structure: {
        columns: 2,
        headerStyle: 'bold',
        sectionStyle: 'cards',
        colorScheme: {
          primary: '#dc2626',
          accent: '#ef4444',
          text: '#1f2937',
          background: '#ffffff',
        },
      },
    },
  ];

  const categories = [
    { id: 'all', name: 'All Templates' },
    { id: 'professional', name: 'Professional' },
    { id: 'creative', name: 'Creative' },
    { id: 'simple', name: 'Simple' },
    { id: 'technical', name: 'Technical' },
  ];

  const [activeCategory, setActiveCategory] = useState('all');

  const filteredTemplates = activeCategory === 'all' 
    ? mockTemplates 
    : mockTemplates.filter(t => t.category === activeCategory);

  const handleApplyTemplate = () => {
    if (selectedTemplate) {
      applyTemplate(selectedTemplate);
      setIsOpen(false);
      setSelectedTemplate(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-6xl h-[80vh]">
        <DialogHeader>
          <DialogTitle className="text-2xl">Choose a Template</DialogTitle>
        </DialogHeader>
        
        <div className="flex h-full">
          {/* Template Grid */}
          <div className="flex-1 overflow-y-auto pr-4">
            {/* Category Tabs */}
            <Tabs value={activeCategory} onValueChange={setActiveCategory} className="mb-6">
              <TabsList className="grid w-full grid-cols-5">
                {categories.map((category) => (
                  <TabsTrigger key={category.id} value={category.id}>
                    {category.name}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>

            {/* Template Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTemplates.map((template) => (
                <Card 
                  key={template.id}
                  className={`cursor-pointer transition-all hover:shadow-lg ${
                    selectedTemplate === template.id 
                      ? 'ring-2 ring-blue-500 shadow-lg' 
                      : ''
                  }`}
                  onClick={() => setSelectedTemplate(template.id)}
                >
                  <CardContent className="p-4">
                    {/* Template Preview */}
                    <div className="aspect-[8.5/11] bg-gray-100 rounded-lg mb-3 relative overflow-hidden">
                      {/* Mock preview - in a real app, this would be an actual template preview */}
                      <div 
                        className="w-full h-full p-2"
                        style={{ backgroundColor: template.structure.colorScheme.background }}
                      >
                        <div 
                          className="w-full h-8 rounded mb-2"
                          style={{ backgroundColor: template.structure.colorScheme.primary }}
                        />
                        <div className="space-y-1">
                          {[...Array(8)].map((_, i) => (
                            <div 
                              key={i}
                              className="h-2 rounded"
                              style={{ 
                                backgroundColor: template.structure.colorScheme.text,
                                opacity: 0.1,
                                width: `${Math.random() * 40 + 60}%`
                              }}
                            />
                          ))}
                        </div>
                      </div>
                      
                      {/* Selection Indicator */}
                      {selectedTemplate === template.id && (
                        <div className="absolute top-2 right-2 bg-blue-500 text-white rounded-full p-1">
                          <Check className="w-3 h-3" />
                        </div>
                      )}
                    </div>

                    {/* Template Info */}
                    <div>
                      <h3 className="font-semibold text-sm mb-1">{template.name}</h3>
                      <p className="text-xs text-gray-600 mb-2">{template.description}</p>
                      
                      {/* Features */}
                      <div className="flex flex-wrap gap-1 mb-2">
                        {template.features.map((feature, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {feature}
                          </Badge>
                        ))}
                      </div>

                      {/* Template Details */}
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <Layout className="w-3 h-3" />
                          {template.structure.columns === 1 ? 'Single' : 'Two'} Column
                        </div>
                        <div className="flex items-center gap-1">
                          <Palette className="w-3 h-3" />
                          <div 
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: template.structure.colorScheme.primary }}
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Template Details Sidebar */}
          {selectedTemplate && (
            <div className="w-80 pl-4 border-l">
              {(() => {
                const template = mockTemplates.find(t => t.id === selectedTemplate);
                if (!template) return null;

                return (
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold">{template.name}</h3>
                      <p className="text-sm text-gray-600">{template.description}</p>
                    </div>

                    {/* Color Scheme */}
                    <div>
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <Palette className="w-4 h-4" />
                        Color Scheme
                      </h4>
                      <div className="flex gap-2">
                        <div 
                          className="w-8 h-8 rounded"
                          style={{ backgroundColor: template.structure.colorScheme.primary }}
                          title="Primary"
                        />
                        <div 
                          className="w-8 h-8 rounded"
                          style={{ backgroundColor: template.structure.colorScheme.accent }}
                          title="Accent"
                        />
                        <div 
                          className="w-8 h-8 rounded border"
                          style={{ backgroundColor: template.structure.colorScheme.background }}
                          title="Background"
                        />
                        <div 
                          className="w-8 h-8 rounded"
                          style={{ backgroundColor: template.structure.colorScheme.text }}
                          title="Text"
                        />
                      </div>
                    </div>

                    {/* Layout Info */}
                    <div>
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <Layout className="w-4 h-4" />
                        Layout
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Columns:</span>
                          <span>{template.structure.columns === 1 ? 'Single' : 'Two'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Header Style:</span>
                          <span className="capitalize">{template.structure.headerStyle}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Section Style:</span>
                          <span className="capitalize">{template.structure.sectionStyle}</span>
                        </div>
                      </div>
                    </div>

                    {/* Features */}
                    <div>
                      <h4 className="font-medium mb-2">Features</h4>
                      <div className="space-y-1">
                        {template.features.map((feature, index) => (
                          <div key={index} className="flex items-center gap-2 text-sm">
                            <Check className="w-3 h-3 text-green-500" />
                            {feature}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Preview Options */}
                    <div>
                      <h4 className="font-medium mb-2">Preview</h4>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="flex-1">
                          <Monitor className="w-4 h-4 mr-1" />
                          Desktop
                        </Button>
                        <Button size="sm" variant="outline" className="flex-1">
                          <Smartphone className="w-4 h-4 mr-1" />
                          Mobile
                        </Button>
                      </div>
                    </div>

                    {/* Apply Button */}
                    <div className="pt-4">
                      <Button 
                        onClick={handleApplyTemplate}
                        className="w-full"
                        size="lg"
                      >
                        Apply Template
                      </Button>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};