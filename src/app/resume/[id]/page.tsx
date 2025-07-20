'use client';

import React, { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { UnifiedResumeEditor } from '@/components/unified/UnifiedResumeEditor';
import { useUnifiedResumeStore } from '@/lib/stores/unifiedResumeStore';

export default function ResumeEditorPage() {
  const params = useParams();
  const resumeId = params.id as string;
  
  const { createResume, resumes } = useUnifiedResumeStore();

  useEffect(() => {
    // If resumeId is 'new', create a new resume
    if (resumeId === 'new') {
      createResume().then((newId) => {
        // In a real app, you would navigate to the new resume ID
        window.history.replaceState({}, '', `/resume/${newId}`);
      });
    }
  }, [resumeId, createResume]);

  // Show loading state for new resumes
  if (resumeId === 'new') {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4" />
          <p>Creating your new resume...</p>
        </div>
      </div>
    );
  }

  return <UnifiedResumeEditor resumeId={resumeId} />;
}