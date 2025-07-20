"use client";

import React, { useState } from 'react';
import { 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  Radar,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Target, 
  TrendingUp, 
  TrendingDown, 
  Award, 
  AlertTriangle,
  CheckCircle,
  BarChart3,
  PieChart as PieChartIcon,
  Activity,
  Zap
} from 'lucide-react';
import type { AnalysisResult, SectionScore } from '@/lib/services/analyzer.service';

interface ScoreVisualizationProps {
  analysis: AnalysisResult;
  showDetails?: boolean;
  interactive?: boolean;
  className?: string;
}

interface ScoreData {
  subject: string;
  score: number;
  maxScore: number;
  category: string;
}

export const ScoreVisualization: React.FC<ScoreVisualizationProps> = ({
  analysis,
  showDetails = true,
  interactive = true,
  className = ""
}) => {
  const [selectedChart, setSelectedChart] = useState<'radar' | 'bar' | 'pie' | 'trend'>('radar');
  const [selectedSection, setSelectedSection] = useState<string | null>(null);

  // Prepare data for different chart types
  const radarData: ScoreData[] = [
    { subject: 'Keywords', score: analysis.keywordMatches.matched.length * 10, maxScore: 100, category: 'content' },
    { subject: 'Experience', score: analysis.sectionScores.experience.score, maxScore: 100, category: 'content' },
    { subject: 'Skills', score: analysis.sectionScores.skills.score, maxScore: 100, category: 'content' },
    { subject: 'Education', score: analysis.sectionScores.education.score, maxScore: 100, category: 'content' },
    { subject: 'Summary', score: analysis.sectionScores.summary.score, maxScore: 100, category: 'content' },
    { subject: 'ATS Score', score: analysis.atsCompatibility.score, maxScore: 100, category: 'technical' },
    { subject: 'Similarity', score: Math.round(analysis.similarityScore * 100), maxScore: 100, category: 'ai' }
  ];

  const barData = radarData.map(item => ({
    name: item.subject,
    score: item.score,
    benchmark: 75 // Industry benchmark
  }));

  const pieData = [
    { name: 'Matched Keywords', value: analysis.keywordMatches.matched.length, color: '#10b981' },
    { name: 'Partial Matches', value: analysis.keywordMatches.partial.length, color: '#f59e0b' },
    { name: 'Missing Keywords', value: analysis.keywordMatches.missing.length, color: '#ef4444' }
  ];

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const getScoreBadgeVariant = (score: number) => {
    if (score >= 80) return 'default';
    if (score >= 60) return 'secondary';
    return 'destructive';
  };

  const getScoreIcon = (score: number) => {
    if (score >= 80) return <CheckCircle className="w-4 h-4 text-green-600" />;
    if (score >= 60) return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
    return <TrendingDown className="w-4 h-4 text-red-600" />;
  };

  const formatSectionName = (section: string) => {
    return section.split(/(?=[A-Z])/).join(' ').toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-medium">{label}</p>
          <p className="text-blue-600">Score: {payload[0].value}%</p>
          {payload[0].payload.benchmark && (
            <p className="text-gray-500">Benchmark: {payload[0].payload.benchmark}%</p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Overall Score Header */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-3">
              <Award className="w-8 h-8 text-blue-600" />
              <div>
                <div className={`text-4xl font-bold ${getScoreColor(analysis.overallScore)}`}>
                  {analysis.overallScore}%
                </div>
                <div className="text-sm text-gray-600">Overall Match Score</div>
              </div>
            </div>
            
            <Progress value={analysis.overallScore} className="h-3" />
            
            <div className="flex justify-center gap-6 text-sm">
              <div className="flex items-center gap-1">
                <Target className="w-4 h-4 text-blue-600" />
                <span>{analysis.keywordMatches.matched.length} Keywords Matched</span>
              </div>
              <div className="flex items-center gap-1">
                <Zap className="w-4 h-4 text-purple-600" />
                <span>{Math.round(analysis.similarityScore * 100)}% Semantic Match</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Chart Type Selector */}
      {interactive && (
        <Card>
          <CardContent className="pt-4 md:pt-6">
            <div className="flex gap-1 sm:gap-2 justify-center">
              <Button
                variant={selectedChart === 'radar' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedChart('radar')}
                className="flex items-center gap-1"
              >
                <Activity className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Radar</span>
              </Button>
              <Button
                variant={selectedChart === 'bar' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedChart('bar')}
                className="flex items-center gap-1"
              >
                <BarChart3 className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Bar Chart</span>
              </Button>
              <Button
                variant={selectedChart === 'pie' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedChart('pie')}
                className="flex items-center gap-1"
              >
                <PieChartIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Keywords</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Visualization */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Score Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 sm:h-80">
            <ResponsiveContainer width="100%" height="100%">
              {selectedChart === 'radar' && (
                <RadarChart data={radarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="subject" className="text-sm" />
                  <PolarRadiusAxis 
                    angle={90} 
                    domain={[0, 100]} 
                    tick={{ fontSize: 12 }}
                  />
                  <Radar 
                    name="Score" 
                    dataKey="score" 
                    stroke="#3b82f6" 
                    fill="#3b82f6" 
                    fillOpacity={0.3}
                    strokeWidth={2}
                  />
                  <Radar 
                    name="Benchmark" 
                    dataKey="maxScore" 
                    stroke="#e5e7eb" 
                    fill="transparent"
                    strokeWidth={1}
                    strokeDasharray="5 5"
                  />
                  <Tooltip content={<CustomTooltip />} />
                </RadarChart>
              )}
              
              {selectedChart === 'bar' && (
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="name" 
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    className="text-xs"
                  />
                  <YAxis domain={[0, 100]} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar dataKey="score" fill="#3b82f6" name="Your Score" />
                  <Bar dataKey="benchmark" fill="#e5e7eb" name="Benchmark" />
                </BarChart>
              )}
              
              {selectedChart === 'pie' && (
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              )}
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Section Scores */}
      {showDetails && (
        <Tabs defaultValue="sections" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="sections">Section Scores</TabsTrigger>
            <TabsTrigger value="insights">Key Insights</TabsTrigger>
            <TabsTrigger value="recommendations">Top Actions</TabsTrigger>
          </TabsList>

          <TabsContent value="sections" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {Object.entries(analysis.sectionScores).map(([section, score]) => (
                <Card 
                  key={section}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    selectedSection === section ? 'ring-2 ring-blue-500' : ''
                  }`}
                  onClick={() => setSelectedSection(selectedSection === section ? null : section)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base flex items-center gap-2">
                        {getScoreIcon(score.score)}
                        {formatSectionName(section)}
                      </CardTitle>
                      <Badge variant={getScoreBadgeVariant(score.score)}>
                        {score.score}%
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Progress value={score.score} className="h-2" />
                    
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-gray-500">Keyword Density:</span>
                        <span className="ml-1 font-medium">{score.keywordDensity.toFixed(1)}%</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Quality Score:</span>
                        <span className="ml-1 font-medium">{score.qualityScore}%</span>
                      </div>
                    </div>
                    
                    <div className="text-xs text-gray-600">
                      {score.feedback}
                    </div>
                    
                    {selectedSection === section && score.suggestions.length > 0 && (
                      <div className="mt-3 pt-3 border-t">
                        <div className="text-xs font-medium text-gray-700 mb-2">Suggestions:</div>
                        <ul className="text-xs space-y-1">
                          {score.suggestions.slice(0, 3).map((suggestion, idx) => (
                            <li key={idx} className="flex items-start gap-1">
                              <span className="text-blue-500 mt-0.5">•</span>
                              <span className="text-gray-600">{suggestion}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="insights" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
              {/* Strengths */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2 text-green-700">
                    <TrendingUp className="w-5 h-5" />
                    Strengths
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {analysis.insights.strengthAreas.length > 0 ? (
                      analysis.insights.strengthAreas.map((strength, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-sm">
                          <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-700">{strength}</span>
                        </div>
                      ))
                    ) : (
                      <div className="text-sm text-gray-500 italic">No specific strengths identified</div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Improvement Areas */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2 text-orange-700">
                    <TrendingUp className="w-5 h-5" />
                    Improvement Areas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {analysis.insights.improvementAreas.length > 0 ? (
                      analysis.insights.improvementAreas.map((area, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-sm">
                          <AlertTriangle className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-700">{area}</span>
                        </div>
                      ))
                    ) : (
                      <div className="text-sm text-gray-500 italic">All areas performing well</div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Keyword Gaps */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2 text-red-700">
                    <Target className="w-5 h-5" />
                    Critical Missing Keywords
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {analysis.insights.keywordGaps.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {analysis.insights.keywordGaps.slice(0, 8).map((keyword, idx) => (
                          <Badge key={idx} variant="destructive" className="text-xs">
                            {keyword}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <div className="text-sm text-gray-500 italic">No critical keywords missing</div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Competitive Advantages */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2 text-blue-700">
                    <Award className="w-5 h-5" />
                    Competitive Advantages
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {analysis.insights.competitiveAdvantages.length > 0 ? (
                      analysis.insights.competitiveAdvantages.map((advantage, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-sm">
                          <Award className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-700">{advantage}</span>
                        </div>
                      ))
                    ) : (
                      <div className="text-sm text-gray-500 italic">Focus on building unique strengths</div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="recommendations" className="space-y-4">
            <div className="space-y-4">
              {analysis.recommendations.slice(0, 6).map((rec, idx) => (
                <Card key={idx} className="border-l-4 border-l-blue-500">
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {formatSectionName(rec.section)}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {rec.type}
                        </Badge>
                      </div>
                      <Badge variant="default" className="text-xs">
                        +{rec.impact} pts
                      </Badge>
                    </div>
                    
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-900">{rec.suggestion}</p>
                      <p className="text-xs text-gray-600">{rec.reasoning}</p>
                      
                      {rec.keywords.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {rec.keywords.slice(0, 4).map((keyword, kidx) => (
                            <Badge key={kidx} variant="outline" className="text-xs">
                              {keyword}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default ScoreVisualization;