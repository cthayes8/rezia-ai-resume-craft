'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter,
  DialogTrigger,
  DialogClose
} from '@/components/ui/dialog';
import { 
  Plus, 
  Trash2, 
  Sparkles, 
  AlertCircle,
  CheckCircle,
  MapPin,
  Phone,
  Mail,
  Globe,
  Calendar,
  Wand2
} from 'lucide-react';

import { UnifiedResume, Improvement, BasicInfo, Summary, Experience, Education, SkillGroup, Project, Certification, Language, CustomSection } from '@/types/resume';
import { useUnifiedResumeStore } from '@/lib/stores/unifiedResumeStore';
import { AIRewritePanel } from './AIRewritePanel';

interface SectionEditorProps {
  sectionType: string;
  data: any;
  onChange: (newData: any) => void;
  suggestions?: Improvement[];
  resume: UnifiedResume;
}

export const SectionEditor: React.FC<SectionEditorProps> = ({
  sectionType,
  data,
  onChange,
  suggestions = [],
  resume
}) => {
  const [showSuggestions, setShowSuggestions] = useState(suggestions.length > 0);
  const [showAIRewrite, setShowAIRewrite] = useState(false);
  const [aiRewriteField, setAIRewriteField] = useState<string>('');
  const { applySuggestion, removeCustomSection } = useUnifiedResumeStore();

  const handleApplySuggestion = async (suggestion: Improvement) => {
    await applySuggestion(suggestion);
    // The suggestion should now be applied to the data
  };

  const renderBasicsEditor = (basics: BasicInfo) => (
    <div className="space-y-6">
      {/* Name */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="firstName">First Name</Label>
          <Input
            id="firstName"
            value={basics.firstName || ''}
            onChange={(e) => onChange({ ...basics, firstName: e.target.value })}
            placeholder="John"
          />
        </div>
        <div>
          <Label htmlFor="lastName">Last Name</Label>
          <Input
            id="lastName"
            value={basics.lastName || ''}
            onChange={(e) => onChange({ ...basics, lastName: e.target.value })}
            placeholder="Doe"
          />
        </div>
      </div>

      {/* Headline */}
      <div>
        <Label htmlFor="headline">Professional Headline</Label>
        <Input
          id="headline"
          value={basics.headline || ''}
          onChange={(e) => onChange({ ...basics, headline: e.target.value })}
          placeholder="Senior Software Engineer"
        />
      </div>

      {/* Contact Information */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="email" className="flex items-center gap-2">
            <Mail className="w-4 h-4" />
            Email
          </Label>
          <Input
            id="email"
            type="email"
            value={basics.email || ''}
            onChange={(e) => onChange({ ...basics, email: e.target.value })}
            placeholder="john.doe@email.com"
          />
        </div>
        <div>
          <Label htmlFor="phone" className="flex items-center gap-2">
            <Phone className="w-4 h-4" />
            Phone
          </Label>
          <Input
            id="phone"
            value={basics.phone || ''}
            onChange={(e) => onChange({ ...basics, phone: e.target.value })}
            placeholder="+1 (555) 123-4567"
          />
        </div>
      </div>

      {/* Location */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="city" className="flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            City
          </Label>
          <Input
            id="city"
            value={basics.location?.city || ''}
            onChange={(e) => onChange({ 
              ...basics, 
              location: { ...basics.location, city: e.target.value }
            })}
            placeholder="San Francisco"
          />
        </div>
        <div>
          <Label htmlFor="region">State/Region</Label>
          <Input
            id="region"
            value={basics.location?.region || ''}
            onChange={(e) => onChange({ 
              ...basics, 
              location: { ...basics.location, region: e.target.value }
            })}
            placeholder="CA"
          />
        </div>
      </div>

      {/* Website */}
      <div>
        <Label htmlFor="website" className="flex items-center gap-2">
          <Globe className="w-4 h-4" />
          Website/Portfolio
        </Label>
        <Input
          id="website"
          value={basics.website || ''}
          onChange={(e) => onChange({ ...basics, website: e.target.value })}
          placeholder="https://johndoe.dev"
        />
      </div>
    </div>
  );

  const renderSummaryEditor = (summary: Summary) => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label htmlFor="summary">Professional Summary</Label>
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            setAIRewriteField('summary');
            setShowAIRewrite(true);
          }}
          className="flex items-center gap-2"
        >
          <Wand2 className="w-4 h-4" />
          AI Rewrite
        </Button>
      </div>
      
      {showAIRewrite && aiRewriteField === 'summary' ? (
        <AIRewritePanel
          sectionType="summary"
          currentContent={summary?.content || ''}
          resume={resume}
          onApply={(newContent) => {
            onChange({ content: newContent });
            setShowAIRewrite(false);
            setAIRewriteField('');
          }}
          onCancel={() => {
            setShowAIRewrite(false);
            setAIRewriteField('');
          }}
        />
      ) : (
        <>
          <Textarea
            id="summary"
            value={summary?.content || ''}
            onChange={(e) => onChange({ content: e.target.value })}
            placeholder="Write a compelling summary of your professional background, key skills, and career objectives..."
            className="min-h-32"
          />
          <p className="text-sm text-gray-600">
            Tip: Keep it concise (2-3 sentences) and highlight your most relevant achievements.
          </p>
        </>
      )}
    </div>
  );

  const renderExperienceEditor = (experiences: Experience[]) => {
    const addExperience = () => {
      const newExperience: Experience = {
        id: crypto.randomUUID(),
        company: '',
        position: '',
        startDate: '',
        endDate: '',
        current: false,
        summary: '',
        highlights: [''],
        keywords: []
      };
      onChange([...experiences, newExperience]);
    };

    const updateExperience = (index: number, updatedExp: Experience) => {
      const updated = [...experiences];
      updated[index] = updatedExp;
      onChange(updated);
    };

    const removeExperience = (index: number) => {
      const updated = experiences.filter((_, i) => i !== index);
      onChange(updated);
    };

    const addHighlight = (expIndex: number) => {
      const updated = [...experiences];
      updated[expIndex].highlights.push('');
      onChange(updated);
    };

    const updateHighlight = (expIndex: number, highlightIndex: number, value: string) => {
      const updated = [...experiences];
      updated[expIndex].highlights[highlightIndex] = value;
      onChange(updated);
    };

    const removeHighlight = (expIndex: number, highlightIndex: number) => {
      const updated = [...experiences];
      updated[expIndex].highlights = updated[expIndex].highlights.filter((_, i) => i !== highlightIndex);
      onChange(updated);
    };

    return (
      <div className="space-y-6 pb-8">
        {experiences.map((exp, expIndex) => (
          <Card key={exp.id} className="relative">
            <CardHeader className="pb-4">
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg">Experience {expIndex + 1}</CardTitle>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => removeExperience(expIndex)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Company and Position */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor={`company-${expIndex}`}>Company</Label>
                  <Input
                    id={`company-${expIndex}`}
                    value={exp.company}
                    onChange={(e) => updateExperience(expIndex, { ...exp, company: e.target.value })}
                    placeholder="Acme Corporation"
                  />
                </div>
                <div>
                  <Label htmlFor={`position-${expIndex}`}>Position</Label>
                  <Input
                    id={`position-${expIndex}`}
                    value={exp.position}
                    onChange={(e) => updateExperience(expIndex, { ...exp, position: e.target.value })}
                    placeholder="Senior Software Engineer"
                  />
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-3 gap-4 items-end">
                <div>
                  <Label htmlFor={`startDate-${expIndex}`} className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Start Date
                  </Label>
                  <Input
                    id={`startDate-${expIndex}`}
                    type="month"
                    value={exp.startDate}
                    onChange={(e) => updateExperience(expIndex, { ...exp, startDate: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor={`endDate-${expIndex}`}>End Date</Label>
                  <Input
                    id={`endDate-${expIndex}`}
                    type="month"
                    value={exp.endDate || ''}
                    onChange={(e) => updateExperience(expIndex, { ...exp, endDate: e.target.value })}
                    disabled={exp.current}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id={`current-${expIndex}`}
                    checked={exp.current}
                    onChange={(e) => updateExperience(expIndex, { 
                      ...exp, 
                      current: e.target.checked,
                      endDate: e.target.checked ? '' : exp.endDate
                    })}
                    className="rounded"
                  />
                  <Label htmlFor={`current-${expIndex}`} className="text-sm">
                    Current position
                  </Label>
                </div>
              </div>

              {/* Summary */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor={`summary-${expIndex}`}>Role Summary</Label>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setAIRewriteField(`experience-${expIndex}-summary`);
                      setShowAIRewrite(true);
                    }}
                    className="flex items-center gap-1"
                  >
                    <Wand2 className="w-3 h-3" />
                    AI Rewrite
                  </Button>
                </div>
                
                {showAIRewrite && aiRewriteField === `experience-${expIndex}-summary` ? (
                  <AIRewritePanel
                    sectionType="experience"
                    currentContent={exp.summary}
                    resume={resume}
                    onApply={(newContent) => {
                      updateExperience(expIndex, { ...exp, summary: newContent });
                      setShowAIRewrite(false);
                      setAIRewriteField('');
                    }}
                    onCancel={() => {
                      setShowAIRewrite(false);
                      setAIRewriteField('');
                    }}
                  />
                ) : (
                  <Textarea
                    id={`summary-${expIndex}`}
                    value={exp.summary}
                    onChange={(e) => updateExperience(expIndex, { ...exp, summary: e.target.value })}
                    placeholder="Brief description of your role and responsibilities..."
                    className="min-h-20"
                  />
                )}
              </div>

              {/* Highlights */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <Label>Key Achievements</Label>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => addHighlight(expIndex)}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Achievement
                  </Button>
                </div>
                <div className="space-y-2">
                  {exp.highlights.map((highlight, highlightIndex) => (
                    <div key={highlightIndex} className="space-y-2">
                      {showAIRewrite && aiRewriteField === `experience-${expIndex}-highlight-${highlightIndex}` ? (
                        <AIRewritePanel
                          sectionType="experience"
                          currentContent={highlight}
                          resume={resume}
                          onApply={(newContent) => {
                            updateHighlight(expIndex, highlightIndex, newContent);
                            setShowAIRewrite(false);
                            setAIRewriteField('');
                          }}
                          onCancel={() => {
                            setShowAIRewrite(false);
                            setAIRewriteField('');
                          }}
                        />
                      ) : (
                        <div className="flex gap-2">
                          <div className="flex-1">
                            <Textarea
                              value={highlight}
                              onChange={(e) => updateHighlight(expIndex, highlightIndex, e.target.value)}
                              placeholder="• Increased team productivity by 40% through implementation of automated testing..."
                              className="min-h-16"
                            />
                            {highlight.trim() && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setAIRewriteField(`experience-${expIndex}-highlight-${highlightIndex}`);
                                  setShowAIRewrite(true);
                                }}
                                className="mt-1 text-xs h-6 px-2"
                              >
                                <Wand2 className="w-3 h-3 mr-1" />
                                AI Enhance
                              </Button>
                            )}
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => removeHighlight(expIndex, highlightIndex)}
                            className="text-red-600 hover:text-red-700 px-2"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        <Button
          onClick={addExperience}
          variant="outline"
          className="w-full border-dashed"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Work Experience
        </Button>
      </div>
    );
  };

  const renderEducationEditor = (education: Education[]) => {
    const addEducation = () => {
      const newEducation: Education = {
        institution: '',
        degree: '',
        field: '',
        from: '',
        to: '',
        gpa: ''
      };
      onChange([...education, newEducation]);
    };

    const updateEducation = (index: number, updatedEdu: Education) => {
      const updated = [...education];
      updated[index] = updatedEdu;
      onChange(updated);
    };

    const removeEducation = (index: number) => {
      const updated = education.filter((_, i) => i !== index);
      onChange(updated);
    };

    return (
      <div className="space-y-6">
        {education.map((edu, index) => (
          <Card key={index}>
            <CardHeader className="pb-4">
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg">Education {index + 1}</CardTitle>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => removeEducation(index)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Institution</Label>
                  <Input
                    value={edu.institution}
                    onChange={(e) => updateEducation(index, { ...edu, institution: e.target.value })}
                    placeholder="University of California, Berkeley"
                  />
                </div>
                <div>
                  <Label>Degree</Label>
                  <Input
                    value={edu.degree}
                    onChange={(e) => updateEducation(index, { ...edu, degree: e.target.value })}
                    placeholder="Bachelor of Science"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Field of Study</Label>
                  <Input
                    value={edu.field || ''}
                    onChange={(e) => updateEducation(index, { ...edu, field: e.target.value })}
                    placeholder="Computer Science"
                  />
                </div>
                <div>
                  <Label>Start Year</Label>
                  <Input
                    value={edu.from || ''}
                    onChange={(e) => updateEducation(index, { ...edu, from: e.target.value })}
                    placeholder="2018"
                  />
                </div>
                <div>
                  <Label>End Year</Label>
                  <Input
                    value={edu.to || ''}
                    onChange={(e) => updateEducation(index, { ...edu, to: e.target.value })}
                    placeholder="2022"
                  />
                </div>
              </div>
              
              <div>
                <Label>GPA (Optional)</Label>
                <Input
                  value={edu.gpa || ''}
                  onChange={(e) => updateEducation(index, { ...edu, gpa: e.target.value })}
                  placeholder="3.8"
                />
              </div>
            </CardContent>
          </Card>
        ))}

        <Button
          onClick={addEducation}
          variant="outline"
          className="w-full border-dashed"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Education
        </Button>
      </div>
    );
  };

  const renderSkillsEditor = (skills: SkillGroup[]) => {
    const addSkillGroup = () => {
      const newGroup: SkillGroup = {
        name: 'Technical Skills',
        items: [{ name: '' }]
      };
      onChange([...skills, newGroup]);
    };

    const updateSkillGroup = (index: number, updatedGroup: SkillGroup) => {
      const updated = [...skills];
      updated[index] = updatedGroup;
      onChange(updated);
    };

    const removeSkillGroup = (index: number) => {
      const updated = skills.filter((_, i) => i !== index);
      onChange(updated);
    };

    return (
      <div className="space-y-6">
        {skills.map((skillGroup, groupIndex) => (
          <Card key={groupIndex}>
            <CardHeader className="pb-4">
              <div className="flex justify-between items-center">
                <Input
                  value={skillGroup.name}
                  onChange={(e) => updateSkillGroup(groupIndex, { ...skillGroup, name: e.target.value })}
                  className="font-medium text-lg border-none px-0 focus:ring-0"
                  placeholder="Skill Category"
                />
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => removeSkillGroup(groupIndex)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {skillGroup.items.map((skill, skillIndex) => (
                  <div key={skillIndex} className="flex gap-2">
                    <Input
                      value={skill.name}
                      onChange={(e) => {
                        const updatedItems = [...skillGroup.items];
                        updatedItems[skillIndex] = { ...skill, name: e.target.value };
                        updateSkillGroup(groupIndex, { ...skillGroup, items: updatedItems });
                      }}
                      placeholder="JavaScript, React, Node.js..."
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        const updatedItems = skillGroup.items.filter((_, i) => i !== skillIndex);
                        updateSkillGroup(groupIndex, { ...skillGroup, items: updatedItems });
                      }}
                      className="text-red-600 hover:text-red-700 px-2"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const updatedItems = [...skillGroup.items, { name: '' }];
                    updateSkillGroup(groupIndex, { ...skillGroup, items: updatedItems });
                  }}
                  className="w-full border-dashed"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Skill
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        <Button
          onClick={addSkillGroup}
          variant="outline"
          className="w-full border-dashed"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Skill Category
        </Button>
      </div>
    );
  };

  const renderProjectsEditor = (projects: Project[]) => {
    return (
      <div className="space-y-4">
        {projects.map((project, index) => (
          <Card key={index}>
            <CardContent className="p-4">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <Label>Project Name</Label>
                  <Input
                    value={project.name}
                    onChange={(e) => {
                      const updated = [...projects];
                      updated[index].name = e.target.value;
                      onChange(updated);
                    }}
                    placeholder="Project Name"
                  />
                </div>
                <div>
                  <Label>Link (Optional)</Label>
                  <Input
                    value={project.link || ''}
                    onChange={(e) => {
                      const updated = [...projects];
                      updated[index].link = e.target.value;
                      onChange(updated);
                    }}
                    placeholder="https://..."
                  />
                </div>
              </div>
              <div className="mb-4">
                <Label>Description</Label>
                <Textarea
                  value={project.description}
                  onChange={(e) => {
                    const updated = [...projects];
                    updated[index].description = e.target.value;
                    onChange(updated);
                  }}
                  placeholder="Describe your project..."
                  rows={3}
                />
              </div>
              <div className="mb-4">
                <Label>Technologies Used</Label>
                <Input
                  value={project.technologies.join(', ')}
                  onChange={(e) => {
                    const updated = [...projects];
                    updated[index].technologies = e.target.value.split(',').map(t => t.trim()).filter(Boolean);
                    onChange(updated);
                  }}
                  placeholder="React, Node.js, PostgreSQL..."
                />
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => {
                  const updated = projects.filter((_, i) => i !== index);
                  onChange(updated);
                }}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Remove Project
              </Button>
            </CardContent>
          </Card>
        ))}
        
        <Button
          onClick={() => {
            const newProject: Project = {
              name: '',
              description: '',
              technologies: [],
              link: ''
            };
            onChange([...projects, newProject]);
          }}
          variant="outline"
          className="w-full border-dashed"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Project
        </Button>
      </div>
    );
  };

  const renderCertificationsEditor = (certifications: Certification[]) => {
    return (
      <div className="space-y-4">
        {certifications.map((cert, index) => (
          <Card key={index}>
            <CardContent className="p-4">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <Label>Certification Name</Label>
                  <Input
                    value={cert.name}
                    onChange={(e) => {
                      const updated = [...certifications];
                      updated[index].name = e.target.value;
                      onChange(updated);
                    }}
                    placeholder="AWS Certified Developer"
                  />
                </div>
                <div>
                  <Label>Issuing Organization</Label>
                  <Input
                    value={cert.issuer}
                    onChange={(e) => {
                      const updated = [...certifications];
                      updated[index].issuer = e.target.value;
                      onChange(updated);
                    }}
                    placeholder="Amazon Web Services"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <Label>Issue Date</Label>
                  <Input
                    value={cert.date}
                    onChange={(e) => {
                      const updated = [...certifications];
                      updated[index].date = e.target.value;
                      onChange(updated);
                    }}
                    placeholder="2023"
                  />
                </div>
                <div>
                  <Label>Expiry Date (Optional)</Label>
                  <Input
                    value={cert.expiryDate || ''}
                    onChange={(e) => {
                      const updated = [...certifications];
                      updated[index].expiryDate = e.target.value;
                      onChange(updated);
                    }}
                    placeholder="2025"
                  />
                </div>
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => {
                  const updated = certifications.filter((_, i) => i !== index);
                  onChange(updated);
                }}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Remove Certification
              </Button>
            </CardContent>
          </Card>
        ))}
        
        <Button
          onClick={() => {
            const newCert: Certification = {
              name: '',
              issuer: '',
              date: ''
            };
            onChange([...certifications, newCert]);
          }}
          variant="outline"
          className="w-full border-dashed"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Certification
        </Button>
      </div>
    );
  };

  const renderLanguagesEditor = (languages: Language[]) => {
    return (
      <div className="space-y-4">
        {languages.map((lang, index) => (
          <Card key={index}>
            <CardContent className="p-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Language</Label>
                  <Input
                    value={lang.name}
                    onChange={(e) => {
                      const updated = [...languages];
                      updated[index].name = e.target.value;
                      onChange(updated);
                    }}
                    placeholder="Spanish"
                  />
                </div>
                <div>
                  <Label>Fluency Level</Label>
                  <Input
                    value={lang.fluency}
                    onChange={(e) => {
                      const updated = [...languages];
                      updated[index].fluency = e.target.value;
                      onChange(updated);
                    }}
                    placeholder="Native, Fluent, Conversational, Basic"
                  />
                </div>
              </div>
              <Button
                variant="destructive"
                size="sm"
                className="mt-4"
                onClick={() => {
                  const updated = languages.filter((_, i) => i !== index);
                  onChange(updated);
                }}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Remove Language
              </Button>
            </CardContent>
          </Card>
        ))}
        
        <Button
          onClick={() => {
            const newLang: Language = {
              name: '',
              fluency: ''
            };
            onChange([...languages, newLang]);
          }}
          variant="outline"
          className="w-full border-dashed"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Language
        </Button>
      </div>
    );
  };

  const renderCustomSectionEditor = (sectionId: string, customSection: CustomSection) => {
    const addCustomItem = () => {
      const items = customSection.items || [];
      const updated = { ...customSection, items: [...items, ''] };
      onChange(updated);
    };

    const updateCustomItem = (itemIndex: number, value: string) => {
      const items = customSection.items || [];
      const updatedItems = [...items];
      updatedItems[itemIndex] = value;
      const updated = { ...customSection, items: updatedItems };
      onChange(updated);
    };

    const removeCustomItem = (itemIndex: number) => {
      const items = customSection.items || [];
      const updatedItems = items.filter((_, i) => i !== itemIndex);
      const updated = { ...customSection, items: updatedItems };
      onChange(updated);
    };

    return (
      <div className="space-y-6 pb-8">
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">{customSection.title || 'Custom Section'}</CardTitle>
              <Dialog>
                <DialogTrigger asChild>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Delete Custom Section</DialogTitle>
                    <DialogDescription>
                      Are you sure you want to delete "{customSection.title || 'this custom section'}"? 
                      This action cannot be undone and all content will be permanently removed.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button variant="outline">Cancel</Button>
                    </DialogClose>
                    <DialogClose asChild>
                      <Button 
                        variant="destructive" 
                        onClick={() => removeCustomSection(sectionId)}
                      >
                        Delete Section
                      </Button>
                    </DialogClose>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Section Title */}
            <div>
              <Label>Section Title</Label>
              <Input
                value={customSection.title}
                onChange={(e) => {
                  const updated = { ...customSection, title: e.target.value };
                  onChange(updated);
                }}
                placeholder="Section Title (e.g., Awards, Publications, Volunteer Work)"
              />
            </div>
            
            {/* Content */}
            <div>
              <Label>Description (Optional)</Label>
              <Textarea
                value={customSection.content || ''}
                onChange={(e) => {
                  const updated = { ...customSection, content: e.target.value };
                  onChange(updated);
                }}
                placeholder="Brief description or overview for this section..."
                rows={3}
              />
            </div>

            {/* Items/Bullets */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <Label>Items</Label>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={addCustomItem}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Item
                </Button>
              </div>
              <div className="space-y-2">
                {(customSection.items || []).map((item, itemIndex) => (
                  <div key={itemIndex} className="space-y-2">
                    {showAIRewrite && aiRewriteField === `custom-${sectionId}-item-${itemIndex}` ? (
                      <AIRewritePanel
                        sectionType="custom"
                        currentContent={item}
                        resume={resume}
                        onApply={(newContent) => {
                          updateCustomItem(itemIndex, newContent);
                          setShowAIRewrite(false);
                          setAIRewriteField('');
                        }}
                        onCancel={() => {
                          setShowAIRewrite(false);
                          setAIRewriteField('');
                        }}
                      />
                    ) : (
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <Textarea
                            value={item}
                            onChange={(e) => updateCustomItem(itemIndex, e.target.value)}
                            placeholder="• Add your achievement, award, or relevant information..."
                            className="min-h-16"
                          />
                          {item.trim() && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setAIRewriteField(`custom-${sectionId}-item-${itemIndex}`);
                                setShowAIRewrite(true);
                              }}
                              className="mt-1 text-xs h-6 px-2"
                            >
                              <Wand2 className="w-3 h-3 mr-1" />
                              AI Enhance
                            </Button>
                          )}
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeCustomItem(itemIndex)}
                          className="text-red-600 hover:text-red-700 px-2"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="pt-4 border-t">
          <p className="text-sm text-gray-500">
            You can use this section for additional information like awards, publications, volunteer work, or any other relevant content. Add items as bullet points to structure your information.
          </p>
        </div>
      </div>
    );
  };

  const renderSectionContent = () => {
    switch (sectionType) {
      case 'basics':
        return renderBasicsEditor(data as BasicInfo);
      case 'summary':
        return renderSummaryEditor(data as Summary);
      case 'experience':
        return renderExperienceEditor(data as Experience[]);
      case 'education':
        return renderEducationEditor(data as Education[]);
      case 'skills':
        return renderSkillsEditor(data as SkillGroup[]);
      case 'projects':
        return renderProjectsEditor(data as Project[]);
      case 'certifications':
        return renderCertificationsEditor(data as Certification[]);
      case 'languages':
        return renderLanguagesEditor(data as Language[]);
      default:
        // Check if it's a custom section
        if (sectionType.startsWith('custom_')) {
          return renderCustomSectionEditor(sectionType, data as CustomSection);
        }
        return (
          <div className="text-center py-8 text-gray-500">
            Editor for {sectionType} coming soon...
          </div>
        );
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto pb-20">
      {/* Section Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold capitalize">{sectionType}</h1>
            <p className="text-gray-600 mt-1">
              {sectionType === 'basics' && 'Your personal and contact information'}
              {sectionType === 'summary' && 'A brief overview of your professional background'}
              {sectionType === 'experience' && 'Your work history and achievements'}
              {sectionType === 'education' && 'Your educational background'}
              {sectionType === 'skills' && 'Your technical and professional skills'}
              {sectionType === 'projects' && 'Your personal and professional projects'}
              {sectionType === 'certifications' && 'Your professional certifications and licenses'}
              {sectionType === 'languages' && 'Languages you speak and your proficiency levels'}
              {sectionType.startsWith('custom_') && 'Add any additional information relevant to your career'}
            </p>
          </div>
          
          {suggestions.length > 0 && (
            <Button
              variant="outline"
              onClick={() => setShowSuggestions(!showSuggestions)}
              className="flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              {suggestions.length} AI Suggestions
            </Button>
          )}
        </div>

        {/* AI Suggestions */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="mt-4 space-y-2">
            {suggestions.map((suggestion, index) => (
              <Alert key={index} className="border-blue-200 bg-blue-50">
                <Sparkles className="w-4 h-4" />
                <AlertDescription className="flex justify-between items-center">
                  <div>
                    <strong>{suggestion.title}</strong>
                    <p className="text-sm mt-1">{suggestion.description}</p>
                    {suggestion.impact && (
                      <Badge variant="secondary" className="mt-1">
                        +{suggestion.impact}% ATS Score
                      </Badge>
                    )}
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleApplySuggestion(suggestion)}
                    className="ml-4"
                  >
                    Apply
                  </Button>
                </AlertDescription>
              </Alert>
            ))}
          </div>
        )}
      </div>

      {/* Section Content */}
      {renderSectionContent()}
    </div>
  );
};