import { create } from 'zustand';
import { ResumeData, OptimizationResult } from '@/types/resume';

interface OptimizationProgress {
  status: 'started' | 'progress' | 'complete' | 'error';
  step?: string;
  data?: any;
  error?: string;
}

interface ResumeStore {
  currentResume: ResumeData | null;
  optimizationResult: OptimizationResult | null;
  isLoading: boolean;
  error: string | null;
  progress: OptimizationProgress | null;
  setCurrentResume: (resume: ResumeData) => void;
  setOptimizationResult: (result: OptimizationResult) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setProgress: (progress: OptimizationProgress) => void;
  reset: () => void;
}

export const useResumeStore = create<ResumeStore>((set) => ({
  currentResume: null,
  optimizationResult: null,
  isLoading: false,
  error: null,
  progress: null,
  setCurrentResume: (resume) => set({ currentResume: resume }),
  setOptimizationResult: (result) => set({ optimizationResult: result }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  setProgress: (progress) => set({ progress }),
  reset: () => set({
    currentResume: null,
    optimizationResult: null,
    isLoading: false,
    error: null,
    progress: null,
  }),
})); 