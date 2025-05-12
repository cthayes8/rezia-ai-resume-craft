"use client";
"use client";
import React, { useState, useEffect, useRef } from 'react';
import type { ResumeData } from '@/types/resume';
import { Loader2 } from 'lucide-react';
import * as mammoth from 'mammoth';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { FileText, Trash2, Upload } from 'lucide-react';
import { useRouter } from 'next/navigation';

// Saved resume with cached parsedData
type SavedResume = {
  id: string;
  name: string;
  content: string;
  parsedData?: ResumeData | null;
  createdAt: string;
};

const SavedResumesPage = () => {
  const router = useRouter();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [saved, setSaved] = useState<SavedResume[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const loadSaved = async () => {
    try {
      const res = await fetch('/api/saved-resumes');
      if (!res.ok) throw new Error('Failed to load saved resumes');
      const data: SavedResume[] = await res.json();
      // format date
      const formatted = data.map(r => ({
        ...r,
        createdAt: new Date(r.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
      }));
      setSaved(formatted);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error loading saved resumes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadSaved(); }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this saved resume?')) return;
    try {
      const res = await fetch(`/api/saved-resumes/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      setSaved(prev => prev.filter(r => r.id !== id));
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Error deleting');
    }
  };

  const handleUse = async (id: string) => {
    // Use saved resume's raw content for optimization
    try {
      const res = await fetch(`/api/saved-resumes/${id}`);
      if (!res.ok) throw new Error('Resume not found');
      const rec = await res.json() as SavedResume;
      // Prepare payload: always include raw text, plus parsedData if available
      const payload: any = {
        resumeText: rec.content,
        jobDescription: '',
        fileName: rec.name,
      };
      if (rec.parsedData) {
        payload.resumeData = rec.parsedData;
      }
      localStorage.setItem('optimizationRequest', JSON.stringify(payload));
      router.push('/dashboard/optimize/loading');
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Unable to load resume', variant: 'destructive' });
    }
  };
  // Handle file upload to save a new resume
  const handleUploadClick = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // extract plain text
    let text = '';
    setIsSaving(true);
    try {
      if (file.name.toLowerCase().endsWith('.docx')) {
        const buf = await file.arrayBuffer();
        // @ts-ignore mammoth types might be missing
        text = (await mammoth.extractRawText({ arrayBuffer: buf })).value;
      } else if (file.name.toLowerCase().endsWith('.pdf')) {
        // Extract text via server-side PDF-to-text API
        const arrayBuffer = await file.arrayBuffer();
        const binary = new Uint8Array(arrayBuffer);
        let binaryString = '';
        for (let i = 0; i < binary.length; i++) {
          binaryString += String.fromCharCode(binary[i]);
        }
        const base64 = btoa(binaryString);
        const resText = await fetch('/api/pdf-to-text', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pdfBase64: base64 }),
        });
        if (!resText.ok) throw new Error('PDF text extraction failed');
        const json = await resText.json();
        text = json.text;
      } else {
        text = await file.text();
      }
    } catch (err) {
      console.warn('Text extraction failed, using raw text', err);
      text = await file.text();
    }
    try {
      const res = await fetch('/api/saved-resumes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: file.name, content: text })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Save failed');
      }
      toast({ title: 'Resume saved', description: file.name });
      loadSaved();
    } catch (err: any) {
      console.error('Save resume error', err);
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading saved resumes...</div>;
  }
  if (error) {
    return <div className="text-center py-12 text-red-500">{error}</div>;
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Saved Resumes</h1>
        <p className="text-gray-600 mt-1">
          Manage the resumes you’ve saved (up to 3)
        </p>
      </div>
      {/* Upload widget for saving a new resume */}
      {saved.length < 3 && (
        <div
          className="border-2 border-dashed border-gray-300 rounded-lg p-6 mb-6 cursor-pointer hover:border-rezia-blue transition-colors text-center"
          onClick={isSaving ? undefined : handleUploadClick}
        >
          {isSaving ? (
            <div className="flex flex-col items-center space-y-2">
              <Loader2 className="h-8 w-8 text-rezia-blue animate-spin" />
              <p className="text-lg font-medium text-gray-700">Saving resume...</p>
            </div>
          ) : (
            <>
              <div className="flex flex-col items-center space-y-2">
                <Upload className="h-8 w-8 text-rezia-blue" />
                <p className="text-lg font-medium text-gray-700">Click to upload a resume to save</p>
                <p className="text-sm text-gray-500">PDF or Word documents up to 10MB</p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx"
                className="hidden"
                onChange={handleFileChange}
                disabled={isSaving}
              />
            </>
          )}
        </div>
      )}
      {saved.length > 0 ? (
        <div className="space-y-4 max-h-[60vh] overflow-y-auto">
          {saved.map(item => (
            <div key={item.id} className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <FileText className="h-6 w-6 text-rezia-blue" />
                  </div>
                  <div>
                    <h3 className="font-medium">{item.name}</h3>
                    <p className="text-xs text-gray-500 mt-1">Saved on {item.createdAt}</p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-1 text-xs h-8 text-red-500 hover:text-red-600 hover:border-red-200 hover:bg-red-50"
                    onClick={() => handleDelete(item.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="hidden sm:inline">Delete</span>
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <div className="bg-gray-100 p-3 rounded-full inline-flex mx-auto mb-4">
            <FileText className="h-8 w-8 text-gray-500" />
          </div>
          <h3 className="text-xl font-medium text-gray-700">No saved resumes</h3>
          <p className="text-gray-500 mt-1 mb-6">
            You haven’t saved any resumes yet
          </p>
          <Button
            className="bg-rezia-blue hover:bg-rezia-blue/90"
            onClick={() => router.push('/dashboard')}
          >
            Upload Your First Resume
          </Button>
        </div>
      )}
    </div>
  );
};

export default SavedResumesPage;