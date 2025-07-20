# Reslo AI Resume Builder Implementation Plan

## Executive Summary
This plan outlines how to build a world-class resume builder for Reslo AI, inspired by Reactive Resume's features but integrated seamlessly with your existing ATS optimization capabilities. The builder will create a powerful ecosystem where users can build, optimize, and track their resumes all in one place.

## Core Value Proposition
**"Build once, optimize everywhere"** - Create beautiful resumes that are both visually appealing AND ATS-optimized, with real-time feedback on how to improve them for specific jobs.

## Architecture Overview

### Tech Stack Alignment
- **Frontend**: React + TypeScript (matches current Reslo stack)
- **State Management**: Zustand with persistence
- **Styling**: Tailwind CSS + shadcn-ui
- **PDF Generation**: React-PDF or Puppeteer
- **Real-time Updates**: Optimistic UI updates
- **AI Integration**: OpenAI API (existing)

## Phase 1: Core Resume Builder (Week 1-3)

### 1.1 Data Models & Schema
```typescript
// models/resume-builder.model.ts
export interface ResumeDocument {
  id: string;
  userId: string;
  metadata: {
    title: string;
    slug: string;
    template: TemplateId;
    fontSize: number;
    fontFamily: string;
    color: {
      primary: string;
      accent: string;
      text: string;
      background: string;
    };
    spacing: {
      page: number;
      section: number;
      paragraph: number;
    };
    pageSize: 'a4' | 'letter';
    columns: 1 | 2;
  };
  
  sections: {
    basics: BasicInfo;
    summary: Summary;
    experience: Experience[];
    education: Education[];
    skills: SkillGroup[];
    projects: Project[];
    certifications: Certification[];
    languages: Language[];
    interests: Interest[];
    references: Reference[];
    custom: CustomSection[];
  };
  
  layout: {
    sections: SectionLayout[];
    visibility: Record<string, boolean>;
  };
  
  analytics: {
    views: number;
    downloads: number;
    lastViewed: Date;
    shares: ShareEvent[];
  };
  
  version: number;
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
  lockedAt?: Date;
}

interface SectionLayout {
  id: string;
  type: SectionType;
  column: 0 | 1; // For 2-column layouts
  order: number;
  customTitle?: string;
}

interface BasicInfo {
  firstName: string;
  lastName: string;
  headline: string;
  email: string;
  phone: string;
  website: string;
  location: {
    address: string;
    city: string;
    region: string;
    postalCode: string;
    country: string;
  };
  profiles: SocialProfile[];
  photo?: {
    url: string;
    visible: boolean;
    filters: {
      grayscale: boolean;
      border: boolean;
      size: 'small' | 'medium' | 'large';
    };
  };
}

interface Experience {
  id: string;
  company: string;
  position: string;
  website?: string;
  startDate: string;
  endDate?: string;
  current: boolean;
  location?: string;
  summary: string;
  highlights: string[];
  keywords: string[]; // AI-extracted for ATS
}
```

