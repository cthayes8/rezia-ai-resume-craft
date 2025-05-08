import { useResumeStore } from '@/lib/stores/resumeStore';

export function OptimizeResume() {
  const { currentResume, setOptimizationResult, setLoading, setError } = useResumeStore();

  const handleOptimize = async (jobDescription: string) => {
    if (!currentResume) return;

    try {
      setLoading(true);
      const response = await fetch('/api/optimize-resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resumeText: JSON.stringify(currentResume),
          jobDescription,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to optimize resume');
      }

      const result = await response.json();
      setOptimizationResult(result);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // ... rest of the component
} 