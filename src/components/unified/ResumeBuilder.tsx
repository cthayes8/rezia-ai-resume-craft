'use client';

import React, { useState } from 'react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { InputModal } from '@/components/ui/input-modal';
import { useToast } from '@/components/ui/toast-provider';
import { 
  Plus, 
  GripVertical, 
  Eye, 
  EyeOff, 
  Settings, 
  Sparkles,
  User,
  FileText,
  Briefcase,
  GraduationCap,
  Code,
  FolderOpen,
  Award,
  Globe,
  Upload,
  Loader2,
  Save,
  Check
} from 'lucide-react';

import { UnifiedResume } from '@/types/resume';
import { useUnifiedResumeStore } from '@/lib/stores/unifiedResumeStore';
import { SortableSection } from './SortableSection';
import { SectionEditor } from './SectionEditor';

interface ResumeBuilderProps {
  resume: UnifiedResume;
}

const sectionIcons = {
  basics: User,
  summary: FileText,
  experience: Briefcase,
  education: GraduationCap,
  skills: Code,
  projects: FolderOpen,
  certifications: Award,
  languages: Globe,
};

const sectionTitles = {
  basics: 'Personal Information',
  summary: 'Professional Summary',
  experience: 'Work Experience',
  education: 'Education',
  skills: 'Skills',
  projects: 'Projects',
  certifications: 'Certifications',
  languages: 'Languages',
};

// Helper functions for dynamic sections
const getSectionIcon = (sectionId: string, resume: UnifiedResume) => {
  // Check if it's a standard section
  if (sectionIcons[sectionId as keyof typeof sectionIcons]) {
    return sectionIcons[sectionId as keyof typeof sectionIcons];
  }
  
  // For custom sections, use a generic icon
  if (sectionId.startsWith('custom_')) {
    return FileText;
  }
  
  return FileText; // Fallback
};