### 1.2 Resume Editor Component
```tsx
// components/resume-builder/ResumeEditor.tsx
import React, { useState, useCallback, useEffect } from 'react';
import { useResumeStore } from '@/stores/resume-builder-store';
import { SectionEditor } from './SectionEditor';
import { TemplatePreview } from './TemplatePreview';
import { Toolbar } from './Toolbar';
import { useAutoSave } from '@/hooks/useAutoSave';
import { useLivePreview } from '@/hooks/useLivePreview';

export const ResumeEditor: React.FC = () => {
  const { 
    currentResume, 
    updateSection, 
    updateMetadata,
    saveResume 
  } = useResumeStore();
  
  const [activeSection, setActiveSection] = useState<string>('basics');
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');
  
  // Auto-save every 2 seconds after changes
  useAutoSave(currentResume, saveResume, 2000);
  
  // Live preview updates
  const previewRef = useLivePreview(currentResume);
  
  return (
    <div className="h-screen flex">
      {/* Left Panel - Editor */}
      <div className="w-1/2 overflow-y-auto bg-gray-50 p-6">
        <Toolbar 
          resume={currentResume}
          onMetadataChange={updateMetadata}
        />
        
        <div className="mt-6 space-y-6">
          {Object.entries(currentResume.sections).map(([key, value]) => (
            <SectionEditor
              key={key}
              sectionType={key}
              data={value}
              isActive={activeSection === key}
              onActivate={() => setActiveSection(key)}
              onChange={(newData) => updateSection(key, newData)}
            />
          ))}
        </div>
      </div>
      
      {/* Right Panel - Live Preview */}
      <div className="w-1/2 bg-white shadow-lg overflow-hidden">
        <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
          <h3 className="font-semibold">Live Preview</h3>
          <div className="flex gap-2">
            <button
              onClick={() => setPreviewMode('desktop')}
              className={`px-3 py-1 rounded ${
                previewMode === 'desktop' ? 'bg-blue-500 text-white' : 'bg-gray-200'
              }`}
            >
              Desktop
            </button>
            <button
              onClick={() => setPreviewMode('mobile')}
              className={`px-3 py-1 rounded ${
                previewMode === 'mobile' ? 'bg-blue-500 text-white' : 'bg-gray-200'
              }`}
            >
              Mobile
            </button>
          </div>
        </div>
        
        <div className={`p-8 ${previewMode === 'mobile' ? 'max-w-sm mx-auto' : ''}`}>
          <TemplatePreview 
            ref={previewRef}
            resume={currentResume}
            template={currentResume.metadata.template}
            scale={previewMode === 'mobile' ? 0.6 : 1}
          />
        </div>
      </div>
    </div>
  );
};
```

### 1.3 Drag-and-Drop Section Management
```tsx
// components/resume-builder/SectionManager.tsx
import React from 'react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { SortableSection } from './SortableSection';

interface SectionManagerProps {
  sections: SectionLayout[];
  onReorder: (sections: SectionLayout[]) => void;
  onToggleVisibility: (sectionId: string) => void;
}

export const SectionManager: React.FC<SectionManagerProps> = ({
  sections,
  onReorder,
  onToggleVisibility
}) => {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  
  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    
    if (active.id !== over.id) {
      const oldIndex = sections.findIndex(s => s.id === active.id);
      const newIndex = sections.findIndex(s => s.id === over.id);
      onReorder(arrayMove(sections, oldIndex, newIndex));
    }
  };
  
  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={sections.map(s => s.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-2">
          {sections.map((section) => (
            <SortableSection
              key={section.id}
              section={section}
              onToggleVisibility={() => onToggleVisibility(section.id)}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
};
```

## Phase 2: Template System (Week 4-5)

### 2.1 Template Engine
```typescript
// templates/template-engine.ts
export interface Template {
  id: string;
  name: string;
  category: 'professional' | 'modern' | 'creative' | 'simple' | 'technical';
  preview: string;
  structure: {
    columns: 1 | 2;
    headerStyle: 'classic' | 'modern' | 'minimal' | 'bold';
    sectionStyle: 'bordered' | 'clean' | 'timeline' | 'cards';
    colorScheme: ColorScheme;
    typography: Typography;
  };
  render: (resume: ResumeDocument) => JSX.Element;
}

// Template implementations
export const templates: Record<string, Template> = {
  // Professional Templates
  'azurill': {
    id: 'azurill',
    name: 'Azurill',
    category: 'professional',
    preview: '/templates/azurill-preview.png',
    structure: {
      columns: 1,
      headerStyle: 'classic',
      sectionStyle: 'clean',
      colorScheme: {
        primary: '#2563eb',
        accent: '#3b82f6',
        text: '#1f2937',
        background: '#ffffff'
      },
      typography: {
        headingFont: 'Inter',
        bodyFont: 'Inter',
        fontSize: {
          name: '2rem',
          heading: '1.25rem',
          subheading: '1rem',
          body: '0.875rem'
        }
      }
    },
    render: (resume) => <AzurillTemplate resume={resume} />
  },
  
  // Modern Templates
  'pikachu': {
    id: 'pikachu',
    name: 'Pikachu',
    category: 'modern',
    preview: '/templates/pikachu-preview.png',
    structure: {
      columns: 2,
      headerStyle: 'modern',
      sectionStyle: 'cards',
      colorScheme: {
        primary: '#fbbf24',
        accent: '#f59e0b',
        text: '#111827',
        background: '#fffbeb'
      },
      typography: {
        headingFont: 'Poppins',
        bodyFont: 'Open Sans',
        fontSize: {
          name: '2.5rem',
          heading: '1.5rem',
          subheading: '1.125rem',
          body: '0.9375rem'
        }
      }
    },
    render: (resume) => <PikachuTemplate resume={resume} />
  }
};
```

