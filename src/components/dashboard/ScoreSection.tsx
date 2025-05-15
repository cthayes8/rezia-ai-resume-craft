import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
// Takeaway type
interface Takeaway { title: string; description: string; level: 'info'|'success'|'warning'|'error' }
import { ScoreSectionUI } from './ScoreSectionUI';

export interface ScoreSectionProps {
  runId: string;
  showOriginal?: boolean;
}

interface ScoreMetric {
  name: string;
  originalScore: number;
  optimizedScore: number;
}

interface Scorecard {
  overallScore: number;
  metrics: ScoreMetric[];
}
export const ScoreSection: React.FC<ScoreSectionProps> = ({ runId, showOriginal = false }) => {
  // Fetch both optimized and original overall scores plus metrics
  // Fetch both optimized and original scores + metrics
  const { data, isLoading, error } = useQuery<{
    overallScore: number;
    originalOverallScore: number;
    metrics: ScoreMetric[];
    redFlags: string[];
  }, Error>({
    queryKey: ['score', runId],
    queryFn: async () => {
      const res = await fetch('/api/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ runId }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error((json as any).error || 'Failed to fetch score');
      }
      return res.json();
    },
    enabled: !!runId,
    staleTime: Infinity,
  });
  // Fetch LLM-generated takeaways
  const { data: takeawaysData, isLoading: isTakeawaysLoading } = useQuery<any>({
    queryKey: ['takeaways', runId],
    queryFn: async () => {
      const res = await fetch('/api/key-takeaways', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ runId }),
      });
      if (!res.ok) {
        throw new Error('Failed to fetch takeaways');
      }
      return res.json();
    },
    enabled: !!runId,
    staleTime: Infinity,
  });
  if (isLoading) {
    return (
      <div className="sticky top-0 z-20 bg-white/80 backdrop-blur border-b flex items-center px-6 py-3 shadow-sm">
        <Loader2 className="animate-spin mr-2 h-5 w-5 text-gray-500" />
        <span className="text-gray-500">Scoring resume...</span>
      </div>
    );
  }
  if (error || !data) {
    return (
      <div className="sticky top-0 z-20 bg-red-50 border-b border-red-200 flex items-center px-6 py-3">
        <p className="text-red-600">Error loading score{error ? `: ${error.message}` : ''}</p>
      </div>
    );
  }
  // Determine which overall score to display
  const displayedScore = showOriginal ? data.originalOverallScore : data.overallScore;
  return (
    <ScoreSectionUI
      overallScore={displayedScore}
      metrics={data.metrics}
      showOriginal={showOriginal}
      takeaways={takeawaysData?.takeaways}
      isTakeawaysLoading={isTakeawaysLoading}
      redFlags={data.redFlags}
    />
  );
};
