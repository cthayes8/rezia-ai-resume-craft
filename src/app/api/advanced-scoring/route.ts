import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

interface JobDescriptionAnalysis {
  extractedSkills: string[];
  requiredQualifications: string[];
  preferredQualifications: string[];
  keywords: string[];
  jobTitle: string;
  experienceLevel: string;
  industry: string;
}

interface ResumeAnalysis {
  extractedSkills: string[];
  experience: {
    years: number;
    positions: string[];
    companies: string[];
  };
  education: {
    degrees: string[];
    institutions: string[];
  };
  keywords: string[];
  sections: string[];
}

interface MatchingResult {
  overallScore: number;
  categoryScores: {
    skillsMatch: number;
    experienceMatch: number;
    educationMatch: number;
    keywordDensity: number;
    atsCompatibility: number;
  };
  improvements: {
    category: string;
    priority: 'high' | 'medium' | 'low';
    suggestion: string;
    impact: number;
  }[];
  missingKeywords: string[];
  strongMatches: string[];
}

// Helper function to extract skills from text using keyword matching
function extractSkills(text: string): string[] {
  const commonSkills = [
    // Technical Skills
    'JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'C#', 'React', 'Vue.js', 'Angular',
    'Node.js', 'Express', 'FastAPI', 'Django', 'Flask', 'Spring', 'PostgreSQL', 'MySQL',
    'MongoDB', 'Redis', 'Docker', 'Kubernetes', 'AWS', 'Azure', 'GCP', 'Git', 'CI/CD',
    'Machine Learning', 'Data Science', 'Artificial Intelligence', 'Deep Learning',
    'TensorFlow', 'PyTorch', 'Pandas', 'NumPy', 'SQL', 'HTML', 'CSS', 'SASS', 'REST API',
    'GraphQL', 'Microservices', 'Agile', 'Scrum', 'DevOps', 'Linux', 'Bash',
    
    // Soft Skills
    'Leadership', 'Communication', 'Problem Solving', 'Team Collaboration', 'Project Management',
    'Critical Thinking', 'Adaptability', 'Time Management', 'Analytical Skills', 'Creativity',
    'Attention to Detail', 'Customer Service', 'Negotiation', 'Public Speaking', 'Mentoring',
    
    // Business Skills
    'Strategy', 'Marketing', 'Sales', 'Finance', 'Operations', 'HR', 'Business Development',
    'Product Management', 'UX/UI Design', 'Digital Marketing', 'SEO', 'SEM', 'Analytics',
    'Data Analysis', 'Business Intelligence', 'CRM', 'ERP', 'Supply Chain',
    
    // Certifications & Methodologies
    'PMP', 'CISSP', 'AWS Certified', 'Google Analytics', 'Salesforce', 'Six Sigma',
    'ITIL', 'Lean', 'Kanban', 'GDPR', 'SOX', 'ISO 27001'
  ];

  const extractedSkills: string[] = [];
  const lowerText = text.toLowerCase();
  
  commonSkills.forEach(skill => {
    if (lowerText.includes(skill.toLowerCase())) {
      extractedSkills.push(skill);
    }
  });
  
  return [...new Set(extractedSkills)];
}

// Helper function to calculate keyword density
function calculateKeywordDensity(resumeText: string, jobKeywords: string[]): number {
  const resumeLower = resumeText.toLowerCase();
  const wordCount = resumeText.split(/\s+/).length;
  
  let keywordMatches = 0;
  jobKeywords.forEach(keyword => {
    const matches = (resumeLower.match(new RegExp(keyword.toLowerCase(), 'g')) || []).length;
    keywordMatches += matches;
  });
  
  return Math.min((keywordMatches / wordCount) * 100, 100);
}

// Helper function to check ATS compatibility
function checkATSCompatibility(resumeText: string): number {
  let score = 100;
  
  // Check for common ATS issues
  const issues = [
    { pattern: /[^\x00-\x7F]/g, penalty: 10, description: 'Special characters' },
    { pattern: /\t/g, penalty: 5, description: 'Tab characters' },
    { pattern: /\s{3,}/g, penalty: 5, description: 'Multiple spaces' },
    { pattern: /[^\w\s@.-]/g, penalty: 2, description: 'Complex formatting' },
  ];
  
  issues.forEach(issue => {
    const matches = resumeText.match(issue.pattern);
    if (matches && matches.length > 0) {
      score -= Math.min(issue.penalty * matches.length, 30);
    }
  });
  
  // Check for essential sections
  const essentialSections = ['experience', 'education', 'skills', 'contact'];
  const missingEssential = essentialSections.filter(section => 
    !resumeText.toLowerCase().includes(section)
  );
  score -= missingEssential.length * 10;
  
  return Math.max(score, 0);
}

