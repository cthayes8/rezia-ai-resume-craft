'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Palette, 
  Layout, 
  Type,
  Monitor,
  Smartphone,
  Check,
  Eye
} from 'lucide-react';

import { useUnifiedResumeStore } from '@/lib/stores/unifiedResumeStore';

export const InlineTemplateGallery: React.FC = () => {
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState('all');
  
  const { templates, applyTemplate, updateMetadata } = useUnifiedResumeStore();

  // Enhanced template collection with more variety
  const availableTemplates = [
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
    {
      id: 'academic-formal',
      name: 'Academic Formal',
      category: 'academic',
      preview: '/templates/academic-formal.png',
      description: 'Traditional academic layout for education and research',
      features: ['Academic Style', 'Publication Ready', 'Formal Layout'],
      structure: {
        columns: 1,
        headerStyle: 'formal',
        sectionStyle: 'structured',
        colorScheme: {
          primary: '#1e40af',
          accent: '#3b82f6',
          text: '#1f2937',
          background: '#ffffff',
        },
      },
    },
    {
      id: 'startup-dynamic',
      name: 'Startup Dynamic',
      category: 'modern',
      preview: '/templates/startup-dynamic.png',
      description: 'Energetic design perfect for startups and entrepreneurial roles',
      features: ['Dynamic Layout', 'Growth Focused', 'Startup Ready'],
      structure: {
        columns: 1,
        headerStyle: 'dynamic',
        sectionStyle: 'modern',
        colorScheme: {
          primary: '#f59e0b',
          accent: '#fbbf24',
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
    { id: 'academic', name: 'Academic' },
    { id: 'modern', name: 'Modern' },
  ];

  const filteredTemplates = activeCategory === 'all' 
    ? availableTemplates 
    : availableTemplates.filter(t => t.category === activeCategory);

  // Handle template preview (live preview without applying)
  const handlePreviewTemplate = (templateId: string) => {
    setSelectedTemplate(templateId);
    const template = availableTemplates.find(t => t.id === templateId);
    if (template) {
      // Temporarily update metadata for preview
      updateMetadata({
        template: templateId,
        color: template.structure.colorScheme,
        fontFamily: template.structure.headerStyle === 'modern' ? 'Inter' : 'Georgia',
      });
    }
  };

  // Handle template application (permanent change)
  const handleApplyTemplate = (templateId: string) => {
    applyTemplate(templateId);
    setSelectedTemplate(templateId);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Choose Your Template</h2>
        <p className="text-gray-600">
          Select a template to see how your resume looks. Click "Apply" to make it permanent.
        </p>
      </div>

      {/* Category Tabs */}
      <Tabs value={activeCategory} onValueChange={setActiveCategory}>
        <TabsList className="grid w-full grid-cols-4 lg:grid-cols-7">
          {categories.map((category) => (
            <TabsTrigger 
              key={category.id} 
              value={category.id}
              className="text-xs lg:text-sm"
            >
              {category.name}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Template Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredTemplates.map((template) => (
          <Card 
            key={template.id}
            className={`cursor-pointer transition-all hover:shadow-lg group ${
              selectedTemplate === template.id 
                ? 'ring-2 ring-blue-500 shadow-lg' 
                : ''
            }`}
          >
            <CardContent className="p-4">
              {/* Template Preview */}
              <div className="aspect-[8.5/11] bg-gray-100 rounded-lg mb-4 relative overflow-hidden">
                {/* Enhanced mock preview */}
                <div 
                  className="w-full h-full p-3"
                  style={{ backgroundColor: template.structure.colorScheme.background }}
                >
                  {/* Header */}
                  <div 
                    className="w-full h-6 rounded mb-3"
                    style={{ backgroundColor: template.structure.colorScheme.primary }}
                  />
                  
                  {/* Content sections */}
                  {template.structure.columns === 1 ? (
                    <div className="space-y-2">
                      {[...Array(6)].map((_, i) => (
                        <div key={i} className="space-y-1">
                          <div 
                            className="h-3 rounded"
                            style={{ 
                              backgroundColor: template.structure.colorScheme.accent,
                              opacity: 0.7,
                              width: '40%'
                            }}
                          />
                          {[...Array(2)].map((_, j) => (
                            <div 
                              key={j}
                              className="h-1 rounded"
                              style={{ 
                                backgroundColor: template.structure.colorScheme.text,
                                opacity: 0.2,
                                width: `${Math.random() * 30 + 70}%`
                              }}
                            />
                          ))}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-2 h-full">
                      <div className="col-span-2 space-y-2">
                        {[...Array(4)].map((_, i) => (
                          <div key={i} className="space-y-1">
                            <div 
                              className="h-2 rounded"
                              style={{ 
                                backgroundColor: template.structure.colorScheme.accent,
                                opacity: 0.7,
                                width: '60%'
                              }}
                            />
                            <div 
                              className="h-1 rounded"
                              style={{ 
                                backgroundColor: template.structure.colorScheme.text,
                                opacity: 0.2,
                                width: '90%'
                              }}
                            />
                          </div>
                        ))}
                      </div>
                      <div className="space-y-2">
                        {[...Array(3)].map((_, i) => (
                          <div key={i} className="space-y-1">
                            <div 
                              className="h-2 rounded"
                              style={{ 
                                backgroundColor: template.structure.colorScheme.accent,
                                opacity: 0.5
                              }}
                            />
                            {[...Array(3)].map((_, j) => (
                              <div 
                                key={j}
                                className="h-1 rounded"
                                style={{ 
                                  backgroundColor: template.structure.colorScheme.text,
                                  opacity: 0.1,
                                  width: `${Math.random() * 40 + 60}%`
                                }}
                              />
                            ))}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Selection Indicator */}
                {selectedTemplate === template.id && (
                  <div className="absolute top-2 right-2 bg-blue-500 text-white rounded-full p-1">
                    <Check className="w-3 h-3" />
                  </div>
                )}

                {/* Hover Actions */}
                <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handlePreviewTemplate(template.id)}
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    Preview
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleApplyTemplate(template.id)}
                  >
                    Apply
                  </Button>
                </div>
              </div>

              {/* Template Info */}
              <div>
                <h3 className="font-semibold text-sm mb-1">{template.name}</h3>
                <p className="text-xs text-gray-600 mb-3 line-clamp-2">{template.description}</p>
                
                {/* Features */}
                <div className="flex flex-wrap gap-1 mb-3">
                  {template.features.slice(0, 2).map((feature, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {feature}
                    </Badge>
                  ))}
                  {template.features.length > 2 && (
                    <Badge variant="outline" className="text-xs">
                      +{template.features.length - 2}
                    </Badge>
                  )}
                </div>

                {/* Template Details */}
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center gap-1">
                    <Layout className="w-3 h-3" />
                    {template.structure.columns === 1 ? 'Single' : 'Two'} Column
                  </div>
                  <div className="flex items-center gap-1">
                    <Palette className="w-3 h-3" />
                    <div 
                      className="w-3 h-3 rounded-full border"
                      style={{ backgroundColor: template.structure.colorScheme.primary }}
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 mt-3">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handlePreviewTemplate(template.id)}
                    className="flex-1 text-xs"
                  >
                    <Eye className="w-3 h-3 mr-1" />
                    Preview
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleApplyTemplate(template.id)}
                    className="flex-1 text-xs"
                  >
                    Apply
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Selected Template Info */}
      {selectedTemplate && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-4">
            {(() => {
              const template = availableTemplates.find(t => t.id === selectedTemplate);
              if (!template) return null;

              return (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-8 h-8 rounded"
                      style={{ backgroundColor: template.structure.colorScheme.primary }}
                    />
                    <div>
                      <h4 className="font-semibold text-blue-900">{template.name}</h4>
                      <p className="text-sm text-blue-700">Currently previewing this template</p>
                    </div>
                  </div>
                  <Button 
                    onClick={() => handleApplyTemplate(template.id)}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Apply This Template
                  </Button>
                </div>
              );
            })()}
          </CardContent>
        </Card>
      )}
    </div>
  );
};