### 2.2 Template Components
```tsx
// templates/professional/AzurillTemplate.tsx
import React from 'react';
import { ResumeDocument } from '@/models/resume-builder.model';
import { formatDate } from '@/utils/date';

interface TemplateProps {
  resume: ResumeDocument;
}

export const AzurillTemplate: React.FC<TemplateProps> = ({ resume }) => {
  const { sections, metadata } = resume;
  const { basics, experience, education, skills } = sections;
  
  return (
    <div 
      className="resume-template azurill"
      style={{
        fontFamily: metadata.fontFamily,
        fontSize: `${metadata.fontSize}px`,
        color: metadata.color.text
      }}
    >
      {/* Header */}
      <header className="mb-6 text-center border-b-2 pb-4" 
        style={{ borderColor: metadata.color.primary }}>
        <h1 className="text-3xl font-bold mb-1">
          {basics.firstName} {basics.lastName}
        </h1>
        {basics.headline && (
          <p className="text-lg text-gray-600 mb-2">{basics.headline}</p>
        )}
        <div className="flex justify-center gap-4 text-sm">
          <span>{basics.email}</span>
          <span>{basics.phone}</span>
          {basics.location.city && (
            <span>{basics.location.city}, {basics.location.region}</span>
          )}
        </div>
      </header>
      
      {/* Summary */}
      {sections.summary?.content && (
        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-2" 
            style={{ color: metadata.color.primary }}>
            Professional Summary
          </h2>
          <p className="text-justify">{sections.summary.content}</p>
        </section>
      )}
      
      {/* Experience */}
      {experience.length > 0 && (
        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-3" 
            style={{ color: metadata.color.primary }}>
            Experience
          </h2>
          {experience.map((exp, idx) => (
            <div key={exp.id} className="mb-4">
              <div className="flex justify-between items-baseline">
                <h3 className="font-semibold">{exp.position}</h3>
                <span className="text-sm text-gray-600">
                  {formatDate(exp.startDate)} - {exp.current ? 'Present' : formatDate(exp.endDate)}
                </span>
              </div>
              <p className="text-gray-700 mb-1">{exp.company}</p>
              {exp.summary && <p className="mb-2">{exp.summary}</p>}
              {exp.highlights.length > 0 && (
                <ul className="list-disc list-inside space-y-1">
                  {exp.highlights.map((highlight, hidx) => (
                    <li key={hidx}>{highlight}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </section>
      )}
      
      {/* Skills */}
      {skills.length > 0 && (
        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-3" 
            style={{ color: metadata.color.primary }}>
            Skills
          </h2>
          <div className="flex flex-wrap gap-2">
            {skills.flatMap(group => group.items).map((skill, idx) => (
              <span 
                key={idx}
                className="px-3 py-1 rounded-full text-sm"
                style={{ 
                  backgroundColor: `${metadata.color.primary}20`,
                  color: metadata.color.primary 
                }}
              >
                {skill.name}
              </span>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
```

## Phase 3: AI Integration & Smart Features (Week 6-7)

