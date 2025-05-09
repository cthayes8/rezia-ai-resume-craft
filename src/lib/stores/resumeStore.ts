import { create } from 'zustand';
import { ResumeData } from '@/types/resume';

// Metadata types for resume optimization steps
type KeywordAssignment = {
  workIndex: number;
  bulletIndex: number;
  assignedKeywords: string[];
};

type BulletRewriteMetadata = {
  workIndex: number;
  bulletIndex: number;
  originalBullet: string;
  rewrittenBullet: string;
  diff: string;
  keywordsUsed: string[];
};

type SummaryRewriteMetadata = {
  originalSummary: string;
  rewrittenSummary: string;
  diff: string;
  keywordsUsed: string[];
};

type SkillsRewriteMetadata = {
  originalSkills: string[];
  rewrittenSkills: string[];
  diff: string;
  keywordsUsed: string[];
};

// State shape for resume optimization
interface ResumeState {
  originalResumeData: ResumeData | null;           // Parsed resume before optimization
  resumeData: ResumeData | null;                   // Final optimized resume
  jobDescription: string;                          // User-provided JD
  consent: boolean;                                // Data processing consent flag
  atsScore: number | null;                         // ATS match score
  keywords: string[];                              // Extracted keywords from JD
  targetTitle: string;                             // Job title from JD
  targetCompany: string;                           // Company from JD
  requirements: string[];                          // Requirements from JD
  keywordAssignments: KeywordAssignment[];         // Assigned keywords per bullet
  bulletRewrites: BulletRewriteMetadata[];         // Bullet rewrite metadata
  summaryRewrite: SummaryRewriteMetadata | null;   // Summary rewrite metadata
  skillsRewrite: SkillsRewriteMetadata | null;     // Skills rewrite metadata
  templateId: number;                              // Selected resume template

  setOriginalResumeData: (data: ResumeData | null) => void;
  setResumeData: (data: ResumeData | null) => void;
  setJobDescription: (desc: string) => void;
  setConsent: (consent: boolean) => void;
  setAtsScore: (score: number) => void;
  setKeywords: (keywords: string[]) => void;
  setTargetTitle: (title: string) => void;
  setTargetCompany: (company: string) => void;
  setRequirements: (reqs: string[]) => void;
  setKeywordAssignments: (assignments: KeywordAssignment[]) => void;
  setBulletRewrites: (rewrites: BulletRewriteMetadata[]) => void;
  setSummaryRewrite: (sr: SummaryRewriteMetadata) => void;
  setSkillsRewrite: (sr: SkillsRewriteMetadata) => void;
  setTemplateId: (id: number) => void;
  // Optimization process status & control
  isLoading: boolean;                               // Running status
  error: string | null;                             // Error message if any
  progress: {                                      // Current step progress
    status: 'started' | 'progress' | 'complete' | 'error';
    step?: string;
    data?: any;
    error?: string;
  } | null;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setProgress: (progress: { status: 'started' | 'progress' | 'complete' | 'error'; step?: string; data?: any; error?: string }) => void;
}

export const useResumeStore = create<ResumeState>((set) => ({
  originalResumeData: null,
  resumeData: null,
  jobDescription: '',
  consent: false,
  atsScore: null,
  keywords: [],
  targetTitle: '',
  targetCompany: '',
  requirements: [],
  keywordAssignments: [],
  bulletRewrites: [],
  summaryRewrite: null,
  skillsRewrite: null,
  templateId: 1,
  // Process status fields
  isLoading: false,
  error: null,
  progress: null,

  setOriginalResumeData: (data) => set({ originalResumeData: data }),
  setResumeData: (data) => set({ resumeData: data }),
  setJobDescription: (desc) => set({ jobDescription: desc }),
  setConsent: (consent) => set({ consent }),
  setAtsScore: (score) => set({ atsScore: score }),
  setKeywords: (keywords) => set({ keywords }),
  setTargetTitle: (title) => set({ targetTitle: title }),
  setTargetCompany: (company) => set({ targetCompany: company }),
  setRequirements: (reqs) => set({ requirements: reqs }),
  setKeywordAssignments: (assignments) => set({ keywordAssignments: assignments }),
  setBulletRewrites: (rewrites) => set({ bulletRewrites: rewrites }),
  setSummaryRewrite: (sr) => set({ summaryRewrite: sr }),
  setSkillsRewrite: (sr) => set({ skillsRewrite: sr }),
  setTemplateId: (id) => set({ templateId: id }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  setProgress: (progress) => set({ progress }),
}));