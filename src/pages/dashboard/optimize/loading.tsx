import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useResumeStore } from '@/lib/stores/resumeStore';

import DashboardLayout from "@/components/dashboard/DashboardLayout";

const LoadingPage = () => {
  const router = useRouter();
  const { progress, error, currentResume } = useResumeStore();

  useEffect(() => {
    // If we have a complete resume, navigate to the results page
    if (currentResume) {
      router.push('/dashboard/optimize/results');
    }
  }, [currentResume, router]);

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
          {progress && (
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-rezia-blue rounded-full animate-pulse" />
                <span className="text-gray-600">
                  {progress.step
                    ?.split('_')
                    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(' ')}
                </span>
              </div>
              {progress.data?.workIndex !== undefined && (
                <div className="text-sm text-gray-500">
                  Processing bullet {progress.data.bulletIndex + 1} of work experience{' '}
                  {progress.data.workIndex + 1}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </DashboardLayout>
  );
};

export default LoadingPage; 