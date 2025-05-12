import { useState } from 'react';

interface OptimizationProgress {
  status: 'started' | 'progress' | 'complete' | 'error';
  step?: string;
  data?: any;
  error?: string;
}

export function ResumeOptimizer() {
  const [progress, setProgress] = useState<OptimizationProgress | null>(null);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const optimizeResume = async (resumeText: string, jobDescription: string) => {
    try {
      setProgress({ status: 'started' });
      setError(null);
      setResult(null);

      const response = await fetch('/api/optimize-resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeText, jobDescription }),
      });
      // Handle quota or other errors
      if (!response.ok) {
        if (response.status === 402) {
          setError('You’ve reached your free-tier limit. Please upgrade to continue optimizing.');
          return;
        }
        const errText = await response.text();
        throw new Error(errText || 'Failed to optimize resume');
      }
      const reader = response.body?.getReader();
      if (!reader) throw new Error('No reader available');

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        // Parse the streamed data
        const text = new TextDecoder().decode(value);
        const updates = text.split('\n').filter(Boolean).map(JSON.parse);

        for (const update of updates) {
          if (update.status === 'error') {
            setError(update.error);
            return;
          }

          if (update.status === 'complete') {
            setResult(update.data);
            return;
          }

          // Update progress
          setProgress(update);
        }
      }
    } catch (error) {
      setError(error.message);
    }
  };

  return (
    <div>
      {error && (
        <div className="error-message">
          Error: {error}
        </div>
      )}
      
      {progress && (
        <div className="progress-indicator">
          {progress.step && (
            <div className="step">
              {progress.step.split('_').map(word => 
                word.charAt(0).toUpperCase() + word.slice(1)
              ).join(' ')}
            </div>
          )}
          {progress.data?.workIndex !== undefined && (
            <div className="bullet-progress">
              Processing bullet {progress.data.bulletIndex + 1} of work experience {progress.data.workIndex + 1}
            </div>
          )}
        </div>
      )}
      
      {result && (
        <div className="optimization-result">
          {/* Display the optimized resume */}
          <pre>{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </div>
  );
} 