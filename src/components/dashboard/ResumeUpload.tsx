"use client";
import { useState, useRef } from "react";
// Use mammoth to extract text from .docx files
import * as mammoth from 'mammoth';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Upload } from "lucide-react";
import { useRouter } from "next/router";
import { useToast } from "@/components/ui/use-toast";
import { useResumeStore } from '@/lib/stores/resumeStore';

const ResumeUpload = () => {
  const [file, setFile] = useState<File | null>(null);
  const [jobDescription, setJobDescription] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { toast } = useToast();
  const { setCurrentResume, setLoading, setError, setProgress } = useResumeStore();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type === "application/pdf" || 
          selectedFile.type === "application/msword" || 
          selectedFile.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
        setFile(selectedFile);
      } else {
        toast({
          title: "Invalid file type",
          description: "Please upload a PDF or Word document.",
          variant: "destructive",
        });
      }
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file) {
      toast({
        title: "No file selected",
        description: "Please upload your resume.",
        variant: "destructive",
      });
      return;
    }
    
    if (!jobDescription.trim()) {
      toast({
        title: "Job description required",
        description: "Please add the job description.",
        variant: "destructive",
      });
      return;
    }
    
    setIsUploading(true);
    setLoading(true);
    setError(null);
    
    try {
      // Extract text from uploaded file
      let resumeText: string;
      if (file.name.toLowerCase().endsWith('.docx')) {
        try {
          const arrayBuffer = await file.arrayBuffer();
          const { value } = await mammoth.extractRawText({ arrayBuffer });
          resumeText = value;
        } catch (err) {
          console.warn('[ResumeUpload] mammoth extraction failed, falling back to raw text', err);
          resumeText = await file.text();
        }
      } else {
        resumeText = await file.text();
      }
      
      // Call the optimize-resume API
      const response = await fetch('/api/optimize-resume', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          resumeText,
          jobDescription,
          fileName: file.name,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to optimize resume');
      }

      // Get the reader from the response body
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No reader available');
      }

      // Navigate to loading page
      router.push("/dashboard/optimize/loading");

      // Process the stream
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        // Parse the streamed data
        const text = new TextDecoder().decode(value);
        const updates = text.split('\n').filter(Boolean).map((line: string) => JSON.parse(line));

        for (const update of updates) {
          if (update.status === 'error') {
            setError(update.error);
            return;
          }

          if (update.status === 'complete') {
            setCurrentResume(update.data);
            return;
          }

          // Update progress
          setProgress(update);
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to optimize resume. Please try again.",
        variant: "destructive",
      });
      setError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsUploading(false);
      setLoading(false);
    }
  };

  const handleUpload = async (file: File) => {
    try {
      setLoading(true);
      // Extract text from uploaded file (use mammoth for .docx)
      // Extract text from uploaded file (use mammoth for .docx based on filename)
      let resumeText: string;
      if (file.name.toLowerCase().endsWith('.docx')) {
        try {
          const arrayBuffer = await file.arrayBuffer();
          // @ts-ignore mammoth types might be missing
          const { value } = await mammoth.extractRawText({ arrayBuffer });
          resumeText = value;
        } catch (err) {
          console.warn('[ResumeUpload] mammoth extraction failed, falling back to raw text', err);
          resumeText = await file.text();
        }
      } else {
        resumeText = await file.text();
      }
      
      // Call the optimize-resume API
      const response = await fetch('/api/optimize-resume', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          resumeText,
          jobDescription,
          fileName: file.name,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to optimize resume');
      }

      const data = await response.json();
      
      // Store the optimization results in localStorage
      localStorage.setItem('optimizationResults', JSON.stringify(data));
      
      // Navigate to loading page
      router.push("/dashboard/optimize/loading");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to optimize resume. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
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
          className="w-full bg-rezia-blue hover:bg-rezia-blue/90"
          disabled={isUploading}
        >
          {isUploading ? "Optimizing..." : "Optimize Resume"}
        </Button>
      </form>
    </div>
  );
};

export default ResumeUpload;