### 3.1 AI-Powered Content Enhancement
```typescript
// services/ai-resume-builder.service.ts
export class AIResumeBuilderService {
  constructor(private openaiService: OpenAIService) {}
  
  async enhanceJobDescription(
    description: string,
    targetRole?: string
  ): Promise<EnhancedDescription> {
    const prompt = `
      Enhance this job description to be more impactful and ATS-friendly:
      "${description}"
      ${targetRole ? `Target Role: ${targetRole}` : ''}
      
      Return:
      1. Enhanced version with power verbs and quantified achievements
      2. Keywords that should be included for ATS
      3. Suggested metrics to add
      
      Format as JSON.
    `;
    
    const response = await this.openaiService.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" }
    });
    
    return JSON.parse(response.choices[0].message.content);
  }
  
  async generateBulletPoints(
    role: string,
    company: string,
    responsibilities: string
  ): Promise<string[]> {
    const prompt = `
      Generate 3-5 impactful bullet points for this role:
      Position: ${role}
      Company: ${company}
      Responsibilities: ${responsibilities}
      
      Each bullet should:
      - Start with a strong action verb
      - Include quantified results where possible
      - Be ATS-friendly
      - Be 1-2 lines maximum
      
      Return as JSON array of strings.
    `;
    
    const response = await this.openaiService.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" }
    });
    
    return JSON.parse(response.choices[0].message.content).bullets;
  }
  
  async suggestSkills(
    experience: Experience[],
    targetRole: string
  ): Promise<SkillSuggestion[]> {
    const prompt = `
      Based on this experience and target role, suggest relevant skills:
      Experience: ${JSON.stringify(experience)}
      Target Role: ${targetRole}
      
      Return categories:
      1. Technical Skills
      2. Soft Skills
      3. Tools & Technologies
      4. Industry Knowledge
      
      For each skill, provide:
      - name
      - relevance (1-10)
      - category
      - ATS variations
    `;
    
    const response = await this.openaiService.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" }
    });
    
    return JSON.parse(response.choices[0].message.content).skills;
  }
  
  async translateResume(
    resume: ResumeDocument,
    targetLanguage: string
  ): Promise<ResumeDocument> {
    // Translate all text content while preserving structure
    const translatedSections = await Promise.all(
      Object.entries(resume.sections).map(async ([key, section]) => {
        const translatedSection = await this.translateSection(section, targetLanguage);
        return [key, translatedSection];
      })
    );
    
    return {
      ...resume,
      sections: Object.fromEntries(translatedSections)
    };
  }
}
```

