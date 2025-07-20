import { OpenAIService, ExtractedKeywords, AIImprovement } from './openai.service';
import { ParserService, ParsedDocument } from './parser.service';
import * as math from 'mathjs';
import { evaluate } from 'mathjs';

export interface KeywordMatch {
  term: string;
  category: 'hard_skill' | 'soft_skill' | 'tool' | 'certification' | 'domain' | 'responsibility';
  found: boolean;
  frequency: number;
  importance: number;
  confidence: number;
  variations: string[];
  contextMatch: boolean;
}

export interface ATSIssue {
  type: 'formatting' | 'parsing' | 'content' | 'structure';
  severity: 'high' | 'medium' | 'low';
  description: string;
  suggestion: string;
  impact: number;
}

export interface SectionScore {
  score: number;
  feedback: string;
  keywordDensity: number;
  qualityScore: number;
  suggestions: string[];
}

export interface AnalysisResult {
  overallScore: number;
  keywordMatches: {
    matched: KeywordMatch[];
    missing: KeywordMatch[];
    partial: KeywordMatch[];
  };
  similarityScore: number;
  atsCompatibility: {
    score: number;
    issues: ATSIssue[];
  };
  sectionScores: {
    experience: SectionScore;
    skills: SectionScore;
    education: SectionScore;
    summary: SectionScore;
  };
  recommendations: AIImprovement[];
  insights: {
    strengthAreas: string[];
    improvementAreas: string[];
    keywordGaps: string[];
    competitiveAdvantages: string[];
  };
}

export interface JobAnalysis {
  keywords: ExtractedKeywords;
  embedding: number[];
  requirements: {
    critical: string[];
    preferred: string[];
    niceToHave: string[];
  };
  industryContext: string;
  experienceLevel: 'entry' | 'mid' | 'senior' | 'executive';
}

export class AnalyzerService {
  private openaiService: OpenAIService;
  private parserService: ParserService;
  private cache: Map<string, any> = new Map();

  constructor() {
    this.openaiService = new OpenAIService();
    this.parserService = new ParserService();
  }

