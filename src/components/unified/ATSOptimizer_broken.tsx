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
      // Fallback to original analysis
      await handleOriginalAnalyze();
    } finally {
      setAnalyzing(false);
    }
  };

  const handleOriginalAnalyze = async () => {
    if (!jobDescription.trim()) return;
    
    try {
      // Use original advanced analysis system as fallback
      const response = await fetch('/api/advanced-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resumeText: generateResumeText(resume),
          jobDescription
        })
      });

      if (!response.ok) {
        throw new Error('Analysis failed');
      }

      const result = await response.json();
      setAdvancedAnalysis(result.data.analysis);

      // Create target job for legacy compatibility
      const targetJob = {
        id: crypto.randomUUID(),
        title: 'Target Position',
        company: 'Target Company', 
        description: jobDescription,
        keywords: {
          hard_skills: result.data.analysis.keywordMatches.matched
            .filter((k: any) => k.category === 'hard_skill')
            .map((k: any) => k.term),
          soft_skills: result.data.analysis.keywordMatches.matched
            .filter((k: any) => k.category === 'soft_skill')
            .map((k: any) => k.term),
          qualifications: result.data.analysis.keywordMatches.matched
            .filter((k: any) => k.category === 'certification')
            .map((k: any) => k.term),
          industry_terms: result.data.analysis.keywordMatches.matched
            .filter((k: any) => k.category === 'domain')
            .map((k: any) => k.term)
        },
        embedding: []
      };
      
      addTargetJob(targetJob);
      await optimizeForJob(resume.id, targetJob.id);
    } catch (error) {
      console.error('Original analysis failed:', error);
    }
  };

  // Helper to generate plain text from resume
  const generateResumeText = (resume: UnifiedResume): string => {
    const sections = resume.builder.sections;
    let text = '';
    
    // Contact info
    if (sections.basics) {
      text += `${sections.basics.name}\n${sections.basics.email}\n${sections.basics.phone}\n\n`;
    }
    
    // Summary
    if (sections.summary) {
      text += `SUMMARY\n${sections.summary}\n\n`;
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
        text += `${edu.degree} in ${edu.area} from ${edu.institution} (${edu.startDate} - ${edu.endDate})\n`;
      });
      text += '\n';
    }
    
    // Skills
    if (sections.skills && sections.skills.length > 0) {
      text += 'SKILLS\n';
      sections.skills.forEach(skillGroup => {
        text += `${skillGroup.name}: ${skillGroup.keywords.join(', ')}\n`;
      });
    }
    
    return text;
  };

  const atsScore = resume.optimization.analysis.atsScore;
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

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

        {/* Job Target Input */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Target Job</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
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
            
            <Button
              onClick={handleAdvancedAnalyze}
              disabled={!jobDescription.trim() || analyzing}
              className="w-full"
              size="lg"
            >
              {analyzing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Analyzing Against Job Requirements...
                </>
              ) : (
                <>
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Analyze ATS Score for This Job
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Advanced Analysis Results */}
        {showAnalysis && advancedAnalysis && (
          <>
            {/* Quick Score Overview */}
            <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
              <CardContent className="pt-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div className="p-3 bg-white rounded-lg shadow-sm">
                    <div className="text-2xl font-bold text-blue-600">{advancedAnalysis.overallScore}%</div>
                    <div className="text-sm text-blue-800">Job Match Score</div>
                  </div>
                  <div className="p-3 bg-white rounded-lg shadow-sm">
                    <div className="text-2xl font-bold text-green-600">{advancedAnalysis.keywordMatches.matched.length}</div>
                    <div className="text-sm text-green-800">Keywords Matched</div>
                  </div>
                  <div className="p-3 bg-white rounded-lg shadow-sm">
                    <div className="text-2xl font-bold text-purple-600">{Math.round(advancedAnalysis.similarityScore * 100)}%</div>
                    <div className="text-sm text-purple-800">Semantic Match</div>
                  </div>
                  <div className="p-3 bg-white rounded-lg shadow-sm">
                    <div className="text-2xl font-bold text-orange-600">{advancedAnalysis.atsCompatibility.score}%</div>
                    <div className="text-sm text-orange-800">ATS Compatible</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Analysis Navigation */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex gap-2 justify-center flex-wrap">
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
                    Score Breakdown
                  </Button>
                  <Button
                    size="sm"
                    variant={activeView === 'keywords' ? 'default' : 'outline'}
                    onClick={() => setActiveView('keywords')}
                  >
                    Keyword Analysis
                  </Button>
                  <Button
                    size="sm"
                    variant={activeView === 'recommendations' ? 'default' : 'outline'}
                    onClick={() => setActiveView('recommendations')}
                  >
                    Improvements
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Content Views */}
            {activeView === 'overview' && (
              <Card>
                <CardHeader>
                  <CardTitle>Score Analysis Overview</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Strengths and Improvements */}
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium text-green-700 mb-3 flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" />
                        Strong Areas
                      </h4>
                      <ul className="space-y-2 text-sm">
                        {advancedAnalysis.insights.strengthAreas.slice(0, 4).map((strength: string, idx: number) => (
                          <li key={idx} className="flex items-start gap-2">
                            <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                            <span>{strength}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-medium text-orange-700 mb-3 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" />
                        Improvement Opportunities
                      </h4>
                      <ul className="space-y-2 text-sm">
                        {advancedAnalysis.insights.improvementAreas.slice(0, 4).map((area: string, idx: number) => (
                          <li key={idx} className="flex items-start gap-2">
                            <AlertCircle className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
                            <span>{area}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Score Visualization */}
            {activeView === 'scores' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    Detailed Score Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Resume-Matcher Style Category Scores */}
                  {advancedAnalysis.matching?.categoryScores ? (
                    <div className="space-y-4">
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
                    </div>
                  ) : (
                    // Fallback to original ScoreVisualization
                    <ScoreVisualization analysis={advancedAnalysis} />
                  )}
                  
                  {/* Job Analysis Info */}
                  {advancedAnalysis.jobAnalysis && (
                    <div className="mt-8 p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-3">Job Analysis</h4>
                      <div className="grid md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium text-gray-700">Position:</span>
                          <span className="ml-2 text-gray-600">{advancedAnalysis.jobAnalysis.title}</span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Experience Level:</span>
                          <span className="ml-2 text-gray-600 capitalize">{advancedAnalysis.jobAnalysis.experienceLevel}</span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Key Skills:</span>
                          <span className="ml-2 text-gray-600">{advancedAnalysis.jobAnalysis.skills?.length || 0} identified</span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Industry:</span>
                          <span className="ml-2 text-gray-600">{advancedAnalysis.jobAnalysis.industry}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Keyword Analysis */}
            {activeView === 'keywords' && (
              <KeywordHighlighter
                text={generateResumeText(resume)}
                keywordMatches={advancedAnalysis.keywordMatches}
              />
            )}

            {/* Recommendations */}
            {activeView === 'recommendations' && advancedAnalysis.recommendations && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Score Improvement Recommendations
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {advancedAnalysis.recommendations.slice(0, 6).map((rec: any, index: number) => (
                    <Alert key={index} className="border-blue-200 bg-blue-50">
                      <Lightbulb className="w-4 h-4" />
                      <AlertDescription>
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="outline" className="text-xs">
                                {rec.section}
                              </Badge>
                              <Badge variant="default" className="text-xs">
                                +{rec.impact} pts
                              </Badge>
                            </div>
                            <h4 className="font-medium text-blue-900">{rec.suggestion}</h4>
                            <p className="text-sm text-blue-800 mt-1">{rec.reasoning}</p>
                          </div>
                        </div>
                      </AlertDescription>
                    </Alert>
                  ))}
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* General ATS Issues */}
        {resume.optimization.analysis.issues.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                General ATS Compatibility Issues
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {resume.optimization.analysis.issues.slice(0, 3).map((issue, index) => (
                <Alert 
                  key={index} 
                  variant={issue.severity === 'critical' ? 'destructive' : 'default'}
                >
                  <AlertCircle className="w-4 h-4" />
                  <AlertDescription>
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium">{issue.title}</h4>
                        <p className="text-sm mt-1">{issue.description}</p>
                      </div>
                      <Badge variant="outline" className="ml-2">
                        -{issue.impact}%
                      </Badge>
                    </div>
                  </AlertDescription>
                </Alert>
              ))}
            </CardContent>
          </Card>
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

      {/* Current ATS Score */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Current ATS Score</span>
            <span className={`text-3xl font-bold ${getScoreColor(atsScore)}`}>
              {atsScore}%
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Progress value={atsScore} className="h-4 mb-4" />
          
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-green-600">
                {analysis?.matched.length || 0}
              </div>
              <p className="text-sm text-gray-600">Matched Keywords</p>
            </div>
            <div>
              <div className="text-2xl font-bold text-yellow-600">
                {analysis?.partial.length || 0}
              </div>
              <p className="text-sm text-gray-600">Partial Matches</p>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-600">
                {analysis?.missing.length || 0}
              </div>
              <p className="text-sm text-gray-600">Missing Keywords</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Job Description Input */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Target Job Description
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="jobDescription">
              Paste the job description you're targeting
            </Label>
            <Textarea
              id="jobDescription"
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Copy and paste the full job description here. The more complete the description, the better the optimization suggestions will be."
              className="min-h-40"
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

      {/* Advanced Analysis Results */}
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
                  <>
                    {/* Fallback to original format */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">{advancedAnalysis.overallScore || 0}%</div>
                        <div className="text-sm text-blue-800">Overall Score</div>
                      </div>
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">{advancedAnalysis.keywordMatches?.matched?.length || 0}</div>
                        <div className="text-sm text-green-800">Keywords Matched</div>
                      </div>
                      <div className="text-center p-4 bg-purple-50 rounded-lg">
                        <div className="text-2xl font-bold text-purple-600">{Math.round((advancedAnalysis.similarityScore || 0) * 100)}%</div>
                        <div className="text-sm text-purple-800">Semantic Match</div>
                      </div>
                      <div className="text-center p-4 bg-orange-50 rounded-lg">
                        <div className="text-2xl font-bold text-orange-600">{advancedAnalysis.atsCompatibility?.score || 0}%</div>
                        <div className="text-sm text-orange-800">ATS Compatible</div>
                      </div>
                    </div>

                    {/* Key Insights - Original Format */}
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-medium text-green-700 mb-2">Strengths</h4>
                        <ul className="space-y-1 text-sm">
                          {(advancedAnalysis.insights?.strengthAreas || []).slice(0, 3).map((strength: string, idx: number) => (
                            <li key={idx} className="flex items-start gap-2">
                              <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                              <span>{strength}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-medium text-orange-700 mb-2">Areas to Improve</h4>
                        <ul className="space-y-1 text-sm">
                          {(advancedAnalysis.insights?.improvementAreas || []).slice(0, 3).map((area: string, idx: number) => (
                            <li key={idx} className="flex items-start gap-2">
                              <AlertCircle className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
                              <span>{area}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* Score Visualization */}
          {activeView === 'scores' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Detailed Score Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Resume-Matcher Style Category Scores */}
                {advancedAnalysis.matching?.categoryScores ? (
                  <div className="space-y-4">
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
                  </div>
                ) : (
                  // Fallback to original ScoreVisualization
                  <ScoreVisualization analysis={advancedAnalysis} />
                )}
                
                {/* Job Analysis Info */}
                {advancedAnalysis.jobAnalysis && (
                  <div className="mt-8 p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-3">Job Analysis</h4>
                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-700">Position:</span>
                        <span className="ml-2 text-gray-600">{advancedAnalysis.jobAnalysis.title}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Experience Level:</span>
                        <span className="ml-2 text-gray-600 capitalize">{advancedAnalysis.jobAnalysis.experienceLevel}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Key Skills:</span>
                        <span className="ml-2 text-gray-600">{advancedAnalysis.jobAnalysis.skills?.length || 0} identified</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Industry:</span>
                        <span className="ml-2 text-gray-600">{advancedAnalysis.jobAnalysis.industry}</span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Keyword Analysis */}
          {activeView === 'keywords' && (
            <KeywordHighlighter
              text={generateResumeText(resume)}
              keywordMatches={advancedAnalysis.keywordMatches}
            />
          )}

          {/* AI Recommendations */}
          {activeView === 'recommendations' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Resume-Matcher Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Resume-Matcher Style Improvements */}
                {advancedAnalysis.matching?.improvements ? (
                  advancedAnalysis.matching.improvements.map((improvement: any, index: number) => {
                    const getAlertClasses = (priority: string) => {
                      if (priority === 'high') return 'border-red-200 bg-red-50';
                      if (priority === 'medium') return 'border-orange-200 bg-orange-50';
                      return 'border-blue-200 bg-blue-50';
                    };
                    
                    return (
                    <Alert key={index} className={getAlertClasses(improvement.priority)}>
                      <Lightbulb className="w-4 h-4" />
                      <AlertDescription>
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="outline" className="text-xs">
                                {improvement.category}
                              </Badge>
                              <Badge 
                                variant={improvement.priority === 'high' ? 'destructive' : improvement.priority === 'medium' ? 'secondary' : 'default'} 
                                className="text-xs"
                              >
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
                              // TODO: Implement Resume-Matcher suggestion application
                              console.log('Apply improvement:', improvement);
                            }}
                          >
                            Apply
                          </Button>
                        </div>
                      </AlertDescription>
                    </Alert>
                    );
                  })
                ) : advancedAnalysis.recommendations ? (
                  // Fallback to original recommendations
                  advancedAnalysis.recommendations.map((rec: any, index: number) => (
                    <Alert key={index} className="border-blue-200 bg-blue-50">
                      <Lightbulb className="w-4 h-4" />
                      <AlertDescription>
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="outline" className="text-xs">
                                {rec.section}
                              </Badge>
                              <Badge variant="secondary" className="text-xs">
                                {rec.type}
                              </Badge>
                              <Badge variant="default" className="text-xs">
                                +{rec.impact} pts
                              </Badge>
                            </div>
                            <h4 className="font-medium text-blue-900">{rec.suggestion}</h4>
                            <p className="text-sm text-blue-800 mt-1">{rec.reasoning}</p>
                            {rec.keywords && rec.keywords.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {rec.keywords.slice(0, 4).map((keyword: string, kidx: number) => (
                                  <Badge key={kidx} variant="outline" className="text-xs">
                                    {keyword}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                          <Button
                            size="sm"
                            className="ml-4"
                            onClick={() => {
                              // TODO: Implement suggestion application
                              console.log('Apply suggestion:', rec);
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

      {/* ATS Issues */}
      {resume.optimization.analysis.issues.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              ATS Compatibility Issues
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {resume.optimization.analysis.issues.map((issue, index) => (
              <Alert 
                key={index} 
                variant={issue.severity === 'critical' ? 'destructive' : 'default'}
              >
                <AlertCircle className="w-4 h-4" />
                <AlertDescription>
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium">{issue.title}</h4>
                      <p className="text-sm mt-1">{issue.description}</p>
                      <p className="text-xs mt-2 text-blue-600">
                        Suggestion: {issue.suggestion}
                      </p>
                    </div>
                    <Badge variant="outline" className="ml-2">
                      -{issue.impact}%
                    </Badge>
                  </div>
                </AlertDescription>
              </Alert>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
};