### 3.2 Smart Suggestions Component
```tsx
// components/resume-builder/SmartSuggestions.tsx
import React, { useState, useEffect } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAISuggestions } from '@/hooks/useAISuggestions';

interface SmartSuggestionsProps {
  section: string;
  currentContent: any;
  targetRole?: string;
  onApplySuggestion: (suggestion: any) => void;
}

export const SmartSuggestions: React.FC<SmartSuggestionsProps> = ({
  section,
  currentContent,
  targetRole,
  onApplySuggestion
}) => {
  const { suggestions, loading, generateSuggestions } = useAISuggestions();
  const [selectedSuggestions, setSelectedSuggestions] = useState<Set<string>>(new Set());
  
  useEffect(() => {
    if (targetRole) {
      generateSuggestions(section, currentContent, targetRole);
    }
  }, [section, targetRole]);
  
  const handleApplySelected = () => {
    const selected = suggestions.filter(s => selectedSuggestions.has(s.id));
    selected.forEach(suggestion => onApplySuggestion(suggestion));
    setSelectedSuggestions(new Set());
  };
  
  if (!targetRole) {
    return (
      <Card className="border-dashed">
        <CardContent className="text-center py-6">
          <p className="text-sm text-gray-500">
            Add a target role to get AI-powered suggestions
          </p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-sm flex items-center gap-2">
          <Sparkles className="w-4 h-4" />
          AI Suggestions
        </CardTitle>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => generateSuggestions(section, currentContent, targetRole)}
          disabled={loading}
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Refresh'}
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {suggestions.map((suggestion) => (
          <div
            key={suggestion.id}
            className={`p-3 rounded-lg border cursor-pointer transition-colors ${
              selectedSuggestions.has(suggestion.id)
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => {
              const newSelected = new Set(selectedSuggestions);
              if (newSelected.has(suggestion.id)) {
                newSelected.delete(suggestion.id);
              } else {
                newSelected.add(suggestion.id);
              }
              setSelectedSuggestions(newSelected);
            }}
          >
            <div className="flex justify-between items-start mb-2">
              <span className="text-sm font-medium">{suggestion.type}</span>
              <Badge variant="outline" className="text-xs">
                +{suggestion.impact}% match
              </Badge>
            </div>
            <p className="text-sm text-gray-700">{suggestion.content}</p>
            {suggestion.keywords && (
              <div className="mt-2 flex gap-1 flex-wrap">
                {suggestion.keywords.map((keyword, idx) => (
                  <span
                    key={idx}
                    className="text-xs px-2 py-1 bg-gray-100 rounded"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
        
        {selectedSuggestions.size > 0 && (
          <Button
            onClick={handleApplySelected}
            className="w-full"
            size="sm"
          >
            Apply {selectedSuggestions.size} Suggestion{selectedSuggestions.size > 1 ? 's' : ''}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
```

## Phase 4: Real-time Collaboration & Sharing (Week 8-9)

### 4.1 Resume Sharing System
```typescript
// services/resume-sharing.service.ts
export class ResumeSharingService {
  async createShareableLink(
    resumeId: string,
    options: ShareOptions
  ): Promise<ShareableLink> {
    const shareId = generateShareId();
    const link = {
      id: shareId,
      resumeId,
      url: `${process.env.NEXT_PUBLIC_BASE_URL}/r/${shareId}`,
      shortUrl: await this.createShortUrl(shareId),
      permissions: options.permissions || 'view',
      expiresAt: options.expiresAt,
      password: options.password ? await this.hashPassword(options.password) : null,
      analytics: {
        views: 0,
        downloads: 0,
        lastViewed: null,
        visitors: []
      }
    };
    
    await this.saveShareLink(link);
    return link;
  }
  
  async trackView(shareId: string, visitorInfo: VisitorInfo) {
    const analytics = await this.getAnalytics(shareId);
    
    analytics.views++;
    analytics.lastViewed = new Date();
    analytics.visitors.push({
      ...visitorInfo,
      timestamp: new Date(),
      referrer: visitorInfo.referrer,
      device: this.detectDevice(visitorInfo.userAgent)
    });
    
    await this.updateAnalytics(shareId, analytics);
    
    // Real-time notification
    await this.notifyOwner(shareId, 'view', visitorInfo);
  }
}
```

### 4.2 Public Resume Page
```tsx
// app/r/[shareId]/page.tsx
import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Download, Share2, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TemplateRenderer } from '@/components/resume-builder/TemplateRenderer';
import { ResumeSharingService } from '@/services/resume-sharing.service';

export default function PublicResumePage() {
  const { shareId } = useParams();
  const [resume, setResume] = useState<ResumeDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [requiresPassword, setRequiresPassword] = useState(false);
  
  const sharingService = new ResumeSharingService();
  
  useEffect(() => {
    loadResume();
    trackView();
  }, [shareId]);
  
  const loadResume = async () => {
    try {
      const data = await sharingService.getSharedResume(shareId);
      if (data.requiresPassword) {
        setRequiresPassword(true);
      } else {
        setResume(data.resume);
      }
    } catch (error) {
      console.error('Error loading resume:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const trackView = async () => {
    await sharingService.trackView(shareId, {
      userAgent: navigator.userAgent,
      referrer: document.referrer,
      ip: await getClientIP()
    });
  };
  
  const handleDownload = async () => {
    const pdf = await generatePDF(resume);
    downloadFile(pdf, `${resume.metadata.title}.pdf`);
    await sharingService.trackDownload(shareId);
  };
  
  if (loading) {
    return <LoadingScreen />;
  }
  
  if (requiresPassword) {
    return <PasswordPrompt onSuccess={() => loadResume()} />;
  }
  
  if (!resume) {
    return <NotFoundScreen />;
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">
              {resume.sections.basics.firstName} {resume.sections.basics.lastName}
            </h1>
            <p className="text-gray-600">{resume.sections.basics.headline}</p>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
            <Button onClick={handleDownload} size="sm">
              <Download className="w-4 h-4 mr-2" />
              Download PDF
            </Button>
          </div>
        </div>
      </header>
      
      {/* Resume Display */}
      <main className="max-w-5xl mx-auto py-8 px-4">
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          <TemplateRenderer
            resume={resume}
            template={resume.metadata.template}
            mode="view"
          />
        </div>
        
        {/* View Counter */}
        <div className="mt-4 text-center text-sm text-gray-500">
          <Eye className="w-4 h-4 inline mr-1" />
          Viewed {resume.analytics.views} times
        </div>
      </main>
    </div>
  );
}
```

## Phase 5: Export & Integration Features (Week 10)

### 5.1 Multi-format Export System
```typescript
// services/export.service.ts
import { PDFDocument, rgb } from 'pdf-lib';
import { Document, Packer, Paragraph } from 'docx';
import * as XLSX from 'xlsx';

export class ExportService {
  async exportResume(
    resume: ResumeDocument,
    format: ExportFormat,
    options: ExportOptions = {}
  ): Promise<Blob> {
    switch (format) {
      case 'pdf':
        return this.exportToPDF(resume, options);
      case 'docx':
        return this.exportToDOCX(resume, options);
      case 'txt':
        return this.exportToTXT(resume, options);
      case 'json':
        return this.exportToJSON(resume);
      case 'linkedin':
        return this.exportToLinkedIn(resume);
      case 'ats':
        return this.exportToATS(resume);
    }
  }
  
  private async exportToPDF(
    resume: ResumeDocument,
    options: ExportOptions
  ): Promise<Blob> {
    // Use React PDF or Puppeteer for high-quality PDF generation
    const ReactPDF = await import('@react-pdf/renderer');
    const { pdf } = ReactPDF;
    
    const Template = templates[resume.metadata.template].pdfComponent;
    const document = <Template resume={resume} options={options} />;
    
    const pdfBlob = await pdf(document).toBlob();
    return pdfBlob;
  }
  
  private async exportToATS(
    resume: ResumeDocument
  ): Promise<Blob> {
    // Create ATS-optimized version
    const atsVersion = {
      ...resume,
      metadata: {
        ...resume.metadata,
        template: 'ats-friendly', // Force simple template
        columns: 1,
        fontSize: 11,
        fontFamily: 'Arial'
      }
    };
    
    // Remove complex formatting
    const cleanedSections = this.removeComplexFormatting(atsVersion.sections);
    
    // Generate simple PDF
    return this.exportToPDF({
      ...atsVersion,
      sections: cleanedSections
    }, { atsOptimized: true });
  }
}
```

### 5.2 Import from LinkedIn
```tsx
// components/resume-builder/LinkedInImporter.tsx
import React, { useState } from 'react';
import { Upload, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';

export const LinkedInImporter: React.FC<{ onImport: (data: any) => void }> = ({ 
  onImport 
}) => {
  const [importing, setImporting] = useState(false);
  const { toast } = useToast();
  
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    setImporting(true);
    try {
      const text = await file.text();
      const linkedInData = await parseLinkedInExport(text);
      
      // Convert LinkedIn format to our resume format
      const resumeData = await convertLinkedInToResume(linkedInData);
      
      onImport(resumeData);
      toast({
        title: "Import successful",
        description: "Your LinkedIn data has been imported successfully."
      });
    } catch (error) {
      toast({
        title: "Import failed",
        description: "Please ensure you're uploading a valid LinkedIn export file.",
        variant: "destructive"
      });
    } finally {
      setImporting(false);
    }
  };
  
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="text-center space-y-4">
          <Upload className="w-12 h-12 mx-auto text-gray-400" />
          <div>
            <h3 className="font-semibold mb-2">Import from LinkedIn</h3>
            <p className="text-sm text-gray-600 mb-4">
              Upload your LinkedIn data export to automatically fill your resume
            </p>
          </div>
          
          <div className="relative">
            <input
              type="file"
              accept=".zip,.csv"
              onChange={handleFileUpload}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              disabled={importing}
            />
            <Button disabled={importing}>
              {importing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Importing...
                </>
              ) : (
                'Choose File'
              )}
            </Button>
          </div>
          
          <p className="text-xs text-gray-500">
            <a 
              href="https://www.linkedin.com/help/linkedin/answer/50191"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:underline"
            >
              How to export your LinkedIn data
            </a>
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
```

## Phase 6: Analytics & Optimization Integration (Week 11-12)

### 6.1 Resume Analytics Dashboard
```tsx
// components/resume-builder/AnalyticsDashboard.tsx
import React from 'react';
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, Download, Share2, TrendingUp } from 'lucide-react';

interface AnalyticsDashboardProps {
  resumeId: string;
  analytics: ResumeAnalytics;
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  resumeId,
  analytics
}) => {
  const viewsOverTime = processViewsData(analytics.views);
  const deviceBreakdown = processDeviceData(analytics.visitors);
  const referrerSources = processReferrerData(analytics.visitors);
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Summary Cards */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Views</CardTitle>
          <Eye className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{analytics.totalViews}</div>
          <p className="text-xs text-muted-foreground">
            <TrendingUp className="h-3 w-3 inline mr-1" />
            +{analytics.viewsGrowth}% from last week
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Downloads</CardTitle>
          <Download className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{analytics.totalDownloads}</div>
          <p className="text-xs text-muted-foreground">
            {analytics.downloadRate}% download rate
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Shares</CardTitle>
          <Share2 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{analytics.totalShares}</div>
          <p className="text-xs text-muted-foreground">
            Across {analytics.uniqueVisitors} unique visitors
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">ATS Score</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{analytics.averageATSScore}%</div>
          <p className="text-xs text-muted-foreground">
            Across {analytics.jobApplications} applications
          </p>
        </CardContent>
      </Card>
      
      {/* Views Over Time Chart */}
      <Card className="col-span-full lg:col-span-2">
        <CardHeader>
          <CardTitle>Views Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={viewsOverTime}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line 
                type="monotone" 
                dataKey="views" 
                stroke="#3b82f6" 
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      
      {/* Device Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Device Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={deviceBreakdown}
                cx="50%"
                cy="50%"
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                label
              />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      
      {/* Top Referrers */}
      <Card>
        <CardHeader>
          <CardTitle>Top Referrers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {referrerSources.map((source, idx) => (
              <div key={idx} className="flex justify-between items-center">
                <span className="text-sm">{source.name}</span>
                <span className="text-sm font-medium">{source.count}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
```

### 6.2 ATS Optimization Integration
```tsx
// components/resume-builder/ATSOptimizer.tsx
import React, { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { useATSAnalysis } from '@/hooks/useATSAnalysis';

interface ATSOptimizerProps {
  resume: ResumeDocument;
  targetJob?: string;
  onOptimize: (suggestions: OptimizationSuggestion[]) => void;
}

export const ATSOptimizer: React.FC<ATSOptimizerProps> = ({
  resume,
  targetJob,
  onOptimize
}) => {
  const { analysis, analyze, optimizing } = useATSAnalysis();
  const [autoOptimize, setAutoOptimize] = useState(false);
  
  useEffect(() => {
    if (resume && targetJob) {
      analyze(resume, targetJob);
    }
  }, [resume, targetJob]);
  
  const handleAutoOptimize = async () => {
    setAutoOptimize(true);
    const suggestions = await generateOptimizations(analysis);
    onOptimize(suggestions);
    setAutoOptimize(false);
  };
  
  if (!analysis) return null;
  
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>ATS Optimization</span>
          <span className={`text-2xl font-bold ${getScoreColor(analysis.score)}`}>
            {analysis.score}%
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Progress value={analysis.score} className="h-2" />
        
        {/* Issues List */}
        <div className="space-y-2">
          {analysis.issues.map((issue, idx) => (
            <div
              key={idx}
              className="flex items-start gap-2 p-3 rounded-lg bg-gray-50"
            >
              {issue.severity === 'critical' ? (
                <XCircle className="w-5 h-5 text-red-500 mt-0.5" />
              ) : issue.severity === 'warning' ? (
                <AlertCircle className="w-5 h-5 text-yellow-500 mt-0.5" />
              ) : (
                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
              )}
              <div className="flex-1">
                <p className="text-sm font-medium">{issue.title}</p>
                <p className="text-xs text-gray-600 mt-1">{issue.description}</p>
                {issue.suggestion && (
                  <p className="text-xs text-blue-600 mt-1">
                    Suggestion: {issue.suggestion}
                  </p>
                )}
              </div>
              <span className="text-xs text-gray-500">-{issue.impact}%</span>
            </div>
          ))}
        </div>
        
        {/* Quick Actions */}
        <div className="pt-4 border-t space-y-2">
          <Button
            onClick={handleAutoOptimize}
            disabled={autoOptimize || analysis.score >= 95}
            className="w-full"
          >
            {autoOptimize ? 'Optimizing...' : 'Auto-Optimize for ATS'}
          </Button>
          
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" size="sm">
              Add Missing Keywords
            </Button>
            <Button variant="outline" size="sm">
              Simplify Formatting
            </Button>
          </div>
        </div>
        
        {/* Keyword Density */}
        {targetJob && (
          <div className="pt-4 border-t">
            <h4 className="text-sm font-medium mb-2">Keyword Density</h4>
            <div className="space-y-2">
              {analysis.keywordDensity.map((keyword, idx) => (
                <div key={idx} className="flex justify-between items-center">
                  <span className="text-sm">{keyword.term}</span>
                  <div className="flex items-center gap-2">
                    <Progress value={keyword.density * 10} className="w-20 h-2" />
                    <span className="text-xs text-gray-500">
                      {keyword.count}x
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
```

## Implementation Timeline & Milestones

### Phase 1-2 (Weeks 1-5): Core Builder
- ✅ Resume data model and storage
- ✅ Basic editor with sections
- ✅ Live preview functionality
- ✅ 5+ professional templates
- ✅ Save/load functionality

### Phase 3 (Weeks 6-7): AI Features
- ✅ Content enhancement
- ✅ Bullet point generation
- ✅ Skills suggestions
- ✅ Translation support
- ✅ Smart recommendations

### Phase 4 (Weeks 8-9): Sharing & Collaboration
- ✅ Public resume URLs
- ✅ Analytics tracking
- ✅ Password protection
- ✅ Download tracking
- ✅ Social sharing

### Phase 5 (Week 10): Export & Import
- ✅ Multi-format export (PDF, DOCX, TXT)
- ✅ LinkedIn import
- ✅ ATS-optimized export
- ✅ JSON backup/restore
- ✅ Batch export

### Phase 6 (Weeks 11-12): Integration & Polish
- ✅ Analytics dashboard
- ✅ ATS score integration
- ✅ Resume + Optimizer combo
- ✅ Performance optimization
- ✅ Mobile responsiveness

## Key Success Metrics

1. **User Engagement**
   - Average time in builder: >15 minutes
   - Resume completion rate: >70%
   - Templates used per user: 2-3

2. **Quality Metrics**
   - ATS compatibility score: >85%
   - Export success rate: >99%
   - AI suggestion acceptance: >60%

3. **Business Metrics**
   - User retention: >40% monthly
   - Resumes created per user: 3+
   - Share-to-application ratio: >50%

## Competitive Advantages Over Reactive Resume

1. **Integrated ATS Optimization**: Real-time feedback on ATS compatibility
2. **AI-Powered Content**: GPT-4 enhancement vs basic editing
3. **Job-Specific Optimization**: Tailor resumes to specific postings
4. **Advanced Analytics**: Track performance and optimize
5. **Seamless Workflow**: Build → Optimize → Apply in one platform

## Technical Considerations

1. **Performance**: Lazy load templates, optimize re-renders
2. **Security**: Encrypt sensitive data, secure sharing links
3. **Scalability**: CDN for PDFs, queue for exports
4. **Accessibility**: WCAG 2.1 AA compliance
5. **SEO**: Public resumes indexed for personal branding

This comprehensive plan will create a resume builder that not only matches Reactive Resume's features but surpasses it by integrating with your ATS optimization capabilities, creating a unique value proposition in the market.