  async analyzeResumeMatch(
    resume: ParsedDocument,
    jobDescription: string
  ): Promise<AnalysisResult> {
    try {
      // Step 1: Analyze job description
      const jobAnalysis = await this.analyzeJobDescription(jobDescription);

      // Step 2: Perform keyword analysis
      const keywordAnalysis = await this.analyzeKeywords(resume, jobAnalysis);

      // Step 3: Calculate semantic similarity
      const similarityScore = await this.calculateSimilarity(resume, jobAnalysis);

      // Step 4: Check ATS compatibility
      const atsCompatibility = await this.checkATSCompatibility(resume);

      // Step 5: Score sections individually
      const sectionScores = await this.scoreSections(resume, jobAnalysis);

      // Step 6: Generate insights
      const insights = this.generateInsights(keywordAnalysis, sectionScores, similarityScore);

      // Step 7: Get AI-powered recommendations
      const recommendations = await this.generateRecommendations(
        resume,
        jobDescription,
        keywordAnalysis,
        sectionScores
      );

      // Step 8: Calculate overall score
      const overallScore = this.calculateOverallScore({
        keywordAnalysis,
        similarityScore,
        atsCompatibility,
        sectionScores
      });

      return {
        overallScore,
        keywordMatches: keywordAnalysis,
        similarityScore,
        atsCompatibility,
        sectionScores,
        recommendations,
        insights
      };
    } catch (error) {
      console.error('Analysis error:', error);
      throw new Error(`Resume analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async analyzeJobDescription(jobDescription: string): Promise<JobAnalysis> {
    const cacheKey = `job_analysis_${this.hashString(jobDescription)}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    const [keywords, embedding] = await Promise.all([
      this.openaiService.extractJobKeywords(jobDescription),
      this.openaiService.generateEmbedding(jobDescription)
    ]);

    // Categorize requirements by importance
    const requirements = this.categorizeRequirements(keywords);
    
    // Determine experience level and industry context
    const experienceLevel = this.determineExperienceLevel(jobDescription);
    const industryContext = this.extractIndustryContext(jobDescription);

    const analysis: JobAnalysis = {
      keywords,
      embedding,
      requirements,
      industryContext,
      experienceLevel
    };

    this.cache.set(cacheKey, analysis);
    return analysis;
  }

  private async analyzeKeywords(
    resume: ParsedDocument,
    jobAnalysis: JobAnalysis
  ): Promise<AnalysisResult['keywordMatches']> {
    const resumeText = resume.rawText.toLowerCase();
    const matched: KeywordMatch[] = [];
    const missing: KeywordMatch[] = [];
    const partial: KeywordMatch[] = [];

    for (const keyword of jobAnalysis.keywords.keywords) {
      const keywordLower = keyword.term.toLowerCase();
      const variations = keyword.variations.map(v => v.toLowerCase());
      
      // Check direct matches
      const directMatch = resumeText.includes(keywordLower);
      
      // Check variation matches
      const variationMatch = variations.some(v => resumeText.includes(v));
      
      // Calculate frequency
      const frequency = this.calculateKeywordFrequency(resumeText, [keywordLower, ...variations]);
      
      // Check contextual relevance
      const contextMatch = await this.checkContextualMatch(resume, keyword.term, keyword.category);

      const match: KeywordMatch = {
        term: keyword.term,
        category: keyword.category,
        found: directMatch || variationMatch,
        frequency,
        importance: keyword.importance,
        confidence: keyword.confidence,
        variations: keyword.variations,
        contextMatch
      };

      if (directMatch || (variationMatch && frequency > 0)) {
        matched.push(match);
      } else if (frequency > 0 || contextMatch) {
        partial.push(match);
      } else {
        missing.push(match);
      }
    }

    return { matched, missing, partial };
  }

  private async calculateSimilarity(
    resume: ParsedDocument,
    jobAnalysis: JobAnalysis
  ): Promise<number> {
    try {
      const resumeEmbedding = await this.openaiService.generateEmbedding(resume.rawText);
      return this.cosineSimilarity(resumeEmbedding, jobAnalysis.embedding);
    } catch (error) {
      console.error('Similarity calculation error:', error);
      return 0;
    }
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length || a.length === 0) return 0;
    
    try {
      const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
      const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
      const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
      
      if (magnitudeA === 0 || magnitudeB === 0) return 0;
      
      return Math.max(0, Math.min(1, dotProduct / (magnitudeA * magnitudeB)));
    } catch (error) {
      console.error('Cosine similarity calculation error:', error);
      return 0;
    }
  }

  private async checkATSCompatibility(resume: ParsedDocument): Promise<AnalysisResult['atsCompatibility']> {
    const issues: ATSIssue[] = [];
    let score = 100;

    // Check basic contact information parsing
    if (!resume.parsedSections.contact.email || !resume.parsedSections.contact.email.includes('@')) {
      issues.push({
        type: 'parsing',
        severity: 'high',
        description: 'Email address not properly detected',
        suggestion: 'Ensure email is clearly formatted (e.g., john@email.com)',
        impact: 15
      });
      score -= 15;
    }

    if (!resume.parsedSections.contact.phone) {
      issues.push({
        type: 'parsing',
        severity: 'medium',
        description: 'Phone number not detected',
        suggestion: 'Use standard phone format (e.g., (555) 123-4567)',
        impact: 10
      });
      score -= 10;
    }

    // Check for common ATS parsing issues
    const text = resume.rawText;
    
    // Complex formatting issues
    if (this.hasComplexFormatting(text)) {
      issues.push({
        type: 'formatting',
        severity: 'medium',
        description: 'Complex formatting detected that may confuse ATS systems',
        suggestion: 'Use simple, clean formatting with standard fonts',
        impact: 10
      });
      score -= 10;
    }

    // Section header issues
    if (!this.hasStandardSections(text)) {
      issues.push({
        type: 'structure',
        severity: 'medium',
        description: 'Non-standard section headers may reduce ATS parsing accuracy',
        suggestion: 'Use standard headers like "Experience", "Education", "Skills"',
        impact: 8
      });
      score -= 8;
    }

    // Content density issues
    if (this.isContentTooSparse(text)) {
      issues.push({
        type: 'content',
        severity: 'low',
        description: 'Resume content appears sparse',
        suggestion: 'Add more detailed descriptions and quantified achievements',
        impact: 5
      });
      score -= 5;
    }

    // Use OpenAI for additional ATS analysis
    try {
      const aiAnalysis = await this.openaiService.analyzeATSCompatibility(text);
      if (aiAnalysis.issues && aiAnalysis.issues.length > 0) {
        issues.push(...aiAnalysis.issues);
        score = Math.min(score, aiAnalysis.score);
      }
    } catch (error) {
      console.warn('AI ATS analysis failed:', error);
    }

    return {
      score: Math.max(0, score),
      issues
    };
  }

  private async scoreSections(
    resume: ParsedDocument,
    jobAnalysis: JobAnalysis
  ): Promise<AnalysisResult['sectionScores']> {
    const sections = resume.parsedSections;

    const [experienceScore, skillsScore, educationScore, summaryScore] = await Promise.all([
      this.scoreExperienceSection(sections.experience, jobAnalysis),
      this.scoreSkillsSection(sections.skills, jobAnalysis),
      this.scoreEducationSection(sections.education, jobAnalysis),
      this.scoreSummarySection(sections.summary, jobAnalysis)
    ]);

    return {
      experience: experienceScore,
      skills: skillsScore,
      education: educationScore,
      summary: summaryScore
    };
  }

  private async scoreExperienceSection(
    experience: ParsedDocument['parsedSections']['experience'],
    jobAnalysis: JobAnalysis
  ): Promise<SectionScore> {
    if (!experience || experience.length === 0) {
      return {
        score: 0,
        feedback: 'No experience section found',
        keywordDensity: 0,
        qualityScore: 0,
        suggestions: ['Add work experience with detailed descriptions']
      };
    }

    let totalScore = 0;
    let keywordMatches = 0;
    let totalKeywords = jobAnalysis.keywords.keywords.length;
    const suggestions: string[] = [];

    for (const exp of experience) {
      let expScore = 50; // Base score

      // Check for quantified achievements
      if (this.hasQuantifiedResults(exp.description + ' ' + exp.highlights.join(' '))) {
        expScore += 20;
      } else {
        suggestions.push(`Add quantified results to ${exp.position} role`);
      }

      // Check for relevant keywords
      const expText = (exp.description + ' ' + exp.highlights.join(' ')).toLowerCase();
      const relevantKeywords = jobAnalysis.keywords.keywords.filter(k => 
        expText.includes(k.term.toLowerCase()) || 
        k.variations.some(v => expText.includes(v.toLowerCase()))
      );
      
      keywordMatches += relevantKeywords.length;
      if (relevantKeywords.length > 2) {
        expScore += 15;
      }

      // Check for action verbs
      if (this.hasStrongActionVerbs(exp.highlights)) {
        expScore += 10;
      } else {
        suggestions.push(`Use stronger action verbs in ${exp.position} achievements`);
      }

      totalScore += Math.min(100, expScore);
    }

    const avgScore = totalScore / experience.length;
    const keywordDensity = (keywordMatches / totalKeywords) * 100;

    return {
      score: Math.round(avgScore),
      feedback: `Experience section shows ${experience.length} roles with ${keywordDensity.toFixed(1)}% keyword coverage`,
      keywordDensity,
      qualityScore: this.calculateQualityScore(experience),
      suggestions: suggestions.slice(0, 3) // Limit suggestions
    };
  }

  private async scoreSkillsSection(
    skills: string[],
    jobAnalysis: JobAnalysis
  ): Promise<SectionScore> {
    if (!skills || skills.length === 0) {
      return {
        score: 0,
        feedback: 'No skills section found',
        keywordDensity: 0,
        qualityScore: 0,
        suggestions: ['Add a skills section with relevant technical and soft skills']
      };
    }

    const skillsText = skills.join(' ').toLowerCase();
    const relevantSkills = jobAnalysis.keywords.keywords.filter(k => 
      k.category === 'hard_skill' || k.category === 'soft_skill' || k.category === 'tool'
    );

    const matchedSkills = relevantSkills.filter(skill => 
      skillsText.includes(skill.term.toLowerCase()) ||
      skill.variations.some(v => skillsText.includes(v.toLowerCase()))
    );

    const keywordDensity = relevantSkills.length > 0 ? (matchedSkills.length / relevantSkills.length) * 100 : 0;
    const score = Math.min(100, (keywordDensity * 0.8) + (skills.length > 5 ? 20 : skills.length * 4));

    const suggestions: string[] = [];
    if (keywordDensity < 50) {
      suggestions.push('Add more job-relevant technical skills');
    }
    if (skills.length < 8) {
      suggestions.push('Include both technical and soft skills');
    }

    return {
      score: Math.round(score),
      feedback: `Skills section contains ${skills.length} skills with ${keywordDensity.toFixed(1)}% job relevance`,
      keywordDensity,
      qualityScore: Math.min(100, skills.length * 10),
      suggestions
    };
  }

  private async scoreEducationSection(
    education: ParsedDocument['parsedSections']['education'],
    jobAnalysis: JobAnalysis
  ): Promise<SectionScore> {
    if (!education || education.length === 0) {
      return {
        score: 30, // Not always critical
        feedback: 'No education section found',
        keywordDensity: 0,
        qualityScore: 0,
        suggestions: ['Consider adding education background if relevant']
      };
    }

    let score = 60; // Base score for having education
    const suggestions: string[] = [];

    // Check for relevant degrees/fields
    const educationText = education.map(e => `${e.degree} ${e.field} ${e.institution}`).join(' ').toLowerCase();
    const relevantEducation = jobAnalysis.keywords.keywords.filter(k => 
      k.category === 'certification' || educationText.includes(k.term.toLowerCase())
    );

    if (relevantEducation.length > 0) {
      score += 25;
    }

    // Check for completeness
    const hasCompleteInfo = education.every(e => e.degree && e.institution);
    if (hasCompleteInfo) {
      score += 15;
    } else {
      suggestions.push('Ensure all education entries have degree and institution');
    }

    return {
      score: Math.min(100, score),
      feedback: `Education section shows ${education.length} entries`,
      keywordDensity: (relevantEducation.length / Math.max(1, jobAnalysis.keywords.keywords.length)) * 100,
      qualityScore: hasCompleteInfo ? 100 : 70,
      suggestions
    };
  }

  private async scoreSummarySection(
    summary: string,
    jobAnalysis: JobAnalysis
  ): Promise<SectionScore> {
    if (!summary || summary.trim().length === 0) {
      return {
        score: 0,
        feedback: 'No professional summary found',
        keywordDensity: 0,
        qualityScore: 0,
        suggestions: ['Add a compelling professional summary (2-3 sentences)']
      };
    }

    let score = 40; // Base score for having summary
    const summaryLower = summary.toLowerCase();
    const suggestions: string[] = [];

    // Check length (ideal: 50-150 words)
    const wordCount = summary.split(' ').length;
    if (wordCount >= 30 && wordCount <= 100) {
      score += 20;
    } else if (wordCount < 30) {
      suggestions.push('Expand summary to 30-100 words for better impact');
    } else {
      suggestions.push('Shorten summary to 30-100 words for better readability');
    }

    // Check for relevant keywords
    const relevantKeywords = jobAnalysis.keywords.keywords.filter(k => 
      summaryLower.includes(k.term.toLowerCase()) ||
      k.variations.some(v => summaryLower.includes(v.toLowerCase()))
    );

    const keywordDensity = (relevantKeywords.length / jobAnalysis.keywords.keywords.length) * 100;
    if (keywordDensity > 10) {
      score += 25;
    } else {
      suggestions.push('Include more job-relevant keywords in summary');
    }

    // Check for quantified achievements
    if (this.hasQuantifiedResults(summary)) {
      score += 15;
    } else {
      suggestions.push('Include quantified achievements in summary');
    }

    return {
      score: Math.min(100, score),
      feedback: `Professional summary is ${wordCount} words with ${keywordDensity.toFixed(1)}% keyword relevance`,
      keywordDensity,
      qualityScore: Math.min(100, (wordCount / 75) * 100),
      suggestions
    };
  }

  private generateInsights(
    keywordAnalysis: AnalysisResult['keywordMatches'],
    sectionScores: AnalysisResult['sectionScores'],
    similarityScore: number
  ): AnalysisResult['insights'] {
    const strengthAreas: string[] = [];
    const improvementAreas: string[] = [];
    const keywordGaps: string[] = [];
    const competitiveAdvantages: string[] = [];

    // Analyze section strengths
    Object.entries(sectionScores).forEach(([section, score]) => {
      if (score.score >= 80) {
        strengthAreas.push(`Strong ${section} section (${score.score}%)`);
      } else if (score.score < 60) {
        improvementAreas.push(`${section} section needs improvement (${score.score}%)`);
      }
    });

    // Analyze keyword performance
    const totalKeywords = keywordAnalysis.matched.length + keywordAnalysis.missing.length + keywordAnalysis.partial.length;
    const matchRate = totalKeywords > 0 ? (keywordAnalysis.matched.length / totalKeywords) * 100 : 0;

    if (matchRate >= 70) {
      strengthAreas.push(`High keyword match rate (${matchRate.toFixed(1)}%)`);
    } else if (matchRate < 40) {
      improvementAreas.push(`Low keyword coverage (${matchRate.toFixed(1)}%)`);
    }

    // Identify critical missing keywords
    keywordGaps.push(...keywordAnalysis.missing
      .filter(k => k.importance >= 8)
      .slice(0, 5)
      .map(k => k.term)
    );

    // Identify competitive advantages
    const highValueMatches = keywordAnalysis.matched.filter(k => k.importance >= 8);
    if (highValueMatches.length > 0) {
      competitiveAdvantages.push(`Strong in high-value skills: ${highValueMatches.slice(0, 3).map(k => k.term).join(', ')}`);
    }

    if (similarityScore >= 0.8) {
      competitiveAdvantages.push('High semantic alignment with job requirements');
    }

    return {
      strengthAreas,
      improvementAreas,
      keywordGaps,
      competitiveAdvantages
    };
  }

  private async generateRecommendations(
    resume: ParsedDocument,
    jobDescription: string,
    keywordAnalysis: AnalysisResult['keywordMatches'],
    sectionScores: AnalysisResult['sectionScores']
  ): Promise<AIImprovement[]> {
    const missingKeywords = keywordAnalysis.missing
      .filter(k => k.importance >= 7)
      .slice(0, 10)
      .map(k => k.term);

    try {
      return await this.openaiService.suggestImprovements(
        resume.rawText,
        jobDescription,
        missingKeywords
      );
    } catch (error) {
      console.error('Failed to generate AI recommendations:', error);
      return this.generateFallbackRecommendations(keywordAnalysis, sectionScores);
    }
  }

  private generateFallbackRecommendations(
    keywordAnalysis: AnalysisResult['keywordMatches'],
    sectionScores: AnalysisResult['sectionScores']
  ): AIImprovement[] {
    const recommendations: AIImprovement[] = [];

    // Add recommendations based on missing keywords
    if (keywordAnalysis.missing.length > 0) {
      const topMissing = keywordAnalysis.missing.slice(0, 3);
      recommendations.push({
        section: 'skills',
        type: 'add',
        suggestion: `Add missing key skills: ${topMissing.map(k => k.term).join(', ')}`,
        reasoning: 'These skills are highly valued in the job description',
        impact: 15,
        keywords: topMissing.map(k => k.term)
      });
    }

    // Add recommendations based on section scores
    if (sectionScores.experience.score < 70) {
      recommendations.push({
        section: 'experience',
        type: 'modify',
        suggestion: 'Add quantified achievements and impact metrics to work experience',
        reasoning: 'Quantified results demonstrate concrete value to employers',
        impact: 20,
        keywords: []
      });
    }

    return recommendations;
  }

  private calculateOverallScore(data: {
    keywordAnalysis: AnalysisResult['keywordMatches'];
    similarityScore: number;
    atsCompatibility: AnalysisResult['atsCompatibility'];
    sectionScores: AnalysisResult['sectionScores'];
  }): number {
    const totalKeywords = data.keywordAnalysis.matched.length + 
                         data.keywordAnalysis.missing.length + 
                         data.keywordAnalysis.partial.length;
    
    const keywordScore = totalKeywords > 0 ? 
      ((data.keywordAnalysis.matched.length + (data.keywordAnalysis.partial.length * 0.5)) / totalKeywords) * 100 : 0;
    
    const semanticScore = data.similarityScore * 100;
    const atsScore = data.atsCompatibility.score;
    
    const sectionAvg = Object.values(data.sectionScores)
      .reduce((sum, section) => sum + section.score, 0) / Object.keys(data.sectionScores).length;

    // Weighted average: keyword matching (30%), semantic similarity (25%), ATS compatibility (25%), sections (20%)
    return Math.round(
      (keywordScore * 0.30) + 
      (semanticScore * 0.25) + 
      (atsScore * 0.25) + 
      (sectionAvg * 0.20)
    );
  }

  // Helper methods
  private categorizeRequirements(keywords: ExtractedKeywords): JobAnalysis['requirements'] {
    const critical = keywords.keywords.filter(k => k.importance >= 9).map(k => k.term);
    const preferred = keywords.keywords.filter(k => k.importance >= 7 && k.importance < 9).map(k => k.term);
    const niceToHave = keywords.keywords.filter(k => k.importance < 7).map(k => k.term);

    return { critical, preferred, niceToHave };
  }

  private determineExperienceLevel(jobDescription: string): JobAnalysis['experienceLevel'] {
    const text = jobDescription.toLowerCase();
    if (text.includes('entry level') || text.includes('junior') || text.includes('0-2 years')) {
      return 'entry';
    } else if (text.includes('senior') || text.includes('lead') || text.includes('7+ years')) {
      return 'senior';
    } else if (text.includes('director') || text.includes('vp') || text.includes('executive')) {
      return 'executive';
    }
    return 'mid';
  }

  private extractIndustryContext(jobDescription: string): string {
    // Simple keyword-based industry detection
    const text = jobDescription.toLowerCase();
    if (text.includes('software') || text.includes('technology')) return 'Technology';
    if (text.includes('finance') || text.includes('banking')) return 'Finance';
    if (text.includes('healthcare') || text.includes('medical')) return 'Healthcare';
    if (text.includes('marketing') || text.includes('advertising')) return 'Marketing';
    return 'General';
  }

  private calculateKeywordFrequency(text: string, keywords: string[]): number {
    return keywords.reduce((count, keyword) => {
      const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
      const matches = text.match(regex);
      return count + (matches ? matches.length : 0);
    }, 0);
  }

  private async checkContextualMatch(resume: ParsedDocument, keyword: string, category: string): Promise<boolean> {
    // Simple contextual check based on section placement
    const sections = resume.parsedSections;
    
    switch (category) {
      case 'hard_skill':
      case 'tool':
        return sections.skills.some(skill => skill.toLowerCase().includes(keyword.toLowerCase()));
      case 'responsibility':
        return sections.experience.some(exp => 
          exp.description.toLowerCase().includes(keyword.toLowerCase()) ||
          exp.highlights.some(h => h.toLowerCase().includes(keyword.toLowerCase()))
        );
      default:
        return false;
    }
  }

  private hasComplexFormatting(text: string): boolean {
    // Check for common complex formatting indicators
    const indicators = [
      /\s{4,}/g,  // Multiple spaces
      /\t{2,}/g,  // Multiple tabs
      /[^\x20-\x7E\s]/g,  // Non-ASCII characters
    ];
    
    return indicators.some(regex => regex.test(text));
  }

  private hasStandardSections(text: string): boolean {
    const standardHeaders = [
      /\bexperience\b/i,
      /\beducation\b/i,
      /\bskills\b/i,
      /\bsummary\b/i,
      /\bcontact\b/i
    ];
    
    return standardHeaders.filter(regex => regex.test(text)).length >= 3;
  }

  private isContentTooSparse(text: string): boolean {
    return text.split(' ').length < 200;
  }

  private hasQuantifiedResults(text: string): boolean {
    const quantifiers = [
      /\d+%/g,
      /\$\d+/g,
      /\d+\+/g,
      /\d+k/gi,
      /\d+m/gi,
      /\d+ million/gi,
      /increased.*\d+/gi,
      /decreased.*\d+/gi,
      /improved.*\d+/gi
    ];
    
    return quantifiers.some(regex => regex.test(text));
  }

  private hasStrongActionVerbs(highlights: string[]): boolean {
    const strongVerbs = [
      'achieved', 'developed', 'implemented', 'led', 'managed', 'created',
      'improved', 'increased', 'reduced', 'optimized', 'delivered', 'built',
      'designed', 'launched', 'scaled', 'drove', 'established', 'executed'
    ];
    
    const text = highlights.join(' ').toLowerCase();
    return strongVerbs.some(verb => text.includes(verb));
  }

  private calculateQualityScore(experience: ParsedDocument['parsedSections']['experience']): number {
    if (!experience || experience.length === 0) return 0;
    
    let totalScore = 0;
    for (const exp of experience) {
      let score = 0;
      
      if (exp.company && exp.position) score += 25;
      if (exp.duration) score += 15;
      if (exp.description.length > 50) score += 20;
      if (exp.highlights.length > 0) score += 25;
      if (this.hasQuantifiedResults(exp.description + ' ' + exp.highlights.join(' '))) score += 15;
      
      totalScore += score;
    }
    
    return totalScore / experience.length;
  }

  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }

  clearCache(): void {
    this.cache.clear();
  }
}