const getSectionTitle = (sectionId: string, resume: UnifiedResume) => {
  // Check if it's a standard section
  if (sectionTitles[sectionId as keyof typeof sectionTitles]) {
    return sectionTitles[sectionId as keyof typeof sectionTitles];
  }
  
  // For custom sections, get the title from the custom section data
  if (sectionId.startsWith('custom_') && resume.builder.sections.custom) {
    const customSection = resume.builder.sections.custom.find(cs => cs.id === sectionId);
    if (customSection) {
      return customSection.title;
    }
  }
  
  // Fallback: format the section ID
  return sectionId.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

const getSectionData = (sectionId: string, resume: UnifiedResume) => {
  // Check if it's a standard section
  if (resume.builder.sections[sectionId as keyof typeof resume.builder.sections]) {
    return resume.builder.sections[sectionId as keyof typeof resume.builder.sections];
  }
  
  // For custom sections, find the data in the custom array
  if (sectionId.startsWith('custom_') && resume.builder.sections.custom) {
    const customSection = resume.builder.sections.custom.find(cs => cs.id === sectionId);
    return customSection || null;
  }
  
  return null;
};

export const ResumeBuilder: React.FC<ResumeBuilderProps> = ({ resume }) => {
  const [activeSection, setActiveSection] = useState<string>('basics');
  const [showSectionManager, setShowSectionManager] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showCustomSectionModal, setShowCustomSectionModal] = useState(false);
  
  const { success, error: showError } = useToast();
  
  const {
    updateSection,
    reorderSections,
    toggleSectionVisibility,
    optimizerState,
    populateFromUpload,
    addCustomSection,
    builderState,
    saveResumeImmediately
  } = useUnifiedResumeStore();

  // Handler for adding custom sections
  const handleAddCustomSection = () => {
    setShowCustomSectionModal(true);
  };

  const handleCustomSectionCreate = (title: string) => {
    const newSectionId = addCustomSection(title);
    if (newSectionId) {
      setActiveSection(newSectionId);
      success(`"${title}" section added successfully!`);
    } else {
      showError('Failed to add custom section. Please try again.');
    }
  };

  // Safety check for resume data
  if (!resume || !resume.builder || !resume.builder.sectionOrder || !resume.builder.sections) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-reslo-blue mx-auto mb-4" />
          <p>Loading resume data...</p>
        </div>
      </div>
    );
  }

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    
    if (active.id !== over.id && resume.builder.sectionOrder) {
      const oldIndex = resume.builder.sectionOrder.findIndex(id => id === active.id);
      const newIndex = resume.builder.sectionOrder.findIndex(id => id === over.id);
      
      if (oldIndex !== -1 && newIndex !== -1) {
        const newOrder = arrayMove(resume.builder.sectionOrder, oldIndex, newIndex);
        reorderSections(newOrder);
      }
    }
  };

  const visibleSections = resume.builder.sectionOrder?.filter(
    sectionId => resume.builder.visibility[sectionId]
  ) || [];

  const getSectionSuggestions = (sectionId: string) => {
    return optimizerState.suggestions?.filter(s => s.section === sectionId) || [];
  };

  const getSectionCompleteness = (sectionId: string) => {
    const section = resume.builder.sections[sectionId as keyof typeof resume.builder.sections];
    
    switch (sectionId) {
      case 'basics':
        const basics = section as any;
        const requiredFields = ['firstName', 'lastName', 'email', 'phone'];
        const filledFields = requiredFields.filter(field => basics[field]?.trim());
        return (filledFields.length / requiredFields.length) * 100;
      
      case 'summary':
        const summary = section as any;
        return summary?.content?.trim() ? 100 : 0;
      
      case 'experience':
        const experience = section as any[];
        return experience?.length > 0 ? 100 : 0;
      
      case 'education':
        const education = section as any[];
        return education?.length > 0 ? 100 : 0;
      
      case 'skills':
        const skills = section as any[];
        return skills?.length > 0 ? 100 : 0;
      
      default:
        return 0;
    }
  };

  const handleResumeUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
    if (!allowedTypes.includes(file.type)) {
      showError('Please upload a PDF, DOCX, or TXT file');
      return;
    }

    setIsUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/parse-resume', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Failed to parse resume');
      }

      const result = await response.json();
      
      if (result.success && result.data) {
        // Seamlessly populate sections from uploaded data
        await populateFromUpload(result.data);
        
        // Automatically switch to basics section for user to review
        setActiveSection('basics');
        success('Resume uploaded and parsed successfully!', 'Upload Complete');
      } else {
        throw new Error(result.error || 'Failed to parse resume');
      }
    } catch (error) {
      console.error('Error uploading resume:', error);
      // Only show error for actual failures
      showError('Failed to parse resume. Please try uploading a different file or enter information manually.', 'Upload Failed');
    } finally {
      setIsUploading(false);
      // Reset the input
      event.target.value = '';
    }
  };

  return (
    <div className="h-full flex">
      {/* Section Navigation */}
      <div className="w-64 bg-gray-50 border-r overflow-y-auto">
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Resume Sections</h2>
            <div className="flex gap-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowSectionManager(!showSectionManager)}
              >
                <Settings className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Save Status Indicator */}
          <div className="mb-4 px-3 py-2 rounded-lg bg-gray-100 border border-gray-200">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                {builderState.isDirty ? (
                  <>
                    <Save className="w-4 h-4 text-yellow-600" />
                    <span className="text-yellow-700">Auto-saving...</span>
                  </>
                ) : builderState.lastSaved ? (
                  <>
                    <Check className="w-4 h-4 text-green-600" />
                    <span className="text-green-700">Saved</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-600">Ready</span>
                  </>
                )}
              </div>
              {builderState.lastSaved && (
                <span className="text-xs text-gray-500">
                  {new Date(builderState.lastSaved).toLocaleTimeString()}
                </span>
              )}
            </div>
            {builderState.isDirty && (
              <Button
                size="sm"
                variant="ghost"
                className="mt-1 h-6 px-2 text-xs"
                onClick={() => saveResumeImmediately(resume.id)}
              >
                Save now
              </Button>
            )}
          </div>

          {/* Upload Resume Button */}
          <div className="mb-4">
            <label htmlFor="resume-upload" className="cursor-pointer">
              <Button
                size="sm"
                variant="outline"
                className="w-full border-dashed"
                disabled={isUploading}
                asChild
              >
                <span>
                  {isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Parsing Resume...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Resume to Auto-Fill
                    </>
                  )}
                </span>
              </Button>
            </label>
            <input
              id="resume-upload"
              type="file"
              accept=".pdf,.docx,.txt"
              onChange={handleResumeUpload}
              className="hidden"
              disabled={isUploading}
            />
            <p className="text-xs text-gray-500 mt-1 text-center">
              Upload PDF, DOCX, or TXT to auto-fill sections
            </p>
          </div>

          {/* Section Manager */}
          {showSectionManager && (
            <Card className="mb-4">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Manage Sections</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={resume.builder.sectionOrder || []}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-2">
                      {resume.builder.sectionOrder?.map((sectionId) => (
                        <SortableSection
                          key={sectionId}
                          id={sectionId}
                          title={getSectionTitle(sectionId, resume)}
                          visible={resume.builder.visibility[sectionId]}
                          onToggleVisibility={() => toggleSectionVisibility(sectionId)}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              </CardContent>
            </Card>
          )}

          {/* Section List */}
          <div className="space-y-1">
            {visibleSections.map((sectionId) => {
              const Icon = getSectionIcon(sectionId, resume);
              const suggestions = getSectionSuggestions(sectionId);
              const completeness = getSectionCompleteness(sectionId);
              
              return (
                <button
                  key={sectionId}
                  onClick={() => setActiveSection(sectionId)}
                  className={`w-full p-3 rounded-lg text-left transition-colors ${
                    activeSection === sectionId
                      ? 'bg-reslo-blue/10 border border-reslo-blue/20 text-reslo-blue'
                      : 'hover:bg-gray-100 text-gray-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm truncate">
                          {getSectionTitle(sectionId, resume)}
                        </span>
                        {suggestions.length > 0 && (
                          <Badge variant="secondary" className="ml-1 px-1 py-0 text-xs">
                            {suggestions.length}
                          </Badge>
                        )}
                      </div>
                      
                      {/* Completeness bar */}
                      <div className="mt-1 w-full bg-gray-200 rounded-full h-1">
                        <div
                          className={`h-1 rounded-full transition-all ${
                            completeness === 100 ? 'bg-green-500' :
                            completeness > 50 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${completeness}%` }}
                        />
                      </div>
                      
                      {suggestions.length > 0 && (
                        <div className="flex items-center gap-1 mt-1">
                          <Sparkles className="w-3 h-3 text-reslo-blue" />
                          <span className="text-xs text-reslo-blue">
                            AI suggestions available
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Add Section Button */}
          <Button
            variant="ghost"
            className="w-full mt-4 border-dashed border-2"
            onClick={handleAddCustomSection}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Custom Section
          </Button>
        </div>
      </div>

      {/* Section Editor */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {activeSection && (
          <SectionEditor
            sectionType={activeSection}
            data={getSectionData(activeSection, resume)}
            onChange={(newData) => updateSection(activeSection, newData)}
            suggestions={getSectionSuggestions(activeSection)}
            resume={resume}
          />
        )}
      </div>

      {/* Custom Section Modal */}
      <InputModal
        isOpen={showCustomSectionModal}
        onClose={() => setShowCustomSectionModal(false)}
        onConfirm={handleCustomSectionCreate}
        title="Add Custom Section"
        description="Enter a name for your custom section (e.g., Publications, Awards, Volunteer Work)"
        placeholder="Section name..."
        confirmText="Add Section"
        cancelText="Cancel"
      />
    </div>
  );
};