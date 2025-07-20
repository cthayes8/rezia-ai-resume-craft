export interface Contact {
  email: string;
  phone?: string;
  /**
   * URLs to contact: e.g. personal website, LinkedIn, etc.
   */
  links?: string[];
  location?: {
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
  };
  profiles?: SocialProfile[];
}

export interface SocialProfile {
  platform: string;
  username: string;
  url: string;
}

export interface WorkExperience {
  company: string;
  title: string;
  from?: string;
  to?: string;
  bullets: string[];
}

export interface Education {
  institution: string;
  degree: string;
  field?: string;
  from?: string;
  to?: string;
  gpa?: string;
}

export interface Award {
  title: string;
  date?: string;
  description?: string;
}

export interface Certification {
  name: string;
  issuer?: string;
  date?: string;
  expiryDate?: string;
}

export interface Project {
  name: string;
  description: string;
  technologies: string[];
  link?: string;
}

export interface ResumeData {
  name: string;
  contact: Contact;
  summary: string;
  skills: string[];
  work: WorkExperience[];
  education: Education[];
  awards?: Award[];
  certifications?: Certification[];
  projects?: Project[];
  languages?: string[];
}

// New unified resume model for the platform
export interface UnifiedResume {
  id: string;
  userId: string;
  version: number;
  
  // Builder data (visual resume creation)
  builder: {
    metadata: {
      title: string;
      template: string;
      fontSize: number;
      fontFamily: string;
      color: ColorScheme;
      layout: 'single' | 'double';
      spacing: {
        page: number;
        section: number;
        paragraph: number;
      };
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
      custom: CustomSection[];
    };
    sectionOrder: string[];
    visibility: Record<string, boolean>;
  };
  
  // Optimizer data (ATS optimization)
  optimization: {
    targetJobs: TargetJob[];
    analysis: {
      lastRun: Date | null;
      atsScore: number;
      keywordMatches: KeywordAnalysis;
      improvements: Improvement[];
      issues: ATSIssue[];
    };
    embeddings: {
      resume: number[];
      sections: Record<string, number[]>;
    };
  };
  
  // Shared features
  sharing: {
    public: boolean;
    url?: string;
    password?: string;
    analytics: ViewAnalytics;
  };
  
  timestamps: {
    created: Date;
    modified: Date;
    analyzed: Date | null;
    published?: Date;
  };
}

// Enhanced data types for the unified platform
export interface ColorScheme {
  primary: string;
  accent: string;
  text: string;
  background: string;
}

export interface BasicInfo {
  firstName: string;
  lastName: string;
  headline: string;
  email: string;
  phone: string;
  website?: string;
  location: {
    address?: string;
    city: string;
    region: string;
    postalCode?: string;
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

export interface Summary {
  content: string;
}

export interface Experience {
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

export interface SkillGroup {
  name: string;
  items: {
    name: string;
    level?: number;
    keywords?: string[];
  }[];
}

export interface Language {
  name: string;
  fluency: string;
}

export interface CustomSection {
  id: string;
  title: string;
  content: string;
  items?: any[];
}

export interface TargetJob {
  id: string;
  title: string;
  company: string;
  description: string;
  url?: string;
  keywords: ExtractedKeywords;
  embedding: number[];
  matchScore?: number;
  applied?: boolean;
  appliedDate?: Date;
}

export interface ExtractedKeywords {
  hard_skills: string[];
  soft_skills: string[];
  qualifications: string[];
  industry_terms: string[];
}

export interface KeywordAnalysis {
  matched: KeywordMatch[];
  missing: KeywordMatch[];
  partial: KeywordMatch[];
}

export interface KeywordMatch {
  keyword: string;
  importance: number;
  variations: string[];
  foundIn: string[];
}

export interface Improvement {
  type: 'fix' | 'enhance' | 'add';
  priority: 'high' | 'medium' | 'low';
  section: string;
  title: string;
  description: string;
  impact: number;
  implementation?: any;
}

export interface ATSIssue {
  severity: 'critical' | 'warning' | 'minor';
  category: 'parsing' | 'formatting' | 'structure' | 'content';
  title: string;
  description: string;
  impact: number;
  suggestion: string;
}

export interface ViewAnalytics {
  views: number;
  downloads: number;
  lastViewed: Date | null;
  shares: ShareEvent[];
}

export interface ShareEvent {
  timestamp: Date;
  platform: string;
  referrer?: string;
}

export interface LegacyOptimizationResult {
  runId: string;
  originalResume: ResumeData;
  optimizedResume: ResumeData;
  keywords: string[];
  requirements: string[];
  targetTitle: string;
  targetCompany: string;
}

export interface KeywordAssignment {
  workIndex: number;
  bulletIndex: number;
  assignedKeywords: string[];
}

export interface BulletRewriteResult {
  workIndex: number;
  bulletIndex: number;
  rewrittenBullet: string;
  keywordsUsed: string[];
}

export interface ExtractJDInfoResponse {
  targetTitle: string;
  targetCompany: string;
  requirements: string[];
}

export interface ParseResumeResponse {
  parsedResume: ResumeData;
}

export interface MapKeywordsResponse {
  assignments: KeywordAssignment[];
}

export interface RewriteBulletResponse {
  rewrittenBullet: string;
  keywordsUsed: string[];
}

export interface RewriteSummaryResponse {
  rewrittenSummary: string;
}

export interface RewriteSkillsResponse {
  rewrittenSkills: string[];
}

export interface OptimizationRunData {
  userId: string;
  resumeFileId: string;
  jobDescription: string;
  templateId: string;
  originalText: string;
  optimizedText: string;
  bulletRewrites: BulletRewriteResult[];
  summaryRewrite: string;
  skillsRewrite: string;
  keywords: string[];
  requirements: string[];
  targetTitle: string;
  targetCompany: string;
  aiModel: string;
  tokenCount: number;
  costUsd: number;
}

// Additional types for the unified platform
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
}

export interface Typography {
  headingFont: string;
  bodyFont: string;
  fontSize: {
    name: string;
    heading: string;
    subheading: string;
    body: string;
  };
}

export interface SectionLayout {
  id: string;
  type: string;
  column: 0 | 1; // For 2-column layouts
  order: number;
  customTitle?: string;
}

export interface OptimizationResult {
  resume: UnifiedResume;
  targetJob: TargetJob;
  analysis: KeywordAnalysis;
  matchScore: number;
  newScore: number;
  improvement: number;
  keywordsAdded: number;
  resumeUrl: string;
  resumeId: string;
} 