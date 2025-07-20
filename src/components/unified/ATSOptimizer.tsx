'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  Zap, 
  AlertCircle, 
  CheckCircle, 
  XCircle,
  Target,
  TrendingUp,
  Lightbulb,
  FileText,
  Upload,
  BarChart3
} from 'lucide-react';

import { UnifiedResume } from '@/types/resume';
import { useUnifiedResumeStore } from '@/lib/stores/unifiedResumeStore';
import { AnalyzerService } from '@/lib/services/analyzer.service';
import { ParserService } from '@/lib/services/parser.service';
import KeywordHighlighter from '@/components/advanced/KeywordHighlighter';
import ScoreVisualization from '@/components/advanced/ScoreVisualization';

interface ATSOptimizerProps {
  resume: UnifiedResume;
  compact?: boolean;
  showAnalysis?: boolean;
  scoreMode?: boolean;
}

export const ATSOptimizer: React.FC<ATSOptimizerProps> = ({
  resume,
  compact = false,
  showAnalysis = true,
  scoreMode = false
}) => {
  const [jobDescription, setJobDescription] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [advancedAnalysis, setAdvancedAnalysis] = useState<any>(null);
  const [activeView, setActiveView] = useState<'overview' | 'keywords' | 'scores' | 'recommendations'>('overview');
  
  const {
    optimizerState,
    analysis,
    optimizeForJob,
    applySuggestion,
    addTargetJob
  } = useUnifiedResumeStore();

  const handleAdvancedAnalyze = async () => {
    if (!jobDescription.trim()) return;
    
    setAnalyzing(true);
    
    try {
      // Use Resume-Matcher style advanced scoring
      const response = await fetch('/api/advanced-scoring', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resumeData: resume,
          jobDescription: jobDescription.trim()
        })
      });

      if (!response.ok) {
        throw new Error('Advanced scoring failed');
      }

      const result = await response.json();
      setAdvancedAnalysis(result.data);

      // Create target job for legacy compatibility  
      const targetJob = {
        id: crypto.randomUUID(),
        title: result.data.jobAnalysis.title || 'Target Position',
        company: 'Target Company', 
        description: jobDescription,
        keywords: {
          hard_skills: result.data.jobAnalysis.skills || [],
          soft_skills: [],
          qualifications: [],
          industry_terms: []
        },
        embedding: []
      };
      
      addTargetJob(targetJob);
      await optimizeForJob(resume.id, targetJob.id);
    } catch (error) {
      console.error('Advanced scoring failed:', error);
    } finally {
      setAnalyzing(false);
    }
  };

  // Helper to generate plain text from resume
  const generateResumeText = (resume: UnifiedResume): string => {
    const sections = resume.builder.sections;
    let text = '';
    
    // Contact info
    if (sections.basics) {
      text += `${sections.basics.firstName} ${sections.basics.lastName}\n${sections.basics.email}\n${sections.basics.phone}\n\n`;
    }
    
    // Summary
    if (sections.summary) {
      text += `SUMMARY\n${sections.summary.content}\n\n`;
    }
    
    // Experience
    if (sections.experience && sections.experience.length > 0) {
      text += 'EXPERIENCE\n';
      sections.experience.forEach(exp => {
        text += `${exp.position} at ${exp.company} (${exp.startDate} - ${exp.endDate})\n`;
        text += `${exp.summary}\n`;
        if (exp.highlights) {
          exp.highlights.forEach(highlight => {
            text += `• ${highlight}\n`;
          });
        }
        text += '\n';
      });
    }
    
    // Education
    if (sections.education && sections.education.length > 0) {
      text += 'EDUCATION\n';
      sections.education.forEach(edu => {
        text += `${edu.degree} in ${edu.field} from ${edu.institution} (${edu.startDate} - ${edu.endDate})\n`;
      });
      text += '\n';
    }
    
    // Skills
    if (sections.skills && sections.skills.length > 0) {
      text += 'SKILLS\n';
      sections.skills.forEach(skillGroup => {
        text += `${skillGroup.name}: ${skillGroup.skills.join(', ')}\n`;
      });
      text += '\n';
    }
    
    return text;
  };

  const atsScore = resume.optimization.analysis.atsScore;
  
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  // Compact view for dashboard/sidebar
  if (compact) {
    return (
      <div className="space-y-4">
        {/* Quick ATS Score */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">ATS Score</span>
              <span className={`text-lg font-bold ${getScoreColor(atsScore)}`}>
                {atsScore}%
              </span>
            </div>
            <Progress value={atsScore} className="h-2" />
          </CardContent>
        </Card>

        {/* Quick Suggestions */}
        {optimizerState.suggestions.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Quick Fixes</h4>
            {optimizerState.suggestions.slice(0, 3).map((suggestion, index) => (
              <Alert key={index} className="py-2">
                <Lightbulb className="w-4 h-4" />
                <AlertDescription className="text-xs">
                  <div className="flex justify-between items-center">
                    <span>{suggestion.title}</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 px-2 text-xs"
                      onClick={() => applySuggestion(suggestion)}
                    >
                      Apply
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
            ))}
          </div>
        )}

        {/* Quick Optimize */}
        <Card>
          <CardContent className="pt-4">
            <Textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste job description here..."
              className="min-h-24 text-xs"
            />
            <Button
              onClick={handleAdvancedAnalyze}
              disabled={!jobDescription.trim() || analyzing}
              size="sm"
              className="w-full mt-2"
            >
              {analyzing ? 'Analyzing...' : 'Optimize for Job'}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Score Mode - focused on analysis and scoring
  if (scoreMode) {
    return (
      <div className="space-y-6">
        {/* Job Description Input - Prominent in Score Mode */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Target Job Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="jobDescription">
                Paste the job description to get a targeted ATS score
              </Label>
              <Textarea
                id="jobDescription"
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Copy and paste the complete job description here. This will give you a precise ATS score for this specific position."
                className="min-h-32"
              />
            </div>
            
            <div className="flex gap-2">
              <Button
                onClick={handleAdvancedAnalyze}
                disabled={!jobDescription.trim() || analyzing}
                className="flex-1"
              >
                {analyzing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 mr-2" />
                    Analyze & Score
                  </>
                )}
              </Button>
              
              <Button variant="outline">
                <Upload className="w-4 h-4 mr-2" />
                Upload JD File
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Score Display */}
        {advancedAnalysis && (
          <Card>
            <CardHeader>
              <CardTitle>ATS Match Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className="text-6xl font-bold mb-2" style={{ color: atsScore >= 80 ? '#10b981' : atsScore >= 60 ? '#f59e0b' : '#ef4444' }}>
                  {advancedAnalysis.matching?.overallScore || atsScore}%
                </div>
                <p className="text-gray-600 mb-4">
                  {atsScore >= 80 ? 'Excellent match!' : atsScore >= 60 ? 'Good match with room for improvement' : 'Needs optimization'}
                </p>
                <Progress value={advancedAnalysis.matching?.overallScore || atsScore} className="h-3" />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Resume-Matcher Style Results */}
        {advancedAnalysis?.matching && (
          <>
            {/* Category Scores */}
            <Card>
              <CardHeader>
                <CardTitle>Score Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(advancedAnalysis.matching.categoryScores).map(([category, score]) => {
                  const percentage = score as number;
                  const getScoreColor = (score: number) => {
                    if (score >= 80) return 'bg-green-500';
                    if (score >= 60) return 'bg-yellow-500';
                    return 'bg-red-500';
                  };
                  
                  return (
                    <div key={category} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-medium capitalize">
                          {category.replace(/([A-Z])/g, ' $1').trim()}
                        </span>
                        <span className="text-sm font-semibold">{percentage}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div
                          className={`h-3 rounded-full transition-all ${getScoreColor(percentage)}`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Improvements */}
            {advancedAnalysis.matching.improvements && advancedAnalysis.matching.improvements.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Improvement Recommendations</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {advancedAnalysis.matching.improvements.slice(0, 5).map((improvement: any, index: number) => (
                    <Alert key={index} className="border-orange-200 bg-orange-50">
                      <AlertCircle className="w-4 h-4" />
                      <AlertDescription>
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="outline" className="text-xs">
                                {improvement.category}
                              </Badge>
                              <Badge variant="secondary" className="text-xs">
                                {improvement.priority} priority
                              </Badge>
                            </div>
                            <p className="font-medium">{improvement.suggestion}</p>
                          </div>
                          <Badge variant="default" className="ml-2">
                            +{improvement.impact} pts
                          </Badge>
                        </div>
                      </AlertDescription>
                    </Alert>
                  ))}
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    );
  }

  // Main component view (default)
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-2">ATS Optimization</h1>
        <p className="text-gray-600">
          Optimize your resume for Applicant Tracking Systems and specific job postings
        </p>
      </div>

      {/* Job Description Input */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Job Description Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="jobDescription">
              Paste the job description to get targeted optimization suggestions
            </Label>
            <Textarea
              id="jobDescription"
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Copy and paste the complete job description here..."
              className="min-h-32"
            />
          </div>
          
          <div className="flex gap-2">
            <Button
              onClick={handleAdvancedAnalyze}
              disabled={!jobDescription.trim() || analyzing}
              className="flex-1"
            >
              {analyzing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 mr-2" />
                  Analyze & Optimize
                </>
              )}
            </Button>
            
            <Button variant="outline">
              <Upload className="w-4 h-4 mr-2" />
              Upload JD File
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Analysis Results */}
      {showAnalysis && advancedAnalysis && (
        <>
          {/* Analysis Navigation */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex gap-2 justify-center">
                <Button
                  size="sm"
                  variant={activeView === 'overview' ? 'default' : 'outline'}
                  onClick={() => setActiveView('overview')}
                >
                  Overview
                </Button>
                <Button
                  size="sm"
                  variant={activeView === 'scores' ? 'default' : 'outline'}
                  onClick={() => setActiveView('scores')}
                >
                  Score Analysis
                </Button>
                <Button
                  size="sm"
                  variant={activeView === 'keywords' ? 'default' : 'outline'}
                  onClick={() => setActiveView('keywords')}
                >
                  Keywords
                </Button>
                <Button
                  size="sm"
                  variant={activeView === 'recommendations' ? 'default' : 'outline'}
                  onClick={() => setActiveView('recommendations')}
                >
                  Recommendations
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Overview */}
          {activeView === 'overview' && (
            <Card>
              <CardHeader>
                <CardTitle>Analysis Overview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Resume-Matcher Style Overview */}
                {advancedAnalysis.matching ? (
                  <>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">{advancedAnalysis.matching.overallScore}%</div>
                        <div className="text-sm text-blue-800">Overall Match</div>
                      </div>
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">{advancedAnalysis.matching.categoryScores.skillsMatch}%</div>
                        <div className="text-sm text-green-800">Skills Match</div>
                      </div>
                      <div className="text-center p-4 bg-purple-50 rounded-lg">
                        <div className="text-2xl font-bold text-purple-600">{advancedAnalysis.matching.categoryScores.atsCompatibility}%</div>
                        <div className="text-sm text-purple-800">ATS Compatible</div>
                      </div>
                      <div className="text-center p-4 bg-orange-50 rounded-lg">
                        <div className="text-2xl font-bold text-orange-600">{advancedAnalysis.matching.strongMatches.length}</div>
                        <div className="text-sm text-orange-800">Strong Matches</div>
                      </div>
                    </div>

                    {/* Key Insights - Resume-Matcher Style */}
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-medium text-green-700 mb-2">Strong Matches</h4>
                        <ul className="space-y-1 text-sm">
                          {advancedAnalysis.matching.strongMatches.slice(0, 5).map((match: string, idx: number) => (
                            <li key={idx} className="flex items-start gap-2">
                              <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                              <span>{match}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-medium text-orange-700 mb-2">Missing Keywords</h4>
                        <ul className="space-y-1 text-sm">
                          {advancedAnalysis.matching.missingKeywords.slice(0, 5).map((keyword: string, idx: number) => (
                            <li key={idx} className="flex items-start gap-2">
                              <XCircle className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
                              <span>{keyword}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No analysis data available. Try analyzing with a job description.
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Scores */}
          {activeView === 'scores' && advancedAnalysis.matching?.categoryScores && (
            <Card>
              <CardHeader>
                <CardTitle>Detailed Score Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(advancedAnalysis.matching.categoryScores).map(([category, score]) => {
                  const percentage = score as number;
                  const getScoreColor = (score: number) => {
                    if (score >= 80) return 'bg-green-500';
                    if (score >= 60) return 'bg-yellow-500';
                    return 'bg-red-500';
                  };
                  
                  return (
                    <div key={category} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-medium capitalize">
                          {category.replace(/([A-Z])/g, ' $1').trim()}
                        </span>
                        <span className="text-sm font-semibold">{percentage}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div
                          className={`h-3 rounded-full transition-all ${getScoreColor(percentage)}`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}

          {/* Keywords */}
          {activeView === 'keywords' && advancedAnalysis.keywordMatches && (
            <KeywordHighlighter
              text={generateResumeText(resume)}
              keywordMatches={advancedAnalysis.keywordMatches}
            />
          )}

          {/* Recommendations */}
          {activeView === 'recommendations' && (
            <Card>
              <CardHeader>
                <CardTitle>Resume-Matcher Recommendations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {advancedAnalysis.matching?.improvements ? (
                  advancedAnalysis.matching.improvements.map((improvement: any, index: number) => (
                    <Alert key={index} className="border-orange-200 bg-orange-50">
                      <Lightbulb className="w-4 h-4" />
                      <AlertDescription>
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="outline" className="text-xs">
                                {improvement.category}
                              </Badge>
                              <Badge variant="secondary" className="text-xs">
                                {improvement.priority} priority
                              </Badge>
                              <Badge variant="default" className="text-xs">
                                +{improvement.impact} pts
                              </Badge>
                            </div>
                            <h4 className="font-medium">{improvement.suggestion}</h4>
                          </div>
                          <Button
                            size="sm"
                            className="ml-4"
                            onClick={() => {
                              console.log('Apply improvement:', improvement);
                            }}
                          >
                            Apply
                          </Button>
                        </div>
                      </AlertDescription>
                    </Alert>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No recommendations available. Try analyzing with a job description first.
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
};