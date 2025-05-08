export interface Contact {
  email: string;
  phone?: string;
  link?: string;
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

export interface OptimizationResult {
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
  keywords: string[];
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