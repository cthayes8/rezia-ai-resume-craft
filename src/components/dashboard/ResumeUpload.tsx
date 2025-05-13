"use client";
import { useState, useRef, useEffect } from "react";
// Use mammoth to extract text from .docx files
import * as mammoth from 'mammoth';
// PDF parsing moved to server via /api/pdf-to-text
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Upload, Loader2 } from "lucide-react";
import { useRouter, useSearchParams } from 'next/navigation';
import { useToast } from "@/components/ui/use-toast";
import type { ResumeData } from '@/types/resume';
import { useResumeStore } from '@/lib/stores/resumeStore';

const ResumeUpload = () => {
  const [file, setFile] = useState<File | null>(null);
  const [jobDescription, setJobDescription] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [savedResumes, setSavedResumes] = useState<Array<{ id: string; name: string; content: string; parsedData?: ResumeData | null; createdAt: string }>>([]);
  const [selectedSavedResumeId, setSelectedSavedResumeId] = useState<string>('new');
  // For new uploads: parsed plain text of resume
  const [parsedText, setParsedText] = useState<string | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Replace the router.query useEffect with searchParams
  useEffect(() => {
    if (!searchParams) return;
    const useSavedResumeId = searchParams.get('useSavedResumeId');
    if (useSavedResumeId) {
      setSelectedSavedResumeId(useSavedResumeId);
    }
  }, [searchParams]);

  // Load user-saved resumes
  const loadSavedResumes = async () => {
    try {
      const res = await fetch('/api/saved-resumes');
      if (!res.ok) {
        console.warn('Failed to load saved resumes', res.status, res.statusText);
        return;
      }
      const data = await res.json();
      setSavedResumes(data);
      // If there are saved resumes, default to the first one
      if (data.length > 0) {
        setSelectedSavedResumeId(data[0].id);
      }
    } catch (err) {
      console.error('Error loading saved resumes:', err);
    }
  };
  useEffect(() => { loadSavedResumes(); }, []);
  const { toast } = useToast();
  const {
    setOriginalResumeData,
    setResumeData,
    setJobDescription: setStoreJobDescription,
    setKeywords,
    setTargetTitle,
    setTargetCompany,
    setRequirements,
    setKeywordAssignments,
    setBulletRewrites,
    setSummaryRewrite,
    setSkillsRewrite,
    setLoading,
    setError,
    setProgress
  } = useResumeStore();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    const validTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    if (!validTypes.includes(selectedFile.type)) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload a PDF or Word document.',
        variant: 'destructive',
      });
      return;
    }
    setFile(selectedFile);
    // Parse the resume text immediately upon selection
    setIsParsing(true);
    let text: string;
    try {
      if (selectedFile.name.toLowerCase().endsWith('.docx')) {
        const buf = await selectedFile.arrayBuffer();
        // @ts-ignore mammoth types might be missing
        text = (await mammoth.extractRawText({ arrayBuffer: buf })).value;
      } else if (selectedFile.name.toLowerCase().endsWith('.pdf')) {
        const arrayBuffer = await selectedFile.arrayBuffer();
        const binary = new Uint8Array(arrayBuffer);
        let binaryString = '';
        for (let i = 0; i < binary.length; i++) {
          binaryString += String.fromCharCode(binary[i]);
        }
        const base64 = btoa(binaryString);
        const res = await fetch('/api/pdf-to-text', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pdfBase64: base64 }),
        });
        if (!res.ok) throw new Error('PDF parsing failed');
        const data = await res.json();
        text = data.text;
      } else {
        text = await selectedFile.text();
      }
      setParsedText(text);
      // Optionally save resume for reuse
      try {
        const saveRes = await fetch('/api/saved-resumes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: selectedFile.name, content: text })
        });
        if (saveRes.ok) loadSavedResumes();
      } catch (err) {
        console.warn('Save resume failed', err);
      }
    } catch (err) {
      console.warn('Error extracting resume text:', err);
      // Fallback to raw text
      text = await selectedFile.text();
      setParsedText(text);
    } finally {
      setIsParsing(false);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobDescription.trim()) {
      toast({ title: 'No JD', description: 'Add a job description.', variant: 'destructive' });
      return;
    }
    // Determine source: saved or new upload
    const useNew = selectedSavedResumeId === 'new';
    let text: string;
    let name: string;
    if (useNew) {
      // New upload: ensure file and parsed text ready
      if (!file) {
        toast({ title: 'No file', description: 'Upload a resume file.', variant: 'destructive' });
        return;
      }
      if (isParsing) {
        toast({ title: 'Processing', description: 'Still parsing your resume, please wait.', variant: 'destructive' });
        return;
      }
      if (!parsedText) {
        toast({ title: 'Error', description: 'Could not parse resume text.', variant: 'destructive' });
        return;
      }
      text = parsedText;
      name = file.name;
    } else {
      const saved = savedResumes.find(r => r.id === selectedSavedResumeId);
      if (!saved) {
        toast({ title: 'Error', description: 'Saved resume not found.', variant: 'destructive' });
        return;
      }
      if (saved.parsedData) {
        setStoreJobDescription(jobDescription);
        localStorage.setItem('optimizationRequest', JSON.stringify({ resumeData: saved.parsedData, jobDescription, fileName: saved.name }));
        router.push('/dashboard/optimize/loading');
        return;
      }
      text = saved.content;
      name = saved.name;
    }
    // Kick off optimization: save request and go to loading screen
    setStoreJobDescription(jobDescription);
    localStorage.setItem('optimizationRequest', JSON.stringify({ resumeText: text, jobDescription, fileName: name }));
    router.push('/dashboard/optimize/loading');
  };


  return (
    <div className="w-full max-w-3xl mx-auto p-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Upload Your Resume</h1>
        <p className="mt-2 text-gray-600">
          Upload your resume and paste the job description to get an optimized version
        </p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-8">
        {savedResumes.length > 0 && (
          <div className="space-y-2">
            <Label htmlFor="savedResume">Choose a saved resume (or upload new)</Label>
            <select
              id="savedResume"
              value={selectedSavedResumeId}
              onChange={e => setSelectedSavedResumeId(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-rezia-blue"
            >
              <option value="new">Upload New Resume</option>
              {savedResumes.map(r => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </div>
        )}
        {selectedSavedResumeId === 'new' && (
        <div className="space-y-4">
          <div
            className="border-2 border-dashed border-gray-300 rounded-lg p-6 cursor-pointer hover:border-rezia-blue transition-colors"
            onClick={handleUploadClick}
          >
            <div className="flex flex-col items-center justify-center space-y-3">
              <div className="bg-gray-100 p-3 rounded-full">
                <Upload className="h-8 w-8 text-rezia-blue" />
              </div>
              <div className="text-center">
                <p className="text-lg font-medium text-gray-700">
                  {file ? file.name : "Click to upload your resume"}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  PDF or Word documents up to 10MB
                </p>
              </div>
            </div>
            <Input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
        </div>
        )}
        
        <div className="space-y-2">
          <Label htmlFor="jobDescription">Job Description</Label>
          <Textarea
            id="jobDescription"
            placeholder="Paste the job description here..."
            className="h-40 resize-none"
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
          />
          <p className="text-sm text-gray-500">
            The more complete the job description, the better we can optimize your resume
          </p>
        </div>
        
        <Button
          type="submit"
          className="w-full bg-rezia-blue hover:bg-rezia-blue/90 flex items-center justify-center"
          disabled={isParsing}
        >
          {isParsing ? (
            <>
              <Loader2 className="animate-spin mr-2 h-5 w-5" />
              Parsing resume...
            </>
          ) : (
            'Optimize Resume'
          )}
        </Button>
      </form>
    </div>
  );
};

export default ResumeUpload;
