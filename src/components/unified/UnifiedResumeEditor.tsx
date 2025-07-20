'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { 
  Download, 
  Share2, 
  Eye, 
  Settings, 
  Zap, 
  FileText,
  BarChart3,
  Maximize2,
  Minimize2,
  Sparkles,
  Save,
  XCircle,
  ChevronDown,
  Edit2,
  Check,
  X
} from 'lucide-react';

import { useUnifiedResumeStore, useCurrentResume, useBuilderState, useOptimizerState, useUIState } from '@/lib/stores/unifiedResumeStore';
import { ResumeBuilder } from './ResumeBuilder';
import { ATSOptimizer } from './ATSOptimizer';
import { LivePreview } from './LivePreview';
import { InlineTemplateGallery } from './InlineTemplateGallery';
import { UnifiedSidebar } from './UnifiedSidebar';

interface UnifiedResumeEditorProps {
  resumeId?: string;
}

export const UnifiedResumeEditor: React.FC<UnifiedResumeEditorProps> = ({ resumeId }) => {
  const currentResume = useCurrentResume();
  const builderState = useBuilderState();
  const optimizerState = useOptimizerState();
  const uiState = useUIState();
  
  const {
    setCurrentResume,
    updateMetadata,
    setUIState,
    setBuilderState,
    analysis,
    exportResume,
    loadTemplates,
    templates
  } = useUnifiedResumeStore();

  const [autoSaveTimer, setAutoSaveTimer] = useState<NodeJS.Timeout | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editingTitle, setEditingTitle] = useState('');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Initialize resume and templates
  useEffect(() => {
    if (resumeId) {
      setCurrentResume(resumeId);
    }
    loadTemplates();
  }, [resumeId, setCurrentResume, loadTemplates]);

  // Check for mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Auto-save functionality
  const triggerAutoSave = useCallback(() => {
    if (!builderState.autoSaveEnabled || !currentResume) return;

    if (autoSaveTimer) {
      clearTimeout(autoSaveTimer);
    }

    const timer = setTimeout(() => {
      // Auto-save logic would go here
      setBuilderState({ lastSaved: new Date() });
    }, 2000);

    setAutoSaveTimer(timer);
  }, [builderState.autoSaveEnabled, currentResume, autoSaveTimer, setBuilderState]);

  // Trigger auto-save when resume data changes
  useEffect(() => {
    if (builderState.isDirty) {
      triggerAutoSave();
    }
  }, [builderState.isDirty, triggerAutoSave]);

  // Handle export
  const handleExport = async (format: 'pdf' | 'docx' | 'html' | 'json') => {
    if (!currentResume) return;
    
    try {
      const blob = await exportResume(format);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${currentResume.builder.metadata.title}.${format}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const toggleSplitView = () => {
    setUIState({ splitView: !uiState.splitView });
  };

  const toggleOptimizationPanel = () => {
    setBuilderState({ showOptimizationPanel: !builderState.showOptimizationPanel });
  };

  const handleTitleEdit = () => {
    if (!currentResume) return;
    setEditingTitle(currentResume.builder.metadata.title);
    setIsEditingTitle(true);
  };

  const handleTitleSave = () => {
    if (!currentResume || !editingTitle.trim()) {
      setIsEditingTitle(false);
      return;
    }
    
    updateMetadata({ title: editingTitle.trim() });
    setIsEditingTitle(false);
  };

  const handleTitleCancel = () => {
    setIsEditingTitle(false);
    setEditingTitle('');
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleTitleSave();
    } else if (e.key === 'Escape') {
      handleTitleCancel();
    }
  };

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  if (!currentResume) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="pt-6 text-center">
            <FileText className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h2 className="text-xl font-semibold mb-2">No Resume Selected</h2>
            <p className="text-gray-600 mb-4">
              Create a new resume or select an existing one to begin editing.
            </p>
            <Button onClick={() => window.location.href = '/dashboard'}>
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const atsScore = currentResume.optimization.analysis.atsScore;
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-reslo-blue bg-gradient-to-r from-reslo-blue/10 to-reslo-turquoise/10 border-reslo-blue/20';
    if (score >= 60) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  return (
    <div className="h-screen flex bg-gray-50">
      {/* Sidebar */}
      <UnifiedSidebar isCollapsed={sidebarCollapsed} onToggle={toggleSidebar} />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-gradient-to-r from-white via-white to-reslo-blue/5 border-b border-reslo-blue/10 px-3 md:px-6 py-3 md:py-4 flex-shrink-0">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2 md:gap-4 min-w-0 flex-1">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                {isEditingTitle ? (
                  <div className="flex items-center gap-2 flex-1">
                    <Input
                      value={editingTitle}
                      onChange={(e) => setEditingTitle(e.target.value)}
                      onKeyDown={handleTitleKeyDown}
                      onBlur={handleTitleSave}
                      className="text-lg md:text-2xl font-bold h-8 md:h-10"
                      autoFocus
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleTitleSave}
                      className="text-green-600 hover:text-green-700 p-1"
                    >
                      <Check className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleTitleCancel}
                      className="text-red-600 hover:text-red-700 p-1"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 flex-1 group">
                    <h1 className="text-lg md:text-2xl font-bold text-gray-900 truncate">
                      {currentResume.builder.metadata.title}
                    </h1>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleTitleEdit}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs md:text-sm text-gray-500 hidden sm:inline">
                  Template: {templates?.find(t => t.id === currentResume.builder.metadata.template)?.name || 'Unknown'}
                </span>
                {builderState.isDirty && (
                  <Badge variant="outline" className="text-xs">
                    <Save className="w-3 h-3 mr-1" />
                    <span className="hidden sm:inline">Saving...</span>
                  </Badge>
                )}
                {builderState.lastSaved && (
                  <span className="text-xs text-gray-400 hidden md:inline">
                    Saved {new Date(builderState.lastSaved).toLocaleTimeString()}
                  </span>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-1 md:gap-3">
            {/* ATS Score Badge */}
            <div className={`px-2 md:px-3 py-1 md:py-2 rounded-lg border ${getScoreColor(atsScore)}`}>
              <div className="flex items-center gap-1 md:gap-2">
                <Zap className="w-3 h-3 md:w-4 md:h-4" />
                <span className="font-semibold text-xs md:text-sm">
                  <span className="hidden sm:inline">ATS: </span>{atsScore}%
                </span>
              </div>
            </div>
            
            {/* View Controls - Desktop Only */}
            <div className="hidden lg:flex items-center gap-1 border rounded-lg p-1">
              <Button
                size="sm"
                variant={uiState.splitView ? "default" : "ghost"}
                onClick={toggleSplitView}
              >
                {uiState.splitView ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                {uiState.splitView ? 'Focus' : 'Split'}
              </Button>
              <Button
                size="sm"
                variant={builderState.showOptimizationPanel ? "default" : "ghost"}
                onClick={toggleOptimizationPanel}
              >
                <Sparkles className="w-4 h-4" />
                <span className="hidden xl:inline ml-1">Optimize</span>
              </Button>
            </div>
            
            {/* Mobile Optimization Toggle */}
            <Button
              size="sm"
              variant={builderState.showOptimizationPanel ? "default" : "ghost"}
              onClick={toggleOptimizationPanel}
              className="lg:hidden"
            >
              <Sparkles className="w-4 h-4" />
            </Button>
            
            {/* Export Menu */}
            <div className="flex items-center gap-1">
              <Button size="sm" variant="outline" onClick={() => handleExport('pdf')}>
                <Download className="w-3 h-3 md:w-4 md:h-4 md:mr-2" />
                <span className="hidden sm:inline">PDF</span>
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" variant="outline" className="hidden sm:flex">
                    <Download className="w-4 h-4 mr-2" />
                    Export
                    <ChevronDown className="w-3 h-3 ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleExport('pdf')}>
                    <Download className="w-4 h-4 mr-2" />
                    Download as PDF
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExport('docx')}>
                    <Download className="w-4 h-4 mr-2" />
                    Download as DOCX
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExport('html')}>
                    <Download className="w-4 h-4 mr-2" />
                    Download as HTML
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExport('json')}>
                    <Download className="w-4 h-4 mr-2" />
                    Export Data (JSON)
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>
      
      <div className="flex-1 flex min-h-0">
        {/* Left Panel - Main Content */}
        <div className={`${uiState.splitView && !isMobile ? 'lg:w-1/2' : 'w-full'} flex flex-col bg-white min-h-0 ${uiState.splitView && !isMobile ? 'border-r' : ''}`}>
          <Tabs 
            value={uiState.activeTab} 
            onValueChange={(value) => setUIState({ activeTab: value as any })}
            className="flex-1 flex flex-col min-h-0"
          >
            <TabsList className="w-full border-b rounded-none h-10 md:h-12 bg-gray-50">
              <TabsTrigger value="build" className="flex-1 data-[state=active]:bg-white text-xs md:text-sm">
                <FileText className="w-3 h-3 md:w-4 md:h-4 md:mr-2" />
                <span className="hidden sm:inline md:ml-1">Build</span>
                {optimizerState.suggestions?.length > 0 && (
                  <Badge variant="secondary" className="ml-1 md:ml-2 text-xs">
                    {optimizerState.suggestions?.length || 0}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="optimize" className="flex-1 data-[state=active]:bg-white text-xs md:text-sm">
                <Zap className="w-3 h-3 md:w-4 md:h-4 md:mr-2" />
                <span className="hidden sm:inline md:ml-1">Score & Optimize</span>
                <div className="flex items-center gap-1 ml-1 md:ml-2">
                  <Badge 
                    variant={atsScore >= 80 ? "default" : atsScore >= 60 ? "secondary" : "destructive"} 
                    className="text-xs"
                  >
                    {atsScore}%
                  </Badge>
                  {optimizerState.suggestions?.length > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {optimizerState.suggestions?.length}
                    </Badge>
                  )}
                </div>
              </TabsTrigger>
              <TabsTrigger value="templates" className="flex-1 data-[state=active]:bg-white text-xs md:text-sm">
                <Settings className="w-3 h-3 md:w-4 md:h-4 md:mr-2" />
                <span className="hidden sm:inline md:ml-1">Templates</span>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="build" className="flex-1 m-0 p-0 overflow-hidden">
              <div className="h-full flex">
                <div className="flex-1 overflow-y-auto min-h-0">
                  <ResumeBuilder resume={currentResume} />
                </div>
                
                {/* Optimization Panel (Sidebar) - Desktop */}
                {builderState.showOptimizationPanel && (
                  <div className="hidden lg:block w-80 border-l bg-gray-50 overflow-y-auto">
                    <div className="p-4">
                      <h3 className="font-semibold mb-4 flex items-center gap-2">
                        <Sparkles className="w-4 h-4" />
                        AI Suggestions
                      </h3>
                      <ATSOptimizer 
                        resume={currentResume} 
                        compact={true}
                        showAnalysis={false}
                      />
                    </div>
                  </div>
                )}
                
                {/* Mobile Optimization Panel (Full Screen Overlay) */}
                {builderState.showOptimizationPanel && (
                  <div className="lg:hidden fixed inset-0 z-50 bg-white">
                    <div className="flex flex-col h-full">
                      <div className="flex items-center justify-between p-4 border-b">
                        <h3 className="font-semibold flex items-center gap-2">
                          <Sparkles className="w-4 h-4" />
                          AI Optimization
                        </h3>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={toggleOptimizationPanel}
                        >
                          <XCircle className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="flex-1 overflow-y-auto p-4">
                        <ATSOptimizer 
                          resume={currentResume} 
                          compact={false}
                          showAnalysis={true}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="optimize" className="flex-1 overflow-y-auto m-0 p-0">
              <ATSOptimizer 
                resume={currentResume} 
                compact={false}
                showAnalysis={true}
              />
            </TabsContent>
            
            <TabsContent value="templates" className="flex-1 overflow-y-auto m-0 p-0">
              <div className="p-6">
                <InlineTemplateGallery />
              </div>
            </TabsContent>
          </Tabs>
        </div>
        
        {/* Right Panel - Live Preview (Desktop Only) */}
        {uiState.splitView && (
          <div className="hidden lg:flex lg:w-1/2 bg-gray-100 flex-col">
            <div className="bg-white border-b px-4 py-3 flex justify-between items-center">
              <h3 className="font-semibold text-gray-900">Live Preview</h3>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant={builderState.previewMode === 'desktop' ? 'default' : 'ghost'}
                  onClick={() => setBuilderState({ previewMode: 'desktop' })}
                >
                  Desktop
                </Button>
                <Button
                  size="sm"
                  variant={builderState.previewMode === 'mobile' ? 'default' : 'ghost'}
                  onClick={() => setBuilderState({ previewMode: 'mobile' })}
                >
                  Mobile
                </Button>
              </div>
            </div>
            
            <div className="flex-1 overflow-auto p-4">
              <LivePreview 
                resume={currentResume}
                scale={builderState.previewMode === 'mobile' ? 0.6 : 1}
                highlights={analysis?.matched}
                showATSScore={uiState.activeTab === 'optimize'}
              />
            </div>
          </div>
        )}
        
      </div>
      </div>
    </div>
  );
};