// Helper function to calculate skill match percentage
function calculateSkillMatch(resumeSkills: string[], jobSkills: string[]): number {
  if (jobSkills.length === 0) return 0;
  
  const matchedSkills = jobSkills.filter(jobSkill => 
    resumeSkills.some(resumeSkill => 
      resumeSkill.toLowerCase().includes(jobSkill.toLowerCase()) ||
      jobSkill.toLowerCase().includes(resumeSkill.toLowerCase())
    )
  );
  
  return (matchedSkills.length / jobSkills.length) * 100;
}

// Parse job description to extract key information
function parseJobDescription(jobDescription: string): JobDescriptionAnalysis {
  const skills = extractSkills(jobDescription);
  
  // Extract experience level
  const experiencePatterns = {
    'entry': /entry.level|0.2\s+years?|junior|graduate|new grad/i,
    'mid': /3.5\s+years?|mid.level|intermediate/i,
    'senior': /6\+?\s+years?|senior|lead|principal|staff/i,
    'executive': /director|vp|cto|ceo|executive|head of/i
  };
  
  let experienceLevel = 'mid';
  for (const [level, pattern] of Object.entries(experiencePatterns)) {
    if (pattern.test(jobDescription)) {
      experienceLevel = level;
      break;
    }
  }
  
  // Extract job title
  const titleMatch = jobDescription.match(/(?:position|role|title):\s*([^\n]+)/i) ||
                    jobDescription.match(/^([^\n]+(?:engineer|developer|manager|analyst|designer|specialist))/i);
  const jobTitle = titleMatch ? titleMatch[1].trim() : 'Software Engineer';
  
  return {
    extractedSkills: skills,
    requiredQualifications: skills.slice(0, Math.ceil(skills.length * 0.7)),
    preferredQualifications: skills.slice(Math.ceil(skills.length * 0.7)),
    keywords: skills,
    jobTitle,
    experienceLevel,
    industry: 'Technology'
  };
}

// Analyze resume content
function analyzeResume(resumeData: any): ResumeAnalysis {
  const resumeText = JSON.stringify(resumeData).toLowerCase();
  
  // Extract skills from all sections
  const skills = extractSkills(resumeText);
  
  // Analyze experience
  const experience = {
    years: resumeData.builder?.sections?.experience?.length || 0,
    positions: resumeData.builder?.sections?.experience?.map((exp: any) => exp.position || exp.title) || [],
    companies: resumeData.builder?.sections?.experience?.map((exp: any) => exp.company) || []
  };
  
  // Analyze education
  const education = {
    degrees: resumeData.builder?.sections?.education?.map((edu: any) => edu.degree) || [],
    institutions: resumeData.builder?.sections?.education?.map((edu: any) => edu.institution || edu.school) || []
  };
  
  return {
    extractedSkills: skills,
    experience,
    education,
    keywords: skills,
    sections: Object.keys(resumeData.builder?.sections || {})
  };
}

