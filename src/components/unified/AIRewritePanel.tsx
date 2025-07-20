'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { 
  Sparkles, 
  Check, 
  X, 
  RotateCcw, 
  Loader2,
  Wand2,
  RefreshCw,
  AlertCircle
} from 'lucide-react';

import { UnifiedResume } from '@/types/resume';

interface AIRewritePanelProps {
  sectionType: string;
  currentContent: string;
  resume: UnifiedResume;
  onApply: (newContent: string) => void;
  onCancel: () => void;
}

interface RewriteHistory {
  original: string;
  suggestions: string[];
  applied?: string;
}

export const AIRewritePanel: React.FC<AIRewritePanelProps> = ({
  sectionType,
  currentContent,
  resume,
  onApply,
  onCancel
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [selectedSuggestion, setSelectedSuggestion] = useState<string | null>(null);
  const [history, setHistory] = useState<RewriteHistory>({
    original: currentContent,
    suggestions: []
  });
  const [error, setError] = useState<string | null>(null);

  const generateRewrite = async (style: 'professional' | 'impact' | 'concise' = 'professional') => {
    setIsGenerating(true);
    setError(null);
    
    try {
      // Generate context from other resume sections for better AI suggestions
      const context = generateResumeContext(resume);
      
      const response = await fetch('/api/ai-rewrite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sectionType,
          currentContent,
          style,
          context,
          targetField: sectionType === 'experience' ? 'summary' : sectionType
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate rewrite suggestions');
      }

      const result = await response.json();
      
      if (result.success && result.suggestions) {
        setSuggestions(result.suggestions);
        setHistory(prev => ({
          ...prev,
          suggestions: result.suggestions
        }));
      } else {
        throw new Error(result.error || 'No suggestions generated');
      }
    } catch (err) {
      console.error('AI rewrite error:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate suggestions');
      
      // Fallback suggestions for demo purposes
      setSuggestions([
        getExampleRewrite(sectionType, currentContent, style)
      ]);
    } finally {
      setIsGenerating(false);
    }
  };

  const generateResumeContext = (resume: UnifiedResume): string => {
    const sections = resume.builder.sections;
    let context = '';
    
    // Include relevant context from other sections
    if (sections.basics) {
      context += `Name: ${sections.basics.firstName || ''} ${sections.basics.lastName || ''}\n`;
      if (sections.basics.headline) {
        context += `Title: ${sections.basics.headline}\n`;
      }
      if (sections.basics.email) {
        context += `Industry: ${inferIndustryFromEmail(sections.basics.email)}\n`;
      }
    }
    
    if (sections.experience && sections.experience.length > 0) {
      context += 'Recent Experience:\n';
      sections.experience.slice(0, 3).forEach((exp: any) => {
        const duration = calculateDuration(exp.startDate, exp.endDate, exp.current);
        context += `- ${exp.position} at ${exp.company} (${duration})\n`;
        if (exp.summary) {
          context += `  Summary: ${exp.summary.slice(0, 100)}...\n`;
        }
      });
    }
    
    if (sections.skills && sections.skills.length > 0) {
      const skillsList = sections.skills.flatMap((group: any) => 
        group.items ? group.items.map((item: any) => item.name) : 
        group.keywords || []
      ).filter(Boolean).slice(0, 15);
      context += `Skills: ${skillsList.join(', ')}\n`;
    }
    
    if (sections.education && sections.education.length > 0) {
      context += 'Education:\n';
      sections.education.slice(0, 2).forEach((edu: any) => {
        context += `- ${edu.degree} in ${edu.field || edu.area} from ${edu.institution}\n`;
      });
    }
    
    if (sections.summary) {
      context += `Professional Summary: ${sections.summary.content || sections.summary}\n`;
    }
    
    return context;
  };

  // Helper function to infer industry from email domain
  const inferIndustryFromEmail = (email: string): string => {
    const domain = email.split('@')[1]?.toLowerCase() || '';
    
    if (domain.includes('tech') || domain.includes('google') || domain.includes('microsoft')) return 'Technology';
    if (domain.includes('bank') || domain.includes('finance') || domain.includes('capital')) return 'Finance';
    if (domain.includes('health') || domain.includes('medical') || domain.includes('pharma')) return 'Healthcare';
    if (domain.includes('edu') || domain.includes('university')) return 'Education';
    
    return 'General Business';
  };

  // Helper function to calculate experience duration
  const calculateDuration = (startDate: string, endDate: string, current: boolean): string => {
    if (!startDate) return 'Duration unknown';
    
    const start = new Date(startDate + '-01');
    const end = current ? new Date() : new Date((endDate || startDate) + '-01');
    
    const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
    
    if (months < 12) {
      return `${months} month${months !== 1 ? 's' : ''}`;
    } else {
      const years = Math.floor(months / 12);
      const remainingMonths = months % 12;
      return `${years} year${years !== 1 ? 's' : ''}${remainingMonths > 0 ? `, ${remainingMonths} month${remainingMonths !== 1 ? 's' : ''}` : ''}`;
    }
  };

  const getExampleRewrite = (sectionType: string, _content: string, style: string): string => {
    // Fallback example rewrites for demo
    const examples = {
      summary: {
        professional: "Experienced professional with a proven track record of delivering results and driving organizational success through strategic thinking and collaborative leadership.",
        impact: "Results-driven leader who increased team productivity by 40% and reduced operational costs by $2M through innovative process improvements.",
        concise: "Strategic professional with 5+ years experience driving growth and operational excellence."
      },
      experience: {
        professional: "Led cross-functional initiatives to enhance operational efficiency and drive measurable business outcomes through data-driven decision making.",
        impact: "Spearheaded initiatives that resulted in 25% efficiency gains and $500K in cost savings within first quarter.",
        concise: "Managed team of 8, improved processes, achieved 25% efficiency increase."
      }
    };
    
    return examples[sectionType as keyof typeof examples]?.[style as keyof typeof examples.summary] || 
           "Enhanced professional content with improved clarity and impact.";
  };

  const handleApply = () => {
    if (selectedSuggestion) {
      setHistory(prev => ({
        ...prev,
        applied: selectedSuggestion
      }));
      onApply(selectedSuggestion);
    }
  };

  const handleUndo = () => {
    onApply(history.original);
    setSelectedSuggestion(null);
    setSuggestions([]);
  };

  const handleRegenerate = () => {
    setSuggestions([]);
    setSelectedSuggestion(null);
    generateRewrite();
  };

  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wand2 className="w-5 h-5 text-blue-600" />
            <span>AI Rewrite Assistant</span>
          </div>
          <Button size="sm" variant="ghost" onClick={onCancel}>
            <X className="w-4 h-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Original Content */}
        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">
            Original Content
          </label>
          <div className="p-3 bg-gray-50 rounded-md text-sm text-gray-700 border">
            {currentContent || 'No content to rewrite'}
          </div>
        </div>

        {/* Generation Controls */}
        {suggestions.length === 0 && (
          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-700">
              Choose rewrite style:
            </label>
            <div className="flex gap-2">
              <Button 
                size="sm" 
                onClick={() => generateRewrite('professional')}
                disabled={isGenerating || !currentContent.trim()}
              >
                {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                Professional
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => generateRewrite('impact')}
                disabled={isGenerating || !currentContent.trim()}
              >
                Impact-Focused
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => generateRewrite('concise')}
                disabled={isGenerating || !currentContent.trim()}
              >
                Concise
              </Button>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="w-4 h-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* AI Suggestions */}
        {suggestions.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">
                AI Suggestions
              </label>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={handleRegenerate}
                disabled={isGenerating}
              >
                <RefreshCw className="w-4 h-4 mr-1" />
                New Suggestions
              </Button>
            </div>
            
            <div className="space-y-2">
              {suggestions.map((suggestion, index) => (
                <div
                  key={index}
                  className={`p-3 border rounded-md cursor-pointer transition-all ${
                    selectedSuggestion === suggestion
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 bg-white hover:border-blue-300'
                  }`}
                  onClick={() => setSelectedSuggestion(suggestion)}
                >
                  <div className="flex items-start justify-between">
                    <Textarea
                      value={suggestion}
                      onChange={(e) => {
                        const updatedSuggestions = [...suggestions];
                        updatedSuggestions[index] = e.target.value;
                        setSuggestions(updatedSuggestions);
                        if (selectedSuggestion === suggestion) {
                          setSelectedSuggestion(e.target.value);
                        }
                      }}
                      className="border-none p-0 resize-none focus:ring-0 bg-transparent text-sm"
                      rows={Math.max(2, suggestion.split('\n').length)}
                    />
                    <div className="flex items-center gap-1 ml-2">
                      {selectedSuggestion === suggestion && (
                        <Badge variant="secondary" className="text-xs">
                          Selected
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {suggestions.length > 0 && (
          <div className="flex gap-2 pt-2 border-t">
            <Button
              onClick={handleApply}
              disabled={!selectedSuggestion}
              className="flex-1"
            >
              <Check className="w-4 h-4 mr-2" />
              Apply Selected
            </Button>
            
            {history.applied && (
              <Button
                variant="outline"
                onClick={handleUndo}
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Undo
              </Button>
            )}
            
            <Button
              variant="ghost"
              onClick={onCancel}
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
          </div>
        )}

        {/* Getting Started Help */}
        {!currentContent.trim() && (
          <Alert>
            <AlertCircle className="w-4 h-4" />
            <AlertDescription>
              Add some content to this section first, then click AI Rewrite to get suggestions.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};