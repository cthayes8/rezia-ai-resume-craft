"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from 'lucide-react';
// Static tips to show while loading
const loadingTips = [
  'Tip: Use action verbs like “Led”, “Designed”, or “Improved” in your bullets.',
  'Did you know? Keeping bullets under 20 words improves readability.',
  'Tip: Quantify impact with numbers (e.g. “Increased sales by 30%”).',
  'Did you know? Placing the most relevant experience first catches the eye.',
  'Tip: Tailor your summary to the target role for better ATS matches.',
  'Did you know? Consistent tense and formatting make your resume look polished.',
  'Tip: Highlight promotions or awards to showcase growth.',
  'Did you know? Overloading keywords can look spammy to recruiters.',
  'Tip: Use past tense for previous roles and present tense for current roles.',
  'Did you know? A concise one-page resume often outperforms longer formats.'
];
// Estimated duration in seconds for countdown display (reflects full optimize time)
const ESTIMATED_DURATION = 40;

const LoadingPage = () => {
  const router = useRouter();
  const { toast } = useToast();
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [tipIndex, setTipIndex] = useState(0);
  const [remaining, setRemaining] = useState(ESTIMATED_DURATION);

  useEffect(() => {
    // Retrieve pending request
    const reqStr = localStorage.getItem('optimizationRequest');
    if (!reqStr) {
      router.push('/dashboard');
      return;
    }
    const { resumeText, resumeData, jobDescription, fileName, templateId } = JSON.parse(reqStr);
    // Start optimization API call
    // Build payload: always include resumeText; include resumeData to skip parsing
    const payload: any = { resumeText, jobDescription, fileName };
    if (resumeData) payload.resumeData = resumeData;
    if (templateId) payload.templateId = templateId;
    fetch('/api/optimize-resume', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
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

  // Rotate loading tips every 5 seconds
  useEffect(() => {
    const tipTimer = setInterval(() => {
      setTipIndex(i => (i + 1) % loadingTips.length);
    }, 5000);
    return () => clearInterval(tipTimer);
  }, []);

  // Countdown estimated time remaining
  useEffect(() => {
    const countdown = setInterval(() => {
      setRemaining(r => {
        if (r <= 1) {
          clearInterval(countdown);
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(countdown);
  }, []);

  return (
    <DashboardLayout>
      {error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-red-800">Error</h2>
          <p className="mt-2 text-red-600">{error}</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          {/* Animated spinner */}
          <div className="flex justify-center">
            <Loader2 className="animate-spin h-10 w-10 text-blue-500" />
          </div>
          {/* Title */}
          <h2 className="text-2xl font-semibold text-gray-800 text-center">
            Optimizing Your Resume
          </h2>
          {/* Progress bar */}
          <Progress value={progress} className="h-2" />
          {/* Status message */}
          <p className="text-gray-600 text-center">
            {progress < 100
              ? 'Please wait while we tailor your resume...'
              : 'Finalizing...'}
          </p>
          {/* Countdown timer */}
          <p className="text-sm text-gray-500 text-center">
            {remaining > 0
              ? `Estimated time remaining: ${remaining}s`
              : 'Almost there...'}
          </p>
          {/* Rotating tip */}
          <p className="text-sm italic text-gray-500 text-center">
            {loadingTips[tipIndex]}
          </p>
        </div>
      )}
    </DashboardLayout>
  );
};

export default LoadingPage;