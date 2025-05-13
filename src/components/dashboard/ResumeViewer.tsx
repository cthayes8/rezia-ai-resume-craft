import { useState, useEffect } from "react";
import Head from "next/head";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Download, ToggleLeft, ToggleRight, FileText, Loader2 } from "lucide-react";
import { useEditor, EditorContent } from '@tiptap/react';
import { SimpleToolbar } from '@/components/editor/SimpleToolbar';
import { tiptapExtensions } from '@/lib/tiptap';
import { parseEditorJSON } from '@/lib/resumeParser';
import { resumeDataToHTML } from '@/lib/resumeSerializer';
import { useToast } from "@/components/ui/use-toast";
import { Protect } from '@clerk/nextjs';

type ResumeTemplate = "professional" | "modern" | "creative";

interface OptimizationResults {
  runId: string;
  originalResume: any;
  optimizedResume: any;
  keywords: string[];
  requirements: string[];
  targetTitle: string;
  targetCompany: string;
}

const ResumeViewer = () => {
  const [template, setTemplate] = useState<ResumeTemplate>("professional");
  const [showOriginal, setShowOriginal] = useState(false);
  const [optimizationResults, setOptimizationResults] = useState<OptimizationResults | null>(null);
  const [editedResume, setEditedResume] = useState<any>(null);
  // Initialize TipTap editor with serialized resume HTML
  const editor = useEditor({
    extensions: tiptapExtensions,
    content: editedResume ? resumeDataToHTML(editedResume) : '',
    editable: !showOriginal,
  });
  // Two-way binding: update editedResume JSON on editor updates
  useEffect(() => {
    if (!editor) return () => {};
    const handleUpdate = () => {
      const pmJSON = editor.getJSON();
      const newData = parseEditorJSON(pmJSON);
      setEditedResume(newData);
      // Persist updated resume to localStorage
      const stored = localStorage.getItem('optimizationResults');
      if (stored) {
        const parsed = JSON.parse(stored);
        parsed.optimizedResume = newData;
        localStorage.setItem('optimizationResults', JSON.stringify(parsed));
      }
    };
    editor.on('update', handleUpdate);
    return () => editor.off('update', handleUpdate);
  }, [editor]);

  // Load content once on mount and when toggling original/optimized
  useEffect(() => {
    if (!editor || !optimizationResults) return;
    const data = showOriginal
      ? optimizationResults.originalResume
      : optimizationResults.optimizedResume;
    const html = resumeDataToHTML(data);
    editor.commands.setContent(html, false);
  }, [editor, showOriginal, optimizationResults]);
  // Cover letter state
  const [coverLetterUrl, setCoverLetterUrl] = useState<string | null>(null);
  const [isGeneratingCover, setIsGeneratingCover] = useState(false);
  const { toast } = useToast();
  // Determine template CSS class name matching public/templates.css
  const displayTemplateClass =
    template === 'modern'
      ? 'template-modern'
      : template === 'creative'
        ? 'template-tech'
        : 'template-classic';

  useEffect(() => {
    // Load optimization results from localStorage
    const results = localStorage.getItem('optimizationResults');
    if (results) {
      const parsed = JSON.parse(results);
      setOptimizationResults(parsed);
      setEditedResume(parsed.optimizedResume);
    }
  }, []);
  // Fetch any existing cover letter for this run
  useEffect(() => {
    if (!optimizationResults) return;
    fetch(`/api/cover-letters?runId=${optimizationResults.runId}`)
      .then((res) => {
        if (!res.ok) throw new Error('Not found');
        return res.json();
      })
      .then(() => setCoverLetterUrl(`/api/cover-letters/download?runId=${optimizationResults.runId}`))
      .catch(() => {
        /* no existing cover letter */
      });
  }, [optimizationResults]);

  const handleDownload = async () => {
    if (!optimizationResults) return;
    // Determine template ID
    const templateId = template === 'modern'
      ? 2
      : template === 'creative'
        ? 3
        : 1;
    // Choose resume data to send
    const payloadData = showOriginal
      ? optimizationResults.originalResume
      : editedResume;
    try {
      // Use the editor’s HTML output for exact WYSIWYG fidelity
      const html = editor ? editor.getHTML() : resumeDataToHTML(payloadData);
      const response = await fetch('/api/generate-docx-html', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ html, templateId }),
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to generate DOCX');
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'resume.docx';
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast({
        title: 'Resume download started',
        description: 'Your resume is being downloaded.',
      });
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: 'Error',
        description: 'Download failed. Please try again.',
        variant: 'destructive',
      });
    }
  };
  // Generate or download cover letter
  const handleGenerateCoverLetter = async () => {
    if (!optimizationResults) return;
    setIsGeneratingCover(true);
    try {
      const res = await fetch('/api/generate-cover-letter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ runId: optimizationResults.runId }),
      });
      // Handle plan gating for cover letter
      if (res.status === 402) {
        toast({
          title: 'Upgrade to Premium',
          description: 'Upgrade to Premium to generate cover letters.',
        });
        setIsGeneratingCover(false);
        return;
      }
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || 'Failed to generate cover letter');
      }
      await res.json();
      // Set download endpoint for the newly created cover letter
      setCoverLetterUrl(`/api/cover-letters/download?runId=${optimizationResults.runId}`);
      toast({ title: 'Cover letter ready', description: 'Your cover letter is available for download.' });
    } catch (error: any) {
      console.error('Cover letter error:', error);
      toast({ title: 'Error', description: error.message || 'Generation failed.', variant: 'destructive' });
    } finally {
      setIsGeneratingCover(false);
    }
  };
  // Edit contact fields (email, phone, link)
  const handleContactEdit = (field: 'email' | 'phone' | 'link', value: string) => {
    if (!editedResume || !optimizationResults) return;
    const newResume = {
      ...editedResume,
      contact: {
        ...editedResume.contact,
        [field]: value
      }
    };
    setEditedResume(newResume);
    const updatedResults = {
      ...optimizationResults,
      optimizedResume: newResume
    };
    localStorage.setItem('optimizationResults', JSON.stringify(updatedResults));
  };

  const toggleResume = () => {
    setShowOriginal(!showOriginal);
  };

  const handleTextEdit = (
    section: string,
    value: string,
    workIndex?: number,
    bulletIndex?: number
  ) => {
    if (!editedResume) return;

    const newResume = { ...editedResume };
    
    if (workIndex !== undefined && bulletIndex !== undefined) {
      // Edit work bullet
      newResume.work[workIndex].bullets[bulletIndex] = value;
    } else if (workIndex !== undefined) {
      // Edit work title/company
      const [field, newValue] = value.split('|');
      newResume.work[workIndex][field] = newValue;
    } else if (section === 'skills') {
      // Edit skills
      newResume.skills = value.split(',').map((s: string) => s.trim());
    } else {
      // Edit other sections
      newResume[section] = value;
    }

    setEditedResume(newResume);
    
    // Update localStorage
    const updatedResults = {
      ...optimizationResults!,
      optimizedResume: newResume
    };
    localStorage.setItem('optimizationResults', JSON.stringify(updatedResults));
  };

  // Helper function to create editable content
  const EditableContent = ({ 
    content, 
    onChange, 
    className = "",
    multiline = false 
  }: { 
    content: string, 
    onChange: (value: string) => void,
    className?: string,
    multiline?: boolean
  }) => {
    return multiline ? (
      <div
        contentEditable
        suppressContentEditableWarning
        className={`outline-none focus:ring-1 focus:ring-rezia-blue rounded px-1 -mx-1 whitespace-pre-wrap ${className}`}
        onBlur={(e) => onChange(e.currentTarget.innerText)}
        dangerouslySetInnerHTML={{ __html: content }}
      />
    ) : (
      <span
        contentEditable
        suppressContentEditableWarning
        className={`outline-none focus:ring-1 focus:ring-rezia-blue rounded px-1 -mx-1 ${className}`}
        onBlur={(e) => onChange(e.currentTarget.innerText)}
        dangerouslySetInnerHTML={{ __html: content }}
      />
    );
  };

  // Helper function to render work experience
  const renderWorkExperience = (work: any[]) => {
    return work.map((job, index) => (
      <div key={index} className="job-entry">
        <div className="job-meta">
          <EditableContent
            content={job.title}
            onChange={(value) => handleTextEdit('work', `title|${value}`, index)}
            className="font-bold"
          />
          <div className="text-rezia-blue italic">
            <EditableContent
              content={job.company}
              onChange={(value) => handleTextEdit('work', `company|${value}`, index)}
            />
            {' ('}
            <EditableContent
              content={job.from}
              onChange={(value) => handleTextEdit('work', `from|${value}`, index)}
            />
            {' - '}
            <EditableContent
              content={job.to}
              onChange={(value) => handleTextEdit('work', `to|${value}`, index)}
            />
            {')'}
          </div>
        </div>
        <ul className="list-disc pl-5 mt-2 text-sm space-y-1">
          {job.bullets.map((bullet: string, i: number) => (
            <li key={i}>
              <EditableContent
                content={bullet}
                onChange={(value) => handleTextEdit('work', value, index, i)}
              />
            </li>
          ))}
        </ul>
      </div>
    ));
  };

  // Helper function to render education
  const renderEducation = (education: any[]) => {
    return education.map((edu, index) => (
      <div key={index} className="mt-2">
        <div className="flex justify-between">
          <EditableContent
            content={edu.degree}
            onChange={(value) => handleTextEdit('education', `degree|${value}`, index)}
            className="font-medium"
          />
          <div className="text-sm text-gray-600">
            <EditableContent
              content={edu.from}
              onChange={(value) => handleTextEdit('education', `from|${value}`, index)}
            />
            {'-'}
            <EditableContent
              content={edu.to}
              onChange={(value) => handleTextEdit('education', `to|${value}`, index)}
            />
          </div>
        </div>
        <EditableContent
          content={edu.institution}
          onChange={(value) => handleTextEdit('education', `institution|${value}`, index)}
          className="text-sm"
        />
      </div>
    ));
  };

  // Helper function to render skills
  const renderSkills = (skills: string[]) => {
    return (
      <EditableContent
        content={skills.join(', ')}
        onChange={(value) => handleTextEdit('skills', value)}
        className="mt-2 text-sm"
      />
    );
  };

  // Render resume content based on template
  const renderResumeContent = () => {
    if (!optimizationResults) return null;

    const resumeData = showOriginal 
      ? optimizationResults.originalResume 
      : optimizationResults.optimizedResume;

    switch (template) {
      case "modern":
        return (
          <div className="p-8 bg-white border rounded-lg">
            <div className="border-l-4 border-rezia-blue pl-4">
              <h2 className="text-2xl font-bold">{resumeData.name}</h2>
              <div className="text-sm text-gray-600 mt-1 flex flex-wrap items-center space-x-1">
                <EditableContent
                  content={resumeData.contact.email || ''}
                  onChange={(v) => handleContactEdit('email', v)}
                  className="inline"
                />
                <span>|</span>
                <EditableContent
                  content={resumeData.contact.phone || ''}
                  onChange={(v) => handleContactEdit('phone', v)}
                  className="inline"
                />
                <span>|</span>
                <EditableContent
                  content={resumeData.contact.link || ''}
                  onChange={(v) => handleContactEdit('link', v)}
                  className="inline"
                />
              </div>
            </div>
            
            <div className="mt-6 space-y-6">
              {resumeData.summary && (
                <div>
                  <h3 className="text-lg font-semibold text-rezia-blue">Summary</h3>
                  <EditableContent
                    content={resumeData.summary || ''}
                    onChange={(v) => handleTextEdit('summary', v)}
                    className="mt-2 text-sm"
                    multiline
                  />
                </div>
              )}
              
              <div>
                <h3 className="text-lg font-semibold text-rezia-blue">Experience</h3>
                {renderWorkExperience(resumeData.work)}
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-rezia-blue">Education</h3>
                {renderEducation(resumeData.education)}
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-rezia-blue">Skills</h3>
                {renderSkills(resumeData.skills)}
              </div>

              {resumeData.certifications?.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-rezia-blue">Certifications</h3>
                  <ul className="list-disc pl-5 mt-2 text-sm">
                    {resumeData.certifications.map((cert: string, i: number) => (
                      <li key={i}>{cert}</li>
                    ))}
                  </ul>
                </div>
              )}
              {resumeData.projects?.length > 0 && (
                <div className="mt-8">
                  <h3 className="text-lg font-semibold text-rezia-blue">Projects</h3>
                  <div className="space-y-4 mt-2">
                    {resumeData.projects.map((proj: { name: string; description: string; technologies?: string[] }, idx: number) => (
                      <div key={idx} className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-medium text-gray-800">{proj.name}</h4>
                        <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">{proj.description}</p>
                        {proj.technologies && proj.technologies.length > 0 && (
                          <p className="text-xs text-gray-500 mt-2">
                            Technologies: {proj.technologies.join(', ')}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      case "creative":
        return (
          <div className="p-8 bg-gradient-to-br from-gray-50 to-white border rounded-lg">
            <div className="text-center mb-6">
              <h2 className="text-3xl font-bold">{resumeData.name}</h2>
              <div className="flex justify-center gap-4 mt-2 text-sm text-gray-600">
                <EditableContent
                  content={resumeData.contact.email || ''}
                  onChange={(v) => handleContactEdit('email', v)}
                  className=""
                />
                <span>•</span>
                <EditableContent
                  content={resumeData.contact.phone || ''}
                  onChange={(v) => handleContactEdit('phone', v)}
                  className=""
                />
                <span>•</span>
                <EditableContent
                  content={resumeData.contact.link || ''}
                  onChange={(v) => handleContactEdit('link', v)}
                  className=""
                />
              </div>
            </div>
            
            {resumeData.summary && (
              <div className="mb-8 text-center">
                <EditableContent
                  content={resumeData.summary || ''}
                  onChange={(v) => handleTextEdit('summary', v)}
                  className="text-sm text-gray-700"
                  multiline
                />
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2">
                <h3 className="font-bold text-lg pb-2 border-b-2 border-rezia-blue">Experience</h3>
                {renderWorkExperience(resumeData.work)}
              </div>
              
              <div>
                <h3 className="font-bold text-lg pb-2 border-b-2 border-rezia-blue">Skills & Education</h3>
                <div className="mt-4 space-y-4">
                  <div>
                    <p className="font-medium">Skills</p>
                    {renderSkills(resumeData.skills)}
                  </div>
                  <div>
                    <p className="font-medium">Education</p>
                    {renderEducation(resumeData.education)}
                  </div>
                  {resumeData.certifications?.length > 0 && (
                    <div>
                      <p className="font-medium">Certifications</p>
                      <ul className="list-disc pl-5 mt-2 text-sm">
                        {resumeData.certifications.map((cert: string, i: number) => (
                          <li key={i}>{cert}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );

      default: // professional template
        return (
          <div className="p-8 bg-white border rounded-lg">
            {/* Header with name and stacked contact */}
            <div className="header">
              <div className="name">{resumeData.name}</div>
              <div className="contact">
                <div>
                  <EditableContent
                    content={resumeData.contact.email || ''}
                    onChange={(v) => handleContactEdit('email', v)}
                  />
                </div>
                <div>
                  <EditableContent
                    content={resumeData.contact.phone || ''}
                    onChange={(v) => handleContactEdit('phone', v)}
                  />
                </div>
                <div>
                  <EditableContent
                    content={resumeData.contact.link || ''}
                    onChange={(v) => handleContactEdit('link', v)}
                  />
                </div>
              </div>
            </div>
            {/* Summary section */}
            {resumeData.summary && (
              <section>
                <h2>Professional Summary</h2>
                <EditableContent
                  content={resumeData.summary || ''}
                  onChange={(v) => handleTextEdit('summary', v)}
                  multiline
                />
              </section>
            )}
            {/* Work Experience */}
            <section>
              <h2>Work Experience</h2>
              {renderWorkExperience(resumeData.work)}
            </section>
            {/* Education */}
            <section>
              <h2>Education</h2>
              {renderEducation(resumeData.education)}
            </section>
            {/* Skills */}
            <section>
              <h2>Skills</h2>
              {renderSkills(resumeData.skills)}
            </section>
            {/* Certifications */}
            {resumeData.certifications?.length > 0 && (
              <section>
                <h2>Certifications</h2>
                <ul>
                  {resumeData.certifications.map((cert: string, i: number) => (
                    <li key={i}>{cert}</li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        );
    }
  };

  return (
    <>
      {/* Load PDF CSS for true WYSIWYG preview */}
      <Head>
        <link rel="stylesheet" href="/templates.css" />
      </Head>
      {/* Centered paper container */}
      <div className="flex justify-center py-8">
        <div className="w-full max-w-4xl">
          {/* Non-document controls above the paper */}
          <div className="flex flex-col lg:flex-row justify-between items-center mb-6 gap-4">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-800 mr-6">Your Resume</h1>
              <button
                className="flex items-center text-sm text-gray-600 hover:text-rezia-blue transition-colors"
                onClick={toggleResume}
              >
                {showOriginal ? (
                  <>
                    <ToggleRight className="h-5 w-5 mr-1" />
                    <span>Showing Original</span>
                  </>
                ) : (
                  <>
                    <ToggleLeft className="h-5 w-5 mr-1" />
                    <span>Showing Optimized</span>
                  </>
                )}
              </button>
            </div>
            <div className="flex items-center gap-4">
              {!showOriginal && (
                <Select value={template} onValueChange={(value) => setTemplate(value as ResumeTemplate)}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select template" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="professional">Professional</SelectItem>
                    <SelectItem value="modern">Modern</SelectItem>
                    <SelectItem value="creative">Creative</SelectItem>
                  </SelectContent>
                </Select>
              )}
              <Button
                className="bg-rezia-blue hover:bg-rezia-blue/90 flex items-center gap-2"
                onClick={handleDownload}
              >
                <Download className="h-4 w-4" />
                <span>Download</span>
              </Button>
              {!showOriginal && (
                <Protect plan="rezia_premium" fallback={null}>
                  {coverLetterUrl ? (
                    <Button
                      variant="outline"
                      className="flex items-center gap-2"
                      onClick={() => window.open(coverLetterUrl, '_blank')}
                    >
                      <FileText className="h-4 w-4" />
                      <span>Download Cover Letter</span>
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      className="flex items-center gap-2"
                      onClick={handleGenerateCoverLetter}
                      disabled={isGeneratingCover}
                    >
                      {isGeneratingCover ? (
                        <Loader2 className="animate-spin h-4 w-4" />
                      ) : (
                        <FileText className="h-4 w-4" />
                      )}
                      <span>{isGeneratingCover ? 'Generating...' : 'Get Cover Letter'}</span>
                    </Button>
                  )}
                </Protect>
              )}
            </div>
          </div>
          {/* Paper wrapper */}
          <div className="relative bg-white shadow-lg rounded-lg overflow-hidden">
            {/* Floating toolbar */}
            <div className="sticky top-0 z-10 bg-white border-b border-gray-200">
              <SimpleToolbar editor={editor} />
            </div>
            {/* Document content using classic fonts */}
            <div className={`p-6 font-serif leading-relaxed ${displayTemplateClass}`}>
              {editor ? (
                <EditorContent editor={editor} />
              ) : (
                <div>Loading editor...</div>
              )}
            </div>
          </div>
        </div>
      </div>
  </>
  );
};

export default ResumeViewer;

