"use client";

import React, { useState } from 'react';
import Highlighter from 'react-highlight-words';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Eye, 
  EyeOff,
  Filter,
  Search,
  Target,
  TrendingUp
} from 'lucide-react';
import type { KeywordMatch } from '@/lib/services/analyzer.service';

interface KeywordHighlighterProps {
  text: string;
  keywordMatches: {
    matched: KeywordMatch[];
    missing: KeywordMatch[];
    partial: KeywordMatch[];
  };
  showStats?: boolean;
  interactive?: boolean;
  className?: string;
}

export const KeywordHighlighter: React.FC<KeywordHighlighterProps> = ({
  text,
  keywordMatches,
  showStats = true,
  interactive = true,
  className = ""
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showPartial, setShowPartial] = useState(true);
  const [highlightMode, setHighlightMode] = useState<'all' | 'matched' | 'missing'>('all');
  const [selectedKeyword, setSelectedKeyword] = useState<string | null>(null);

  const { matched, missing, partial } = keywordMatches;
  const totalKeywords = matched.length + missing.length + partial.length;
  const matchPercentage = totalKeywords > 0 ? Math.round((matched.length / totalKeywords) * 100) : 0;

  // Filter keywords by category
  const getFilteredKeywords = (keywords: KeywordMatch[]) => {
    if (selectedCategory === 'all') return keywords;
    return keywords.filter(k => k.category === selectedCategory);
  };

  // Get unique categories
  const categories = Array.from(new Set([
    ...matched.map(k => k.category),
    ...missing.map(k => k.category),
    ...partial.map(k => k.category)
  ]));

  // Prepare search words for highlighting
  const getSearchWords = () => {
    let words: string[] = [];
    
    if (highlightMode === 'all' || highlightMode === 'matched') {
      const filteredMatched = getFilteredKeywords(matched);
      words.push(...filteredMatched.flatMap(k => [k.term, ...k.variations]));
    }
    
    if (showPartial && (highlightMode === 'all')) {
      const filteredPartial = getFilteredKeywords(partial);
      words.push(...filteredPartial.flatMap(k => [k.term, ...k.variations]));
    }

    return [...new Set(words)]; // Remove duplicates
  };

  // Custom highlight component for different keyword types
  const renderHighlight = (props: any) => {
    const { children } = props;
    const keyword = children.toLowerCase();
    
    const matchedKeyword = matched.find(k => 
      k.term.toLowerCase() === keyword || 
      k.variations.some(v => v.toLowerCase() === keyword)
    );
    
    const partialKeyword = partial.find(k => 
      k.term.toLowerCase() === keyword || 
      k.variations.some(v => v.toLowerCase() === keyword)
    );

    let className = "px-1 py-0.5 rounded text-sm font-medium cursor-pointer transition-all hover:scale-105";
    
    if (matchedKeyword) {
      className += " bg-green-200 text-green-800 border border-green-300";
    } else if (partialKeyword && showPartial) {
      className += " bg-yellow-200 text-yellow-800 border border-yellow-300";
    } else {
      className += " bg-blue-200 text-blue-800 border border-blue-300";
    }

    if (selectedKeyword === keyword) {
      className += " ring-2 ring-offset-1 ring-blue-500";
    }

    return (
      <span 
        className={className}
        onClick={() => setSelectedKeyword(selectedKeyword === keyword ? null : keyword)}
        title={`Click for details`}
      >
        {children}
      </span>
    );
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'hard_skill': return '🔧';
      case 'soft_skill': return '🤝';
      case 'tool': return '⚡';
      case 'certification': return '🏆';
      case 'domain': return '🎯';
      case 'responsibility': return '📋';
      default: return '📝';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'hard_skill': return 'bg-blue-100 text-blue-800';
      case 'soft_skill': return 'bg-green-100 text-green-800';
      case 'tool': return 'bg-purple-100 text-purple-800';
      case 'certification': return 'bg-yellow-100 text-yellow-800';
      case 'domain': return 'bg-red-100 text-red-800';
      case 'responsibility': return 'bg-gray-100 text-gray-800';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  const getImportanceColor = (importance: number) => {
    if (importance >= 9) return 'text-red-600';
    if (importance >= 7) return 'text-orange-600';
    if (importance >= 5) return 'text-yellow-600';
    return 'text-gray-600';
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Statistics Section */}
      {showStats && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Target className="w-5 h-5" />
                Keyword Analysis
              </CardTitle>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-green-600">{matchPercentage}%</span>
                <span className="text-sm text-gray-500">Match Rate</span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Progress value={matchPercentage} className="h-2" />
            
            <div className="grid grid-cols-3 gap-4">
              <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <div>
                  <div className="font-semibold text-green-800">{matched.length}</div>
                  <div className="text-xs text-green-600">Matched</div>
                </div>
              </div>
              
              <div className="flex items-center gap-2 p-3 bg-yellow-50 rounded-lg">
                <AlertCircle className="w-5 h-5 text-yellow-600" />
                <div>
                  <div className="font-semibold text-yellow-800">{partial.length}</div>
                  <div className="text-xs text-yellow-600">Partial</div>
                </div>
              </div>
              
              <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg">
                <XCircle className="w-5 h-5 text-red-600" />
                <div>
                  <div className="font-semibold text-red-800">{missing.length}</div>
                  <div className="text-xs text-red-600">Missing</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Controls */}
      {interactive && (
        <Card>
          <CardContent className="pt-4 md:pt-6">
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 items-start sm:items-center">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Filter className="w-4 h-4 text-gray-500" />
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="text-xs sm:text-sm border rounded px-2 py-1 flex-1 sm:flex-none"
                >
                  <option value="all">All Categories</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>
                      {getCategoryIcon(cat)} {cat.replace('_', ' ').toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Search className="w-4 h-4 text-gray-500" />
                <select
                  value={highlightMode}
                  onChange={(e) => setHighlightMode(e.target.value as any)}
                  className="text-xs sm:text-sm border rounded px-2 py-1 flex-1 sm:flex-none"
                >
                  <option value="all">Highlight All</option>
                  <option value="matched">Matched Only</option>
                  <option value="missing">Missing Only</option>
                </select>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPartial(!showPartial)}
                className="flex items-center gap-1 w-full sm:w-auto justify-center"
              >
                {showPartial ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                <span className="text-xs sm:text-sm">Partial Matches</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content Tabs */}
      <Tabs defaultValue="highlighted" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="highlighted" className="text-xs sm:text-sm">Highlighted</TabsTrigger>
          <TabsTrigger value="matched" className="text-xs sm:text-sm">Matched</TabsTrigger>
          <TabsTrigger value="missing" className="text-xs sm:text-sm">Missing</TabsTrigger>
        </TabsList>

        <TabsContent value="highlighted" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Resume with Keyword Highlights</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-64 sm:h-80 md:h-96 w-full rounded border p-2 sm:p-4">
                <div className="prose max-w-none text-xs sm:text-sm leading-relaxed">
                  <Highlighter
                    highlightComponent={renderHighlight}
                    searchWords={getSearchWords()}
                    autoEscape={true}
                    textToHighlight={text}
                    caseSensitive={false}
                  />
                </div>
              </ScrollArea>
              
              {/* Legend */}
              <div className="mt-4 flex flex-wrap gap-3 pt-3 border-t">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-green-200 border border-green-300 rounded"></div>
                  <span className="text-xs text-gray-600">Matched Keywords</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-yellow-200 border border-yellow-300 rounded"></div>
                  <span className="text-xs text-gray-600">Partial Matches</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-blue-200 border border-blue-300 rounded"></div>
                  <span className="text-xs text-gray-600">Other Highlights</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="matched" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                Matched Keywords ({getFilteredKeywords(matched).length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-3">
                  {getFilteredKeywords(matched).map((keyword, index) => (
                    <div key={index} className="p-3 border rounded-lg bg-green-50">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-green-800">{keyword.term}</span>
                            <Badge className={getCategoryColor(keyword.category)}>
                              {getCategoryIcon(keyword.category)} {keyword.category.replace('_', ' ')}
                            </Badge>
                          </div>
                          
                          <div className="flex items-center gap-4 text-xs text-gray-600">
                            <span className={`font-medium ${getImportanceColor(keyword.importance)}`}>
                              Importance: {keyword.importance}/10
                            </span>
                            <span>Frequency: {keyword.frequency}</span>
                            <span>Confidence: {Math.round(keyword.confidence * 100)}%</span>
                          </div>
                          
                          {keyword.variations.length > 0 && (
                            <div className="mt-2">
                              <span className="text-xs text-gray-500">Variations: </span>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {keyword.variations.slice(0, 3).map((variation, idx) => (
                                  <Badge key={idx} variant="outline" className="text-xs">
                                    {variation}
                                  </Badge>
                                ))}
                                {keyword.variations.length > 3 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{keyword.variations.length - 3} more
                                  </Badge>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="missing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <XCircle className="w-5 h-5 text-red-600" />
                Missing Keywords ({getFilteredKeywords(missing).length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-3">
                  {getFilteredKeywords(missing)
                    .sort((a, b) => b.importance - a.importance)
                    .map((keyword, index) => (
                    <div key={index} className="p-3 border rounded-lg bg-red-50">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-red-800">{keyword.term}</span>
                            <Badge className={getCategoryColor(keyword.category)}>
                              {getCategoryIcon(keyword.category)} {keyword.category.replace('_', ' ')}
                            </Badge>
                            {keyword.importance >= 9 && (
                              <Badge variant="destructive" className="text-xs">
                                <TrendingUp className="w-3 h-3 mr-1" />
                                Critical
                              </Badge>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-4 text-xs text-gray-600">
                            <span className={`font-medium ${getImportanceColor(keyword.importance)}`}>
                              Importance: {keyword.importance}/10
                            </span>
                            <span>Confidence: {Math.round(keyword.confidence * 100)}%</span>
                          </div>
                          
                          {keyword.variations.length > 0 && (
                            <div className="mt-2">
                              <span className="text-xs text-gray-500">Consider adding: </span>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {keyword.variations.slice(0, 3).map((variation, idx) => (
                                  <Badge key={idx} variant="outline" className="text-xs cursor-pointer hover:bg-gray-100">
                                    {variation}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Selected Keyword Details */}
      {selectedKeyword && (
        <Card className="border-blue-500">
          <CardHeader>
            <CardTitle className="text-sm">Keyword Details: {selectedKeyword}</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Add detailed keyword analysis here */}
            <p className="text-sm text-gray-600">
              Click on highlighted keywords in the text to see detailed analysis and suggestions.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default KeywordHighlighter;