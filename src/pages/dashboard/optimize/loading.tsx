"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/components/ui/use-toast";

const LoadingPage = () => {
  const router = useRouter();
  const { toast } = useToast();
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Retrieve pending request
    const reqStr = localStorage.getItem('optimizationRequest');
    if (!reqStr) {
      router.push('/dashboard');
      return;
    }
    const { resumeText, jobDescription, fileName } = JSON.parse(reqStr);
    // Start optimization API call
    fetch('/api/optimize-resume', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resumeText, jobDescription, fileName })
    })
      .then(async res => {
        if (!res.ok) {
          const msg = await res.text();
          throw new Error(msg || 'Optimization failed');
        }
        return res.json();
      })
      .then(data => {
        // Store results and clear request
        localStorage.setItem('optimizationResults', JSON.stringify(data));
        localStorage.removeItem('optimizationRequest');
        // Complete progress and navigate to results
        setProgress(100);
        router.push('/dashboard/optimize/results');
      })
      .catch(err => {
        console.error('Optimize error:', err);
        setError(err.message);
        toast({ title: 'Error', description: err.message, variant: 'destructive' });
      });
    // Simulate incremental progress based on estimated API phase timing
    const timers: NodeJS.Timeout[] = [];
    // After extract-jd-info (~4s)
    timers.push(setTimeout(() => setProgress(10), 4000));
    // After parse-resume (~4.2s)
    timers.push(setTimeout(() => setProgress(20), 4200));
    // After map-keywords (~9s)
    timers.push(setTimeout(() => setProgress(40), 9200));
    // After rewrite-bullets (~30s)
    timers.push(setTimeout(() => setProgress(80), 30000));
    // After rewrite-summary (~33s)
    timers.push(setTimeout(() => setProgress(90), 33000));
    // After rewrite-skills (~35s)
    timers.push(setTimeout(() => setProgress(95), 35000));
    // Cleanup on unmount
    return () => timers.forEach(t => clearTimeout(t));
  // Run once on mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <DashboardLayout>
      {error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-red-800">Error</h2>
          <p className="mt-2 text-red-600">{error}</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            Optimizing Your Resume
          </h2>
          <Progress value={progress} className="h-2 mb-4" />
          <p className="text-gray-600">
            {progress < 100
              ? 'Please wait while we tailor your resume...'
              : 'Finalizing...'}
          </p>
        </div>
      )}
    </DashboardLayout>
  );
};

export default LoadingPage;