// Generate improvement suggestions
function generateImprovements(
  resumeAnalysis: ResumeAnalysis,
  jobAnalysis: JobDescriptionAnalysis,
  scores: any
): MatchingResult['improvements'] {
  const improvements: MatchingResult['improvements'] = [];
  
  // Skill-based improvements
  if (scores.skillsMatch < 70) {
    const missingSkills = jobAnalysis.extractedSkills.filter(skill => 
      !resumeAnalysis.extractedSkills.includes(skill)
    );
    
    if (missingSkills.length > 0) {
      improvements.push({
        category: 'Skills',
        priority: 'high',
        suggestion: `Add these missing key skills: ${missingSkills.slice(0, 5).join(', ')}`,
        impact: 25
      });
    }
  }
  
  // Keyword density improvements
  if (scores.keywordDensity < 2) {
    improvements.push({
      category: 'Keywords',
      priority: 'high',
      suggestion: 'Increase keyword density by incorporating more job-relevant terms throughout your resume',
      impact: 20
    });
  }
  
  // ATS compatibility improvements
  if (scores.atsCompatibility < 80) {
    improvements.push({
      category: 'ATS Compatibility',
      priority: 'medium',
      suggestion: 'Improve ATS compatibility by using standard formatting, avoiding special characters, and using clear section headers',
      impact: 15
    });
  }
  
  // Experience improvements
  if (scores.experienceMatch < 60) {
    improvements.push({
      category: 'Experience',
      priority: 'medium',
      suggestion: 'Highlight more relevant experience and use stronger action verbs to describe your achievements',
      impact: 18
    });
  }
  
  return improvements.sort((a, b) => {
    const priorityWeight = { high: 3, medium: 2, low: 1 };
    return priorityWeight[b.priority] - priorityWeight[a.priority] || b.impact - a.impact;
  });
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { resumeData, jobDescription } = await request.json();

    if (!resumeData || !jobDescription) {
      return NextResponse.json(
        { error: 'Resume data and job description are required' },
        { status: 400 }
      );
    }

    // Parse job description
    const jobAnalysis = parseJobDescription(jobDescription);
    
    // Analyze resume
    const resumeAnalysis = analyzeResume(resumeData);
    
    // Calculate individual scores
    const skillsMatch = calculateSkillMatch(resumeAnalysis.extractedSkills, jobAnalysis.extractedSkills);
    const keywordDensity = calculateKeywordDensity(JSON.stringify(resumeData), jobAnalysis.keywords);
    const atsCompatibility = checkATSCompatibility(JSON.stringify(resumeData));
    
    // Calculate experience match (simplified)
    const experienceMatch = Math.min(
      (resumeAnalysis.experience.years / Math.max(parseInt(jobAnalysis.experienceLevel === 'senior' ? '5' : '3'), 1)) * 100,
      100
    );
    
    // Calculate education match (simplified)
    const educationMatch = resumeAnalysis.education.degrees.length > 0 ? 85 : 50;
    
    // Calculate overall score with weights
    const weights = {
      skillsMatch: 0.35,
      experienceMatch: 0.25,
      educationMatch: 0.15,
      keywordDensity: 0.15,
      atsCompatibility: 0.10
    };
    
    const categoryScores = {
      skillsMatch: Math.round(skillsMatch),
      experienceMatch: Math.round(experienceMatch),
      educationMatch: Math.round(educationMatch),
      keywordDensity: Math.round(keywordDensity),
      atsCompatibility: Math.round(atsCompatibility)
    };
    
    const overallScore = Math.round(
      skillsMatch * weights.skillsMatch +
      experienceMatch * weights.experienceMatch +
      educationMatch * weights.educationMatch +
      keywordDensity * weights.keywordDensity +
      atsCompatibility * weights.atsCompatibility
    );
    
    // Generate improvements
    const improvements = generateImprovements(resumeAnalysis, jobAnalysis, categoryScores);
    
    // Find missing keywords
    const missingKeywords = jobAnalysis.extractedSkills.filter(skill => 
      !resumeAnalysis.extractedSkills.some(resumeSkill => 
        resumeSkill.toLowerCase().includes(skill.toLowerCase())
      )
    );
    
    // Find strong matches
    const strongMatches = jobAnalysis.extractedSkills.filter(skill => 
      resumeAnalysis.extractedSkills.some(resumeSkill => 
        resumeSkill.toLowerCase().includes(skill.toLowerCase())
      )
    );
    
    const result: MatchingResult = {
      overallScore,
      categoryScores,
      improvements,
      missingKeywords: missingKeywords.slice(0, 10),
      strongMatches: strongMatches.slice(0, 10)
    };

    return NextResponse.json({
      success: true,
      data: {
        matching: result,
        jobAnalysis: {
          title: jobAnalysis.jobTitle,
          skills: jobAnalysis.extractedSkills,
          experienceLevel: jobAnalysis.experienceLevel,
          industry: jobAnalysis.industry
        },
        resumeAnalysis: {
          skills: resumeAnalysis.extractedSkills,
          sections: resumeAnalysis.sections,
          experienceYears: resumeAnalysis.experience.years
        }
      }
    });

  } catch (error) {
    console.error('Advanced scoring error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}