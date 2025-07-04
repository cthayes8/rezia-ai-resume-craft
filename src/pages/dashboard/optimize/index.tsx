"use client";
import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import ResumeUpload from '@/components/dashboard/ResumeUpload';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

/**
 * /dashboard/optimize
 * Gated optimize page: free users only get one run
 */
export default function OptimizePage() {
  const [loading, setLoading] = useState(true);
  const [blocked, setBlocked] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { isLoaded } = useAuth();
  useEffect(() => {
    if (!isLoaded) return;
    // If returning from Stripe Checkout, sync the session immediately
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get('session_id');
    if (sessionId) {
      fetch(`/api/stripe/sync-session?session_id=${sessionId}`)
        .then(() => {
          // remove session_id param from URL
          const newUrl = window.location.pathname;
          window.history.replaceState({}, '', newUrl);
        })
        .catch(err => console.error('Sync error', err));
    }
    // Always check user quota/plan from our API
    fetch('/api/quota-status')
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Failed to check quota');
        }
        // Block only free-tier users with no runs remaining
        if (data.plan === 'free' && data.freeRunsRemaining <= 0) {
          setBlocked(true);
        }
      })
      .catch((err) => {
        console.error('Quota check error:', err);
        setError(err.message || 'Error checking quota');
      })
      .finally(() => setLoading(false));
  }, [isLoaded]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="animate-spin h-8 w-8 text-gray-500" />
        </div>
      </DashboardLayout>
    );
  }
  if (error) {
    return (
      <DashboardLayout>
        <div className="max-w-lg mx-auto bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <h2 className="text-lg font-semibold text-red-800">Error</h2>
          <p className="mt-2 text-red-600">{error}</p>
        </div>
      </DashboardLayout>
    );
  }
  if (blocked) {
    return (
      <DashboardLayout>
        <div className="max-w-lg mx-auto bg-white p-8 rounded-lg shadow text-center">
          <h2 className="text-2xl font-semibold mb-4">Free Trial Limit Reached</h2>
          <p className="text-gray-600 mb-6">
            You’ve used your free resume optimization. Upgrade to a paid plan to continue optimizing unlimited resumes.
          </p>
          <Button
            className="px-6 py-2 bg-reslo-blue text-white rounded-md hover:bg-reslo-blue/90"
            onClick={() => { window.location.href = '/dashboard/account/billing'; }}
          >
            Manage Billing
          </Button>
        </div>
      </DashboardLayout>
    );
  }
  return (
    <DashboardLayout>
      <ResumeUpload />
    </DashboardLayout>
  );
}