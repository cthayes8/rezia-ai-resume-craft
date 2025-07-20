import { create } from 'zustand';
import { persist, devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { enableMapSet, enablePatches } from 'immer';
import { 
  UnifiedResume, 
  TargetJob, 
  KeywordAnalysis, 
  Improvement,
  OptimizationResult,
  Template 
} from '@/types/resume';

// Enable Immer plugins
enableMapSet();
enablePatches();

interface UnifiedResumeStore {
  // Data
  resumes: UnifiedResume[];
  currentResumeId: string | null;
  targetJobs: TargetJob[];
  analysis: KeywordAnalysis | null;
  templates: Template[];
  
  // Auto-save state
  autoSaveTimeouts: Map<string, NodeJS.Timeout>;
  
  // Builder State
  builderState: {
    isDirty: boolean;
    autoSaveEnabled: boolean;
    lastSaved: Date | null;
    activeSection: string;
    previewMode: 'desktop' | 'mobile';
    showOptimizationPanel: boolean;
  };
  
  // Optimizer State
  optimizerState: {
    isAnalyzing: boolean;
    autoOptimize: boolean;
    targetJobId: string | null;
    suggestions: Improvement[];
    realTimeAnalysis: boolean;
  };
  
  // UI State
  uiState: {
    splitView: boolean;
    activeTab: 'build' | 'score' | 'optimize' | 'templates';
    sidebarCollapsed: boolean;
  };
  
  // Actions
  loadResumes: () => Promise<void>;
  createResume: (data?: Partial<UnifiedResume>) => Promise<string>;
  updateResume: (id: string, updates: Partial<UnifiedResume>) => Promise<void>;
  updateResumeDebounced: (id: string, updates: Partial<UnifiedResume>) => void;
  saveResumeImmediately: (id: string) => Promise<void>;
  deleteResume: (id: string) => Promise<void>;
  duplicateResume: (id: string) => Promise<string>;
  
  setCurrentResume: (id: string) => void;
  updateSection: (section: string, data: any) => void;
  updateMetadata: (metadata: Partial<UnifiedResume['builder']['metadata']>) => void;
  reorderSections: (sectionOrder: string[]) => void;
  toggleSectionVisibility: (sectionId: string) => void;
  addCustomSection: (title: string) => string | undefined;
  removeCustomSection: (sectionId: string) => void;
  
  addTargetJob: (job: TargetJob) => void;
  removeTargetJob: (jobId: string) => void;
  optimizeForJob: (resumeId: string, jobId: string) => Promise<OptimizationResult>;
  
  analyzeResume: (resumeId: string) => Promise<void>;
  applySuggestion: (suggestion: Improvement) => Promise<void>;
  applySuggestions: (suggestions: Improvement[]) => Promise<void>;
  
  // Template management
  loadTemplates: () => Promise<void>;
  applyTemplate: (templateId: string) => void;
  
  // Export functions
  exportResume: (format: 'pdf' | 'docx' | 'html' | 'json') => Promise<Blob>;
  importResume: (file: File, type: 'json' | 'linkedin' | 'pdf') => Promise<void>;
  populateFromUpload: (parsedData: any) => Promise<void>;
  
  // UI Actions
  setBuilderState: (state: Partial<UnifiedResumeStore['builderState']>) => void;
  setOptimizerState: (state: Partial<UnifiedResumeStore['optimizerState']>) => void;
  setUIState: (state: Partial<UnifiedResumeStore['uiState']>) => void;
}

export const useUnifiedResumeStore = create<UnifiedResumeStore>()(
  devtools(
    persist(
      immer((set, get) => ({
        // Initial state
        resumes: [],
        currentResumeId: null,
        targetJobs: [],
        analysis: null,
        templates: [],
        autoSaveTimeouts: new Map(),
        
        builderState: {
          isDirty: false,
          autoSaveEnabled: true,
          lastSaved: null,
          activeSection: 'basics',
          previewMode: 'desktop',
          showOptimizationPanel: false,
        },
        
        optimizerState: {
          isAnalyzing: false,
          autoOptimize: true,
          targetJobId: null,
          suggestions: [],
          realTimeAnalysis: true,
        },
        
        uiState: {
          splitView: true,
          activeTab: 'build',
          sidebarCollapsed: false,
        },
        
        // Resume CRUD
        loadResumes: async () => {
          try {
            const response = await fetch('/api/unified-resumes');
            if (response.ok) {
              const result = await response.json();
              const dbResumes = result.data.resumes;
              
              // Transform database format to our store format
              const transformedResumes: UnifiedResume[] = dbResumes.map((dbResume: any) => ({
                id: dbResume.id,
                userId: dbResume.userId,
                version: dbResume.version,
                builder: dbResume.builderData,
                optimization: dbResume.optimizationData || {
                  targetJobs: [],
                  analysis: {
                    lastRun: null,
                    atsScore: 0,
                    keywordMatches: { matched: [], missing: [], partial: [] },
                    improvements: [],
                    issues: [],
                  },
                  embeddings: { resume: [], sections: {} },
                },
                sharing: dbResume.sharingData || {
                  public: false,
                  analytics: { views: 0, downloads: 0, lastViewed: null, shares: [] },
                },
                timestamps: {
                  created: new Date(dbResume.createdAt),
                  modified: new Date(dbResume.updatedAt),
                  analyzed: dbResume.analyzedAt ? new Date(dbResume.analyzedAt) : null,
                },
              }));
              
              set((state) => {
                state.resumes = transformedResumes;
              });
            } else {
              console.warn('Failed to load resumes from database');
            }
          } catch (error) {
            console.warn('Error loading resumes, using local storage:', error);
          }
        },
        
        createResume: async (data) => {
          const newResume: UnifiedResume = {
            id: crypto.randomUUID(),
            userId: 'current-user', // TODO: Get from auth
            version: 1,
            builder: {
              metadata: {
                title: 'Untitled Resume',
                template: 'modern-professional',
                fontSize: 11,
                fontFamily: 'Inter',
                color: {
                  primary: '#2563eb',
                  accent: '#3b82f6',
                  text: '#1f2937',
                  background: '#ffffff',
                },
                layout: 'single',
                spacing: {
                  page: 24,
                  section: 16,
                  paragraph: 8,
                },
              },
              sections: {
                basics: {
                  firstName: '',
                  lastName: '',
                  headline: '',
                  email: '',
                  phone: '',
                  location: {
                    city: '',
                    region: '',
                    country: '',
                  },
                  profiles: [],
                },
                summary: { content: '' },
                experience: [],
                education: [],
                skills: [],
                projects: [],
                certifications: [],
                languages: [],
                custom: [],
              },
              sectionOrder: ['basics', 'summary', 'experience', 'education', 'skills'],
              visibility: {
                basics: true,
                summary: true,
                experience: true,
                education: true,
                skills: true,
                projects: false,
                certifications: false,
                languages: false,
              },
            },
            optimization: {
              targetJobs: [],
              analysis: {
                lastRun: null,
                atsScore: 0,
                keywordMatches: {
                  matched: [],
                  missing: [],
                  partial: [],
                },
                improvements: [],
                issues: [],
              },
              embeddings: {
                resume: [],
                sections: {},
              },
            },
            sharing: {
              public: false,
              analytics: {
                views: 0,
                downloads: 0,
                lastViewed: null,
                shares: [],
              },
            },
            timestamps: {
              created: new Date(),
              modified: new Date(),
              analyzed: null,
            },
            ...data,
          };
          
          try {
            // Try to save to database first
            const response = await fetch('/api/unified-resumes', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                title: newResume.builder.metadata.title,
                template: newResume.builder.metadata.template,
                builderData: newResume.builder,
                optimizationData: newResume.optimization,
                sharingData: newResume.sharing
              })
            });

            if (response.ok) {
              const result = await response.json();
              // Update the newResume with the ID from the database
              newResume.id = result.data.id;
            } else {
              // Fallback: use client-side generated ID and store locally
              console.warn('Database save failed, using local storage fallback');
              newResume.id = crypto.randomUUID();
            }
            
            set((state) => {
              state.resumes.push(newResume);
              state.currentResumeId = newResume.id;
            });
            
            return newResume.id;
          } catch (error) {
            console.warn('Error creating resume, using local storage fallback:', error);
            // Fallback: use client-side generated ID and store locally
            newResume.id = crypto.randomUUID();
            
            set((state) => {
              state.resumes.push(newResume);
              state.currentResumeId = newResume.id;
            });
            
            return newResume.id;
          }
        },
        
        updateResume: async (id, updates) => {
          // Update local state immediately for responsive UI
          set((state) => {
            const index = state.resumes.findIndex(r => r.id === id);
            if (index !== -1) {
              state.resumes[index] = { ...state.resumes[index], ...updates };
              state.resumes[index].timestamps.modified = new Date();
            }
            state.builderState.isDirty = true;
          });
          
          try {
            // Try to make API call to save to database
            const response = await fetch(`/api/unified-resumes/${id}`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                title: updates.builder?.metadata?.title,
                template: updates.builder?.metadata?.template,
                builderData: updates.builder,
                optimizationData: updates.optimization,
                sharingData: updates.sharing
              })
            });

            if (!response.ok) {
              console.warn('Database save failed, but local state updated');
            } else {
              set((state) => {
                state.builderState.isDirty = false;
                state.builderState.lastSaved = new Date();
              });
            }
          } catch (error) {
            console.warn('Error saving resume to database:', error);
          }
        },

        updateResumeDebounced: (id, updates) => {
          // Update local state immediately for responsive UI
          set((state) => {
            const index = state.resumes.findIndex(r => r.id === id);
            if (index !== -1) {
              state.resumes[index] = { ...state.resumes[index], ...updates };
              state.resumes[index].timestamps.modified = new Date();
            }
            state.builderState.isDirty = true;
          });

          // Clear existing timeout for this resume
          const existingTimeout = get().autoSaveTimeouts.get(id);
          if (existingTimeout) {
            clearTimeout(existingTimeout);
          }

          // Set new debounced save
          const timeout = setTimeout(async () => {
            try {
              const currentResume = get().resumes.find(r => r.id === id);
              if (!currentResume) return;

              const response = await fetch(`/api/unified-resumes/${id}`, {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  title: currentResume.builder?.metadata?.title,
                  template: currentResume.builder?.metadata?.template,
                  builderData: currentResume.builder,
                  optimizationData: currentResume.optimization,
                  sharingData: currentResume.sharing
                })
              });

              if (response.ok) {
                set((state) => {
                  state.builderState.isDirty = false;
                  state.builderState.lastSaved = new Date();
                });
                console.log('Auto-saved resume:', id);
              } else {
                console.warn('Auto-save failed for resume:', id);
              }
            } catch (error) {
              console.warn('Auto-save error for resume:', id, error);
            } finally {
              // Remove timeout from map
              set((state) => {
                state.autoSaveTimeouts.delete(id);
              });
            }
          }, 2000); // 2 second delay

          // Store timeout reference
          set((state) => {
            state.autoSaveTimeouts.set(id, timeout);
          });
        },

        saveResumeImmediately: async (id) => {
          try {
            const currentResume = get().resumes.find(r => r.id === id);
            if (!currentResume) return;

            // Clear any pending auto-save
            const existingTimeout = get().autoSaveTimeouts.get(id);
            if (existingTimeout) {
              clearTimeout(existingTimeout);
              get().autoSaveTimeouts.delete(id);
            }

            const response = await fetch(`/api/unified-resumes/${id}`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                title: currentResume.builder?.metadata?.title,
                template: currentResume.builder?.metadata?.template,
                builderData: currentResume.builder,
                optimizationData: currentResume.optimization,
                sharingData: currentResume.sharing
              })
            });

            if (response.ok) {
              set((state) => {
                state.builderState.isDirty = false;
                state.builderState.lastSaved = new Date();
              });
              console.log('Immediately saved resume:', id);
            } else {
              console.warn('Immediate save failed for resume:', id);
            }
          } catch (error) {
            console.warn('Immediate save error for resume:', id, error);
          }
        },
        
        deleteResume: async (id) => {
          try {
            // Delete from database first
            const response = await fetch(`/api/unified-resumes/${id}`, {
              method: 'DELETE',
              headers: {
                'Content-Type': 'application/json',
              }
            });

            if (!response.ok) {
              const errorData = await response.json().catch(() => ({}));
              console.error('Delete API response:', response.status, errorData);
              throw new Error(errorData.error || `Failed to delete resume: ${response.status}`);
            }

            // Update local state after successful deletion
            set((state) => {
              const filteredResumes = state.resumes.filter(r => r.id !== id);
              state.resumes = filteredResumes;
              if (state.currentResumeId === id) {
                state.currentResumeId = filteredResumes.length > 0 ? filteredResumes[0].id : null;
              }
            });
          } catch (error) {
            console.error('Error deleting resume:', error);
            throw error;
          }
        },
        
        duplicateResume: async (id) => {
          const original = get().resumes.find(r => r.id === id);
          if (!original) throw new Error('Resume not found');
          
          const duplicate: UnifiedResume = {
            ...original,
            id: crypto.randomUUID(),
            builder: {
              ...original.builder,
              metadata: {
                ...original.builder.metadata,
                title: `${original.builder.metadata.title} (Copy)`,
              },
            },
            timestamps: {
              created: new Date(),
              modified: new Date(),
              analyzed: null,
            },
          };
          
          set((state) => {
            state.resumes.push(duplicate);
          });
          
          return duplicate.id;
        },
        
        setCurrentResume: (id) => {
          set((state) => {
            state.currentResumeId = id;
          });
        },
        
        updateSection: (section, data) => {
          const currentId = get().currentResumeId;
          if (!currentId) return;
          
          const current = get().resumes.find(r => r.id === currentId);
          if (!current) return;
          
          let updates;
          
          // Handle custom sections differently
          if (section.startsWith('custom_')) {
            const customSections = current.builder.sections.custom || [];
            const updatedCustomSections = customSections.map(cs => 
              cs.id === section ? { ...cs, ...data } : cs
            );
            
            updates = {
              builder: {
                ...current.builder,
                sections: {
                  ...current.builder.sections,
                  custom: updatedCustomSections,
                },
              },
            };
          } else {
            // Handle standard sections
            updates = {
              builder: {
                ...current.builder,
                sections: {
                  ...current.builder.sections,
                  [section]: data,
                },
              },
            };
          }
          
          // Use debounced update for better UX
          get().updateResumeDebounced(currentId, updates);
        },

        addCustomSection: (title: string) => {
          const currentId = get().currentResumeId;
          if (!currentId) return;
          
          const current = get().resumes.find(r => r.id === currentId);
          if (!current) return;
          
          const customSectionId = `custom_${Date.now()}`;
          const newCustomSection = {
            id: customSectionId,
            title: title,
            content: '',
            items: []
          };
          
          const updatedCustomSections = [
            ...(current.builder.sections.custom || []),
            newCustomSection
          ];
          
          const updates = {
            builder: {
              ...current.builder,
              sections: {
                ...current.builder.sections,
                custom: updatedCustomSections,
              },
              sectionOrder: [
                ...current.builder.sectionOrder,
                customSectionId
              ],
              visibility: {
                ...current.builder.visibility,
                [customSectionId]: true
              }
            },
          };
          
          get().updateResumeDebounced(currentId, updates);
          return customSectionId;
        },

        removeCustomSection: (sectionId: string) => {
          const currentId = get().currentResumeId;
          if (!currentId) return;
          
          const current = get().resumes.find(r => r.id === currentId);
          if (!current) return;
          
          const updatedCustomSections = (current.builder.sections.custom || [])
            .filter(section => section.id !== sectionId);
          
          const updatedSectionOrder = current.builder.sectionOrder
            .filter(id => id !== sectionId);
          
          const updatedVisibility = { ...current.builder.visibility };
          delete updatedVisibility[sectionId];
          
          const updates = {
            builder: {
              ...current.builder,
              sections: {
                ...current.builder.sections,
                custom: updatedCustomSections,
              },
              sectionOrder: updatedSectionOrder,
              visibility: updatedVisibility
            },
          };
          
          get().updateResumeDebounced(currentId, updates);
        },
        
        updateMetadata: (metadata) => {
          const currentId = get().currentResumeId;
          if (!currentId) return;
          
          const current = get().resumes.find(r => r.id === currentId);
          if (!current) return;
          
          const updates = {
            builder: {
              ...current.builder,
              metadata: {
                ...current.builder.metadata,
                ...metadata,
              },
            },
          };
          
          get().updateResumeDebounced(currentId, updates);
        },
        
        reorderSections: (sectionOrder) => {
          const currentId = get().currentResumeId;
          if (!currentId) return;
          
          const current = get().resumes.find(r => r.id === currentId);
          if (!current) return;
          
          const updates = {
            builder: {
              ...current.builder,
              sectionOrder,
            },
          };
          
          get().updateResumeDebounced(currentId, updates);
        },
        
        toggleSectionVisibility: (sectionId) => {
          const currentId = get().currentResumeId;
          if (!currentId) return;
          
          const current = get().resumes.find(r => r.id === currentId);
          if (!current) return;
          
          const updates = {
            builder: {
              ...current.builder,
              visibility: {
                ...current.builder.visibility,
                [sectionId]: !current.builder.visibility[sectionId],
              },
            },
          };
          
          get().updateResumeDebounced(currentId, updates);
        },
        
        // Job targeting
        addTargetJob: (job) => {
          set((state) => {
            state.targetJobs.push(job);
          });
          
          // Auto-analyze if current resume exists
          const currentId = get().currentResumeId;
          if (currentId && get().optimizerState.autoOptimize) {
            get().optimizeForJob(currentId, job.id);
          }
        },
        
        removeTargetJob: (jobId) => {
          set((state) => {
            state.targetJobs = state.targetJobs.filter(job => job.id !== jobId);
          });
        },
        
        optimizeForJob: async (resumeId, jobId) => {
          set((state) => {
            state.optimizerState.isAnalyzing = true;
            state.optimizerState.targetJobId = jobId;
          });
          
          // Simulate optimization process
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          const mockResult: OptimizationResult = {
            resume: get().resumes.find(r => r.id === resumeId)!,
            targetJob: get().targetJobs.find(j => j.id === jobId)!,
            analysis: {
              matched: [{ keyword: 'JavaScript', importance: 8, variations: ['JS', 'ECMAScript'], foundIn: ['experience'] }],
              missing: [{ keyword: 'React', importance: 9, variations: ['ReactJS'], foundIn: [] }],
              partial: [],
            },
            matchScore: 75,
            newScore: 85,
            improvement: 10,
            keywordsAdded: 3,
            resumeUrl: `/resume/${resumeId}`,
            resumeId,
          };
          
          set((state) => {
            state.analysis = mockResult.analysis;
            state.optimizerState.suggestions = [
              {
                type: 'add',
                priority: 'high',
                section: 'experience',
                title: 'Add React keyword',
                description: 'Include React in your experience descriptions',
                impact: 5,
              },
            ];
            state.optimizerState.isAnalyzing = false;
          });
          
          return mockResult;
        },
        
        analyzeResume: async (resumeId) => {
          set((state) => {
            state.optimizerState.isAnalyzing = true;
          });
          
          // Simulate analysis
          await new Promise(resolve => setTimeout(resolve, 1500));
          
          set((state) => {
            state.optimizerState.isAnalyzing = false;
          });
        },
        
        applySuggestion: async (suggestion) => {
          // Apply the suggestion to the current resume
          console.log('Applying suggestion:', suggestion);
          
          set((state) => {
            state.optimizerState.suggestions = state.optimizerState.suggestions
              .filter(s => s.title !== suggestion.title);
          });
        },
        
        applySuggestions: async (suggestions) => {
          for (const suggestion of suggestions) {
            await get().applySuggestion(suggestion);
          }
        },
        
        // Template management
        loadTemplates: async () => {
          // Load templates from API or static data
          const mockTemplates: Template[] = [
            {
              id: 'modern-professional',
              name: 'Modern Professional',
              category: 'professional',
              preview: '/templates/modern-professional-preview.png',
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
                typography: {
                  headingFont: 'Inter',
                  bodyFont: 'Inter',
                  fontSize: {
                    name: '2rem',
                    heading: '1.25rem',
                    subheading: '1rem',
                    body: '0.875rem',
                  },
                },
              },
            },
          ];
          
          set((state) => {
            state.templates = mockTemplates;
          });
        },
        
        applyTemplate: (templateId) => {
          const template = get().templates.find(t => t.id === templateId);
          if (!template) return;
          
          get().updateMetadata({
            template: templateId,
            color: template.structure.colorScheme,
            fontFamily: template.structure.typography.headingFont,
          });
        },
        
        // Export functions
        exportResume: async (format) => {
          const currentId = get().currentResumeId;
          if (!currentId) {
            throw new Error('No resume selected for export');
          }

          try {
            const response = await fetch(`/api/unified-resumes/${currentId}/export`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                format,
                includeAnalysis: false
              })
            });

            if (!response.ok) {
              const errorData = await response.json().catch(() => ({}));
              throw new Error(errorData.error || `Export failed: ${response.status}`);
            }

            return await response.blob();
          } catch (error) {
            console.error('Export error:', error);
            throw error;
          }
        },
        
        importResume: async (file, type) => {
          // TODO: Implement import functionality
          console.log('Importing:', file, type);
        },

        populateFromUpload: async (parsedData) => {
          const currentResumeId = get().currentResumeId;
          if (!currentResumeId) return;

          set((state) => {
            const resumeIndex = state.resumes.findIndex(r => r.id === currentResumeId);
            if (resumeIndex === -1) return;

            const resume = state.resumes[resumeIndex];
            
            // Map parsed data to builder sections (enhanced format support)
            if (parsedData.parsedSections) {
              const sections = parsedData.parsedSections;
              
              // Update basics/contact info
              if (sections.contact) {
                const contact = sections.contact;
                const nameParts = contact.name?.split(' ') || [];
                resume.builder.sections.basics = {
                  ...resume.builder.sections.basics,
                  firstName: nameParts[0] || '',
                  lastName: nameParts.slice(1).join(' ') || '',
                  email: contact.email || '',
                  phone: contact.phone || '',
                  location: {
                    city: contact.location?.split(',')[0]?.trim() || '',
                    region: contact.location?.split(',')[1]?.trim() || ''
                  },
                  website: contact.website || contact.linkedIn || contact.github || '',
                  headline: contact.headline || ''
                };
              }
              
              // Update summary
              if (sections.summary) {
                resume.builder.sections.summary = {
                  content: sections.summary
                };
              }
              
              // Update experience (enhanced format)
              if (sections.experience && Array.isArray(sections.experience) && sections.experience.length > 0) {
                resume.builder.sections.experience = sections.experience.map((exp: any) => ({
                  id: exp.id || crypto.randomUUID(),
                  company: exp.company || 'Company',
                  position: exp.position || 'Position',
                  startDate: exp.startDate || '',
                  endDate: exp.current ? '' : (exp.endDate || ''),
                  current: exp.current || false,
                  location: exp.location || '',
                  summary: exp.summary || exp.description || '',
                  highlights: Array.isArray(exp.highlights) 
                    ? exp.highlights.filter(h => h.trim()) 
                    : Array.isArray(exp.achievements) 
                      ? exp.achievements.filter(h => h.trim()) 
                      : [],
                  keywords: Array.isArray(exp.keywords) ? exp.keywords : []
                }));
              }
              
              // Update education (enhanced format)
              if (sections.education && Array.isArray(sections.education)) {
                resume.builder.sections.education = sections.education.map((edu: any) => ({
                  institution: edu.institution || '',
                  degree: edu.degree || '',
                  field: edu.field || '',
                  from: edu.from || (edu.duration?.split(' - ')[0]) || '',
                  to: edu.to || (edu.duration?.split(' - ')[1]) || '',
                  gpa: edu.gpa || '',
                  location: edu.location || ''
                }));
              }
              
              // Update skills (enhanced format with groups)
              if (sections.skills && Array.isArray(sections.skills)) {
                if (sections.skills.length > 0 && typeof sections.skills[0] === 'object' && sections.skills[0].name) {
                  // Enhanced format with skill groups
                  resume.builder.sections.skills = sections.skills.map((group: any) => ({
                    name: group.name || 'Skills',
                    items: Array.isArray(group.items) ? group.items.map((item: any) => ({
                      name: typeof item === 'string' ? item : item.name || '',
                      level: typeof item === 'object' ? item.level : undefined
                    })) : []
                  }));
                } else {
                  // Legacy format with simple skill strings
                  resume.builder.sections.skills = [{
                    name: 'Technical Skills',
                    items: sections.skills.map((skill: string) => ({ name: skill }))
                  }];
                }
              }
              
              // Update projects (if enhanced format includes them)
              if (sections.projects && Array.isArray(sections.projects)) {
                resume.builder.sections.projects = sections.projects.map((project: any) => ({
                  id: crypto.randomUUID(),
                  name: project.name || '',
                  description: project.description || '',
                  technologies: Array.isArray(project.technologies) ? project.technologies : [],
                  url: project.url || '',
                  highlights: Array.isArray(project.highlights) ? project.highlights : []
                }));
              }
              
              // Update certifications (if enhanced format includes them)
              if (sections.certifications && Array.isArray(sections.certifications)) {
                resume.builder.sections.certifications = sections.certifications.map((cert: any) => ({
                  id: crypto.randomUUID(),
                  name: cert.name || '',
                  issuer: cert.issuer || '',
                  date: cert.date || '',
                  expiryDate: cert.expiryDate || '',
                  credentialId: cert.credentialId || ''
                }));
              }
            }
            
            // Update metadata if available
            if (parsedData.metadata) {
              resume.builder.metadata.lastModified = new Date();
              resume.builder.metadata.confidence = parsedData.metadata.confidence || 75;
            }
            
            // Mark as dirty so auto-save triggers
            state.builderState.isDirty = true;
          });
        },
        
        // UI Actions
        setBuilderState: (state) => {
          set((currentState) => {
            currentState.builderState = { ...currentState.builderState, ...state };
          });
        },
        
        setOptimizerState: (state) => {
          set((currentState) => {
            currentState.optimizerState = { ...currentState.optimizerState, ...state };
          });
        },
        
        setUIState: (state) => {
          set((currentState) => {
            currentState.uiState = { ...currentState.uiState, ...state };
          });
        },
      })),
      {
        name: 'reslo-unified-storage',
        partialize: (state) => ({
          resumes: state.resumes,
          currentResumeId: state.currentResumeId,
          targetJobs: state.targetJobs,
          templates: state.templates,
          // Don't persist autoSaveTimeouts - they should be recreated on load
          builderState: {
            autoSaveEnabled: state.builderState.autoSaveEnabled,
            activeSection: state.builderState.activeSection,
            previewMode: state.builderState.previewMode,
          },
          optimizerState: {
            autoOptimize: state.optimizerState.autoOptimize,
            realTimeAnalysis: state.optimizerState.realTimeAnalysis,
          },
          uiState: state.uiState,
        }),
      }
    )
  )
);

// Convenience hooks for specific parts of the state
export const useCurrentResume = () => {
  const { resumes, currentResumeId } = useUnifiedResumeStore();
  return resumes.find(r => r.id === currentResumeId) || null;
};

export const useBuilderState = () => useUnifiedResumeStore(state => state.builderState);
export const useOptimizerState = () => useUnifiedResumeStore(state => state.optimizerState);
export const useUIState = () => useUnifiedResumeStore(state => state.uiState);